// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { Resend } from 'resend';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { email } = await request.json();

    console.log('🔐 Password reset requested for:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Check if user exists in applicant_accounts table
    const userQuery = 'SELECT id, email, first_name, last_name, email_verified FROM applicant_accounts WHERE email = $1';
    const userResult = await client.query(userQuery, [email.toLowerCase()]);

    console.log('📊 User search result:', {
      found: userResult.rows.length > 0,
      email: email.toLowerCase()
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Check if user's email is verified
      if (!user.email_verified) {
        console.log('⚠️ Password reset attempted for unverified email:', email);
        // Still return success but don't send email
        return NextResponse.json(
          { 
            message: 'If an account with that email exists, you will receive a password reset link shortly.',
            sent: false
          },
          { 
            status: 200,
            headers: corsHeaders
          }
        );
      }

      // Generate password reset token
      const resetToken = jwt.sign(
        {
          userId: user.id.toString(),
          email: user.email,
          type: 'password_reset'
        },
        JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

      // Create reset link
      const resetLink = `${process.env.NODE_ENV === 'production' 
        ? 'https://precise-analytics-ats.vercel.app' 
        : 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      console.log('📧 Sending reset email to:', email);

      // Send actual email using Resend
      try {
        const emailResult = await resend.emails.send({
          from: 'Precise Analytics <noreply@preciseanalytics.io>',
          to: [user.email],
          subject: 'Password Reset - Precise Analytics ATS',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <div style="background: linear-gradient(45deg, #ff6b35, #f7931e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 24px; font-weight: bold; margin-bottom: 10px;">
                  Precise Analytics
                </div>
                <p style="color: white; margin: 0; font-size: 18px;">Password Reset Request</p>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Hi ${user.first_name || 'there'},</p>
                
                <p>You requested a password reset for your Precise Analytics ATS account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            font-weight: bold;
                            display: inline-block;">
                    Reset Your Password
                  </a>
                </div>
                
                <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                
                <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px;">
                  Best regards,<br>
                  The Precise Analytics Team<br>
                  <em>Minority-Owned • Veteran-Owned • SDVOSB Certified</em>
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${resetLink}</span>
                </p>
              </div>
            </body>
            </html>
          `,
          text: `
Hi ${user.first_name || 'there'},

You requested a password reset for your Precise Analytics ATS account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
The Precise Analytics Team
Minority-Owned • Veteran-Owned • SDVOSB Certified
          `
        });

        console.log('✅ Password reset email sent successfully:', {
          messageId: emailResult.data?.id,
          email: user.email
        });

      } catch (emailError: any) {
        console.error('❌ Failed to send password reset email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send reset email. Please try again.' },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }

    } else {
      console.log('⚠️ Password reset attempted for non-existent email:', email);
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      { 
        message: 'If an account with that email exists, you will receive a password reset link shortly.',
        sent: true
      },
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  } finally {
    client.release();
  }
}