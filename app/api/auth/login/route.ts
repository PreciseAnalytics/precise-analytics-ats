// app/api/auth/login/route.ts — HR users only, with improved JWT claims (Issue #2)
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Strictly require required JWT env vars (no fallbacks)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}
const JWT_ISSUER = process.env.JWT_ISSUER;
if (!JWT_ISSUER) {
  throw new Error('JWT_ISSUER is not defined in environment variables.');
}
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
if (!JWT_AUDIENCE) {
  throw new Error('JWT_AUDIENCE is not defined in environment variables.');
}

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

    console.log('HR login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Connect to database
    console.log('Connecting to database for HR login...');
    client = await pool.connect();
    console.log('Database connected');

    // Check hr_users table only
    console.log('Searching for HR user...');
    const userQuery = `
      SELECT id, email, password_hash, first_name, last_name, role, 
             is_active, email_verified, password_set
      FROM hr_users 
      WHERE email = $1
    `;
    const userResult = await client.query(userQuery, [email.toLowerCase()]);

    console.log('Database search result:', {
      rowCount: userResult.rows.length,
      email: email.toLowerCase()
    });

    if (userResult.rows.length === 0) {
      console.log('HR user not found in database');
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
    console.log('HR user found:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      is_active: user.is_active,
      email_verified: user.email_verified,
      password_set: user.password_set
    });

    // Check if account is active
    if (!user.is_active) {
      console.log('HR account is deactivated');
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Your account has been deactivated. Please contact your administrator.'
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      console.log('Unverified email login attempt:', email);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Please complete your account setup by verifying your email address.',
        requiresSetup: true
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Check if password has been set
    if (!user.password_set) {
      console.log('Password not set for HR user:', email);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Please complete your account setup by setting your password.',
        requiresSetup: true
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // Verify password
    console.log('Verifying password...');
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Password verification result:', isValidPassword);
    } catch (passwordError) {
      console.error('Password verification error:', passwordError);
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
      console.log('Invalid password for HR user:', email);
      client.release();
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
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
      role: user.role
    };

    // Update last login timestamp
    await client.query(
      'UPDATE hr_users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log successful login in audit table
    const auditQuery = `
      INSERT INTO hr_user_audit (hr_user_id, action, details)
      VALUES ($1, 'login', $2)
    `;
    await client.query(auditQuery, [
      user.id,
      JSON.stringify({ 
        login_time: new Date().toISOString(),
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
    ]);

    // Generate JWT token with clean claims
    console.log('Generating JWT token...');
    const token = jwt.sign(
      {
        // custom claims
        token_type: 'hr_user',
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      },
      JWT_SECRET,
      {
        // standard claims / options
        expiresIn: '7d',                 // sets exp; iat is auto-added
        subject: userData.id,           // sub
        issuer: JWT_ISSUER,             // iss
        audience: JWT_AUDIENCE,         // aud
      }
    );

    console.log('HR login successful for:', email);

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
      maxAge: 7 * 24 * 60 * 60, // seconds
      path: '/'
    });

    client.release();
    return response;

  } catch (error: any) {
    console.error('HR login error:', error);
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
    console.log('HR logout request');

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
    console.error('Logout error:', error);
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
