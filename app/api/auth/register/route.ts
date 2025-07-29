// REPLACE your register/route.ts with this CORS-fixed version:
// app/api/auth/register/route.ts

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

// FIXED: CORS headers with specific origin instead of wildcard
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io', // CHANGED: No more wildcard!
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true', // ADDED: Required for credentials
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// REGISTER (POST)
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
        headers: corsHeaders // FIXED: Use proper CORS headers
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
    const existingUserQuery = 'SELECT id, email FROM applicant_accounts WHERE email = $1';
    const existingUserResult = await client.query(existingUserQuery, [email.toLowerCase()]);

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'An account with this email already exists'
      }, {
        status: 409,
        headers: corsHeaders
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
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

    // Create user object for response
    const user = {
      id: newUser.id.toString(),
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      name: `${newUser.first_name} ${newUser.last_name}`,
      role: 'applicant',
      created_at: newUser.created_at
    };

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful for:', email);

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: user,
      message: 'Account created successfully'
    }, {
      status: 201,
      headers: corsHeaders // FIXED: Use proper CORS headers
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Optional: Send welcome email
    try {
      console.log('📧 Welcome email would be sent to:', email);
    } catch (emailError) {
      console.warn('📧 Failed to send welcome email:', emailError);
    }

    return response;

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

// GET method for compatibility (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to register'
  }, {
    status: 405,
    headers: corsHeaders
  });
}