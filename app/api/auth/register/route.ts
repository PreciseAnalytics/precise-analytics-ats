// app/api/auth/register/route.ts
// UPDATED version with email verification

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const body = await request.json();
    const { email, password, firstName, lastName, confirmPassword } = body;

    console.log('📝 Registration attempt for:', email);

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate password confirmation (if provided)
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'Passwords do not match'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate name fields
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'First name and last name must be at least 2 characters'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id, email, email_verified FROM applicant_accounts WHERE email = $1';
    const existingUserResult = await client.query(existingUserQuery, [email.toLowerCase()]);

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      
      if (!existingUser.email_verified) {
        // User exists but email not verified - resend verification email
        const verificationToken = jwt.sign(
          { email: email.toLowerCase(), userId: existingUser.id, type: 'email_verification' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        await sendVerificationEmail(email, firstName, verificationToken);

        return NextResponse.json({
          success: false,
          error: 'An account with this email already exists but is not verified. We\'ve sent a new verification email.'
        }, {
          status: 409,
          headers: corsHeaders
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'An account with this email already exists and is verified. Please sign in instead.'
      }, {
        status: 409,
        headers: corsHeaders
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account (email_verified = false initially)
    const insertUserQuery = `
      INSERT INTO applicant_accounts (
        email, password_hash, first_name, last_name, 
        is_active, email_verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, true, false, NOW(), NOW()
      ) RETURNING id, email, first_name, last_name, created_at
    `;

    const insertResult = await client.query(insertUserQuery, [
      email.toLowerCase(),
      hashedPassword,
      firstName.trim(),
      lastName.trim()
    ]);

    const newUser = insertResult.rows[0];

    // Generate verification token (expires in 24 hours)
    const verificationToken = jwt.sign(
      { 
        email: newUser.email, 
        userId: newUser.id,
        type: 'email_verification' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.first_name, verificationToken);

    console.log('✅ Registration successful for:', email, '- Verification email sent');

    // Return success without setting auth cookie (user must verify email first)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email and click the verification link to complete your registration.',
      requiresVerification: true,
      user: {
        id: newUser.id.toString(),
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email_verified: false
      }
    }, {
      status: 201,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({
        success: false,
        error: 'An account with this email already exists'
      }, {
        status: 409,
        headers: corsHeaders
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}

// Helper function to send verification email
async function sendVerificationEmail(email: string, firstName: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured, verification email not sent');
    return;
  }

  const verificationUrl = `https://preciseanalytics.io/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Precise Analytics <noreply@preciseanalytics.io>',
      to: email,
      subject: 'Verify Your Email - Precise Analytics',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - Precise Analytics</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff7d00 0%, #ffa500 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Precise Analytics!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Please verify your email address</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Hi ${firstName},</h2>
            
            <p style="margin-bottom: 20px; font-size: 16px;">
              Thank you for creating an account with Precise Analytics! To complete your registration and start applying for positions, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #ff7d00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Verify My Email
              </a>
            </div>
            
            <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; background: #f7fafc; padding: 10px; border-radius: 4px; font-size: 14px; color: #2d3748;">
              ${verificationUrl}
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
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
              This email was sent to ${email} from Precise Analytics.<br>
              If you have any questions, please contact us at careers@preciseanalytics.io
            </p>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('✅ Verification email sent to:', email);
  } catch (emailError) {
    console.error('❌ Failed to send verification email:', emailError);
    throw emailError; // Re-throw to handle in main function
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to register'
  }, {
    status: 405,
    headers: corsHeaders
  });
}