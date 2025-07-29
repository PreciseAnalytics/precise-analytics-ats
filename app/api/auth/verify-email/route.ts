// app/api/auth/verify-email/route.ts
// REPLACE your verify-email route with this fixed version

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

// GET method for handling verification links from email (main entry point)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    // Redirect to careers page with error
    return NextResponse.redirect('https://preciseanalytics.io/careers?error=missing_token');
  }

  const client = await pool.connect();
  
  try {
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      client.release();
      return NextResponse.redirect('https://preciseanalytics.io/careers?error=invalid_token');
    }

    // Check if token is for email verification
    if (decoded.type !== 'email_verification') {
      client.release();
      return NextResponse.redirect('https://preciseanalytics.io/careers?error=invalid_link');
    }

    const email = decoded.email;
    const userId = decoded.userId;

    // Check if user exists and get current verification status
    const userQuery = 'SELECT id, email, email_verified, first_name, last_name FROM applicant_accounts WHERE id = $1 AND email = $2';
    const userResult = await client.query(userQuery, [userId, email]);

    if (userResult.rows.length === 0) {
      client.release();
      return NextResponse.redirect('https://preciseanalytics.io/careers?error=user_not_found');
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      client.release();
      return NextResponse.redirect('https://preciseanalytics.io/careers?verified=already');
    }

    // Update user's email verification status
    const updateQuery = `
      UPDATE applicant_accounts 
      SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND email = $2
    `;
    
    const updateResult = await client.query(updateQuery, [userId, email]);

    if (updateResult.rowCount === 0) {
      client.release();
      return NextResponse.redirect('https://preciseanalytics.io/careers?error=verification_failed');
    }

    console.log('✅ Email verification successful for:', email);

    // Generate login JWT token to auto-login the user
    const loginToken = jwt.sign(
      { 
        userId: user.id.toString(), 
        email: user.email,
        role: 'applicant' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create redirect response to careers page with success
    const redirectResponse = NextResponse.redirect('https://preciseanalytics.io/careers?verified=success');
    
    // Set HTTP-only cookie to auto-login the user
    redirectResponse.cookies.set('auth-token', loginToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: '.preciseanalytics.io' // Allow cookie across subdomains
    });

    client.release();
    return redirectResponse;

  } catch (error) {
    console.error('❌ Email verification error:', error);
    client.release();
    return NextResponse.redirect('https://preciseanalytics.io/careers?error=server_error');
  }
}

// POST method for API-based verification (optional)
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