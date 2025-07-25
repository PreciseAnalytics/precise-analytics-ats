// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For security, we'll only allow the specific admin email
    const allowedEmail = 'careers@preciseanalytics.io';
    if (email.toLowerCase() !== allowedEmail.toLowerCase()) {
      // Return success message anyway to prevent email enumeration
      return NextResponse.json(
        { message: 'If this email exists in our system, you will receive reset instructions.' },
        { status: 200 }
      );
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { email, type: 'password_reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await resend.emails.send({
        from: 'ATS System <noreply@preciseanalytics.io>',
        to: email,
        subject: 'Password Reset Request - Precise Analytics ATS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Precise Analytics</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Precise Analytics</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Applicant Tracking System</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
              
              <p style="margin-bottom: 20px; font-size: 16px;">Hello,</p>
              
              <p style="margin-bottom: 20px; font-size: 16px;">
                We received a request to reset your password for the Precise Analytics ATS system. 
                If you didn't make this request, you can safely ignore this email.
              </p>
              
              <p style="margin-bottom: 30px; font-size: 16px;">
                To reset your password, click the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
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
                <span style="color: #4299e1;">careers@preciseanalytics.io</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
              <p style="margin: 0;">
                This email was sent from the Precise Analytics ATS system.<br>
                If you have any questions, please contact us at careers@preciseanalytics.io
              </p>
            </div>
          </body>
          </html>
        `,
      });

      return NextResponse.json(
        { message: 'Password reset instructions have been sent to your email.' },
        { status: 200 }
      );

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}