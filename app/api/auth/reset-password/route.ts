// app/api/auth/reset-password/route.ts
// REPLACE your reset-password route with this version for applicant accounts:

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return NextResponse.json(
        { error: 'Invalid reset link' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const email = decoded.email;
    const userId = decoded.userId;

    // Verify user exists in applicant_accounts table
    const userQuery = 'SELECT id, email FROM applicant_accounts WHERE id = $1 AND email = $2';
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

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Update user's password in applicant_accounts table
      const updateQuery = `
        UPDATE applicant_accounts 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2 AND email = $3
      `;
      
      const updateResult = await client.query(updateQuery, [hashedPassword, userId, email]);

      if (updateResult.rowCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update password' },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }

      console.log('✅ Password reset successful for:', email);

      return NextResponse.json(
        { message: 'Password has been successfully reset. You can now sign in with your new password.' },
        { 
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

  } catch (error) {
    console.error('Password reset error:', error);
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