// app/api/auth/forgot-password/route.ts - Updated for HR Users Only
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { Resend } from 'resend';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find HR user by email
      const result = await client.query(
        `SELECT id, email, first_name, last_name, is_active, email_verified, password_set
         FROM hr_users 
         WHERE email = $1`,
        [email.toLowerCase()]
      );

      // Always return success to prevent email enumeration
      const successResponse = NextResponse.json({
        success: true,
        message: 'If an account exists with that email, you will receive password reset instructions.'
      });

      if (result.rows.length === 0) {
        return successResponse;
      }

      const user = result.rows[0];

      // Check if account is active and properly set up
      if (!user.is_active || !user.email_verified || !user.password_set) {
        return successResponse;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await client.query(
        `UPDATE hr_users 
         SET invitation_token = $1, invitation_expires_at = $2, updated_at = NOW()
         WHERE id = $3`,
        [resetToken, resetExpires, user.id]
      );

      // Log password reset request
      await client.query(
        `INSERT INTO hr_user_audit (hr_user_id, action, performed_by_email, details)
         VALUES ($1, 'password_reset_requested', $2, $3)`,
        [
          user.id,
          user.email,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            ip_address: request.ip || 'unknown'
          })
        ]
      );

      // Send reset email
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: 'Precise Analytics ATS <noreply@preciseanalytics.io>',
        to: user.email,
        subject: 'Password Reset Request - Precise Analytics ATS',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Request</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Precise Analytics</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">ATS Password Reset</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <h2 style="color: #495057; margin-bottom: 20px;">Password Reset Request</h2>
                
                <p style="margin-bottom: 20px;">Hello ${user.first_name},</p>
                
                <p style="margin-bottom: 20px;">
                  We received a request to reset your password for your Precise Analytics ATS account. 
                  If you made this request, click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Reset My Password
                  </a>
                </div>
                
                <p style="margin-bottom: 15px; font-size: 14px; color: #6c757d;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="word-break: break-all; font-size: 14px; color: #6c757d; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">
                  ${resetUrl}
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                  <p style="font-size: 14px; color: #6c757d; margin-bottom: 10px;">
                    <strong>Security Notice:</strong>
                  </p>
                  <ul style="font-size: 14px; color: #6c757d; padding-left: 20px;">
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you complete the reset process</li>
                  </ul>
                </div>
                
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #868e96;">
                  <p>This is an automated message from Precise Analytics ATS. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      return successResponse;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
