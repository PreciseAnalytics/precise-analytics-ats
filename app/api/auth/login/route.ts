// app/api/auth/login/route.ts
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
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// LOGIN (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // For development/demo - allow simple password check
    // In production, you should hash passwords in the database
    if (email === 'careers@preciseanalytics.io') {
      // Simple password validation for demo
      // You can set any password you want here
      const isValidPassword = password === 'admin123' || password === 'careers123' || password.length >= 6;
      
      if (isValidPassword) {
        // Create user object
        const user = {
          id: '1',
          email: 'careers@preciseanalytics.io',
          name: 'Precise Analytics HR',
          role: 'admin'
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

        console.log('✅ Login successful for:', email);

        // Create response with token in cookie
        const response = NextResponse.json({
          success: true,
          user: user,
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

        return response;
      }
    }

    // Invalid credentials
    console.log('❌ Invalid login attempt for:', email);
    return NextResponse.json({
      success: false,
      error: 'Invalid email or password'
    }, {
      status: 401,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      details: error.message
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

// GET method for compatibility (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to login'
  }, {
    status: 405,
    headers: corsHeaders
  });
}