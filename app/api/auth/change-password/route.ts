// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

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
    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Check if current and new passwords are the same
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get authentication token from cookies or Authorization header
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    // Verify the authentication token
    let decoded;
    try {
      decoded = jwt.verify(authToken, JWT_SECRET) as any;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid session. Please sign in again.' },
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    const userId = decoded.userId;
    const email = decoded.email;

    // Get user's current password hash from database
    const userQuery = 'SELECT id, email, password_hash FROM applicant_accounts WHERE id = $1 AND email = $2';
    const userResult = await client.query(userQuery, [userId, email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Hash the new password (same salt rounds as reset-password)
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    try {
      // Update user's password in applicant_accounts table
      const updateQuery = `
        UPDATE applicant_accounts 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2 AND email = $3
      `;
      
      const updateResult = await client.query(updateQuery, [hashedNewPassword, userId, email]);

      if (updateResult.rowCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update password' },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }

      console.log('✅ Password change successful for:', email);

      // Optional: Invalidate all other sessions by generating new token
      // This forces user to stay logged in but logs out other devices
      const newAuthToken = jwt.sign(
        { 
          userId: user.id.toString(), 
          email: user.email,
          role: 'applicant' 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json(
        { message: 'Password has been successfully changed.' },
        { 
          status: 200,
          headers: corsHeaders
        }
      );

      // Set new auth token cookie
      response.cookies.set('auth-token', newAuthToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      return response;

    } catch (dbError) {
      console.error('Database error during password change:', dbError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  } finally {
    client.release();
  }
}