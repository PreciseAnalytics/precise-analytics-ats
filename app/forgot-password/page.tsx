// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Check if user's email is verified
      if (!user.email_verified) {
        console.log('Password reset attempted for unverified email:', email);
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

      // In a real application, you would send this email using a service like:
      // - SendGrid
      // - AWS SES  
      // - Nodemailer with SMTP
      // - Resend
      
      // For now, we'll log the reset link and simulate sending
      console.log('Password reset requested for:', email);
      console.log('Reset link (would be emailed):', resetLink);

      // TODO: Replace this with actual email sending
      const emailContent = `
        Hi ${user.first_name},

        You requested a password reset for your Precise Analytics ATS account.

        Click the link below to reset your password:
        ${resetLink}

        This link will expire in 1 hour for security reasons.

        If you didn't request this password reset, please ignore this email.

        Best regards,
        The Precise Analytics Team
      `;

      console.log('Email content (would be sent):', emailContent);

      // Here you would actually send the email:
      /*
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset - Precise Analytics ATS',
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>')
        });
        console.log('Password reset email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send reset email. Please try again.' },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }
      */

      // Store reset request in database for audit purposes (optional)
      try {
        const auditQuery = `
          INSERT INTO password_reset_requests (user_id, email, requested_at, expires_at)
          VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour')
          ON CONFLICT (user_id) DO UPDATE SET
            requested_at = NOW(),
            expires_at = NOW() + INTERVAL '1 hour'
        `;
        
        // Only execute if the table exists
        // await client.query(auditQuery, [user.id, email]);
      } catch (auditError) {
        // Table might not exist yet - that's fine
        console.log('Audit logging skipped (table might not exist)');
      }
    } else {
      console.log('Password reset attempted for non-existent email:', email);
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

  } catch (error) {
    console.error('Forgot password error:', error);
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