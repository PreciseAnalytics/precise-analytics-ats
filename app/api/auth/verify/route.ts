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
  let client;
  
  try {
    console.log('🔍 Auth verification request received');
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      console.log('❌ No authentication token found');
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
      console.log('✅ JWT token verified for:', decoded.email);
      
      // Handle admin/HR users (backwards compatibility)
      if (decoded.email === 'careers@preciseanalytics.io' || decoded.role === 'admin') {
        const adminUser = {
          id: decoded.userId,
          email: decoded.email,
          first_name: 'Precise Analytics',
          last_name: 'HR',
          name: 'Precise Analytics HR',
          role: 'admin'
        };

        console.log('✅ Admin user verified:', adminUser.email);

        return NextResponse.json({
          success: true,
          user: adminUser,
          message: 'Admin authentication verified'
        }, {
          headers: corsHeaders
        });
      }

      // For applicant users, verify against database
      if (decoded.role === 'applicant' || !decoded.role) {
        console.log('🔍 Verifying applicant user in database...');
        
        client = await pool.connect();
        
        // Check applicant exists and is active
        const userQuery = `
          SELECT id, email, first_name, last_name, email_verified, is_active 
          FROM applicant_accounts 
          WHERE id = $1 AND email = $2
        `;
        const userResult = await client.query(userQuery, [decoded.userId, decoded.email]);

        if (userResult.rows.length === 0) {
          console.log('❌ Applicant user not found in database');
          client.release();
          
          // Clear invalid cookie
          const response = NextResponse.json({
            success: false,
            error: 'User account not found'
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

        const user = userResult.rows[0];

        // Check if account is active
        if (!user.is_active) {
          console.log('❌ User account is deactivated');
          client.release();
          
          const response = NextResponse.json({
            success: false,
            error: 'Account has been deactivated'
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

        // Check if email is verified
        if (!user.email_verified) {
          console.log('❌ User email not verified');
          client.release();
          
          return NextResponse.json({
            success: false,
            error: 'Email address not verified. Please check your inbox for the verification link.',
            requiresVerification: true
          }, {
            status: 401,
            headers: corsHeaders
          });
        }

        const applicantUser = {
          id: user.id.toString(),
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name} ${user.last_name}`,
          role: 'applicant'
        };

        console.log('✅ Applicant user verified:', applicantUser.email);
        client.release();

        return NextResponse.json({
          success: true,
          user: applicantUser,
          message: 'Authentication verified'
        }, {
          headers: corsHeaders
        });
      }

      // Fallback for other token types
      const genericUser = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email,
        role: decoded.role || 'user'
      };

      return NextResponse.json({
        success: true,
        user: genericUser,
        message: 'Authentication verified'
      }, {
        headers: corsHeaders
      });

    } catch (jwtError: any) {
      console.log('❌ Invalid JWT token:', jwtError.message);
      
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
    
    if (client) {
      client.release();
    }
    
    return NextResponse.json({
      success: false,
      error: 'Authentication verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// GET method for compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}
