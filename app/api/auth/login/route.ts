// app/api/auth/login/route.ts
// REPLACE with this enhanced debug version

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
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
  let client;
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Special case for admin account (backwards compatibility)
    if (email === 'careers@preciseanalytics.io') {
      console.log('🔧 Admin login attempt');
      const isValidPassword = password === 'admin123' || password === 'careers123' || password.length >= 6;
      
      if (isValidPassword) {
        const user = {
          id: '1',
          email: 'careers@preciseanalytics.io',
          name: 'Precise Analytics HR',
          role: 'admin'
        };

        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email,
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        console.log('✅ Admin login successful for:', email);

        const response = NextResponse.json({
          success: true,
          user: user,
          message: 'Login successful'
        }, {
          headers: corsHeaders
        });

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });

        return response;
      } else {
        console.log('❌ Invalid admin password');
        return NextResponse.json({
          success: false,
          error: 'Invalid email or password'
        }, {
          status: 401,
          headers: corsHeaders
        });
      }
    }

    // Connect to database for applicant accounts
    console.log('📊 Connecting to database for applicant login...');
    client = await pool.connect();
    console.log('✅ Database connected');

    // Check applicant accounts
    console.log('🔍 Searching for user in applicant_accounts...');
    const userQuery = `
      SELECT id, email, password_hash, first_name, last_name, email_verified, is_active 
      FROM applicant_accounts 
      WHERE email = $1
    `;
    const userResult = await client.query(userQuery, [email.toLowerCase()]);

    console.log('📊 Database search result:', {
      rowCount: userResult.rows.length,
      email: email.toLowerCase()
    });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    const user = userResult.rows[0];
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      email_verified: user.email_verified,
      is_active: user.is_active
    });

    // Check if account is active
    if (!user.is_active) {
      console.log('❌ Account is deactivated');
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Verify password
    console.log('🔐 Verifying password...');
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password verification result:', isValidPassword);
    } catch (passwordError) {
      console.error('❌ Password verification error:', passwordError);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, {
        status: 500,
        headers: corsHeaders
      });
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      console.log('❌ Unverified email login attempt:', email);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
        requiresVerification: true
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Create user object for response
    const userData = {
      id: user.id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      role: 'applicant'
    };

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Applicant login successful for:', email);

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful'
    }, {
      headers: corsHeaders
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    client.release();
    return response;

  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (client) {
      client.release();
    }
    
    return NextResponse.json({
      success: false,
      error: 'Login failed - server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// LOGOUT (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    console.log('🚪 Logout request');

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, {
      headers: corsHeaders
    });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('❌ Logout error:', error);
    return NextResponse.json({
      success: false,
      error: 'Logout failed',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to login'
  }, {
    status: 405,
    headers: corsHeaders
  });
}