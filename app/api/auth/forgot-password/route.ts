// app/api/auth/forgot-password/route.ts
// REPLACE your forgot-password route with this version that supports applicant accounts:

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
        { error: 'Invalid email format' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Check if user exists in applicant_accounts table
    const userQuery = 'SELECT id, email, first_name, last_name FROM applicant_accounts WHERE email = $1';
    const userResult = await client.query(userQuery, [email.toLowerCase()]);

    // For security, always return success message (prevent email enumeration)
    const successMessage = 'If this email exists in our system, you will receive reset instructions.';

    if (userResult.rows.length === 0) {
      // User doesn't exist, but return success to prevent enumeration
      return NextResponse.json(
        { message: successMessage },
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }

    const user = userResult.rows[0];

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { 
        email: user.email, 
        userId: user.id,
        type: 'password_reset' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create reset URL pointing to your main website
    const resetUrl = `https://preciseanalytics.io/reset-password?token=${resetToken}`;

    // Send email (only if RESEND_API_KEY is configured)
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Precise Analytics <noreply@preciseanalytics.io>',
          to: user.email,
          subject: 'Password Reset Request - Precise Analytics',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset - Precise Analytics</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #ff7d00 0%, #ffa500 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Precise Analytics</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
              </div>
              
              <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Hi ${user.first_name},</h2>
                
                <p style="margin-bottom: 20px; font-size: 16px;">
                  We received a request to reset your password for your Precise Analytics account. 
                  If you didn't make this request, you can safely ignore this email.
                </p>
                
                <p style="margin-bottom: 30px; font-size: 16px;">
                  To reset your password, click the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #ff7d00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Reset My Password
                  </a>
                </div>
                
                <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="word-break: break-all; background: #f7fafc; padding: 10px; border-radius: 4px; font-size: 14px; color: #2d3748;">
                  ${resetUrl}
                </p>
                
                <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #c53030;">
                    <strong>Security Notice:</strong> This link will expire in 1 hour for your security. 
                    If you need a new reset link, please request another password reset.
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666; margin-bottom: 0;">
                  Best regards,<br>
                  The Precise Analytics Team<br>
                  <span style="color: #ff7d00;">careers@preciseanalytics.io</span>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
                <p style="margin: 0;">
                  This email was sent to ${user.email} from Precise Analytics.<br>
                  If you have any questions, please contact us at careers@preciseanalytics.io
                </p>
              </div>
            </body>
            </html>
          `,
        });
        
        console.log('✅ Password reset email sent to:', user.email);
      } else {
        console.log('⚠️ RESEND_API_KEY not configured, reset email not sent');
      }

      return NextResponse.json(
        { message: successMessage },
        { 
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success to prevent enumeration
      return NextResponse.json(
        { message: successMessage },
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  } finally {
    client.release();
  }
}