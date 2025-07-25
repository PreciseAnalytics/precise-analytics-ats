// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

// VERIFY SESSION (GET)
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token found'
      }, {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Create user object from decoded token
      const user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === 'careers@preciseanalytics.io' ? 'Precise Analytics HR' : decoded.email,
        role: decoded.role || 'admin'
      };

      console.log('✅ Token verified for user:', user.email);

      return NextResponse.json({
        success: true,
        user: user,
        message: 'Authentication verified'
      }, {
        headers: corsHeaders
      });

    } catch (jwtError: any) {
      console.log('❌ Invalid token:', jwtError.message);
      
      // Token is invalid, clear the cookie
      const response = NextResponse.json({
        success: false,
        error: 'Invalid authentication token'
      }, {
        status: 401,
        headers: corsHeaders
      });

      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });

      return response;
    }

  } catch (error: any) {
    console.error('❌ Auth verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication verification failed',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST method for additional verification if needed
export async function POST(request: NextRequest) {
  // Same logic as GET for flexibility
  return GET(request);
}