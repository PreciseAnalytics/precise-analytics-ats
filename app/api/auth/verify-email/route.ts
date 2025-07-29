// app/api/auth/verify-email/route.ts
// CREATE this new endpoint for email verification

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

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
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification link. Please request a new verification email.'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if token is for email verification
    if (decoded.type !== 'email_verification') {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification link'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const email = decoded.email;
    const userId = decoded.userId;

    // Check if user exists and get current verification status
    const userQuery = 'SELECT id, email, email_verified, first_name, last_name FROM applicant_accounts WHERE id = $1 AND email = $2';
    const userResult = await client.query(userQuery, [userId, email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email address is already verified. You can now sign in to your account.',
        alreadyVerified: true
      }, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Update user's email verification status
    const updateQuery = `
      UPDATE applicant_accounts 
      SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND email = $2
    `;
    
    const updateResult = await client.query(updateQuery, [userId, email]);

    if (updateResult.rowCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify email'
      }, {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('✅ Email verification successful for:', email);

    return NextResponse.json({
      success: true,
      message: `Welcome ${user.first_name}! Your email has been verified successfully. You can now sign in to your account and apply for positions.`,
      user: {
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        email_verified: true
      }
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Email verification failed. Please try again.'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}

// GET method for handling verification links from email
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    // Redirect to careers page with error
    return NextResponse.redirect('https://preciseanalytics.io/careers?error=invalid_verification_link');
  }

  // Process the verification using the same logic as POST
  const verificationResult = await this.POST(request);
  const resultData = await verificationResult.json();

  if (resultData.success) {
    // Redirect to careers page with success message
    return NextResponse.redirect('https://preciseanalytics.io/careers?verified=true');
  } else {
    // Redirect to careers page with error
    return NextResponse.redirect(`https://preciseanalytics.io/careers?error=${encodeURIComponent(resultData.error)}`);
  }
}