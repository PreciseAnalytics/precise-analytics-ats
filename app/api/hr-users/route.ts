// app/api/hr-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

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

// Middleware to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  
  if (!authToken) {
    return { error: 'Authentication required', status: 401 };
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    
    // Check if user exists and is admin in hr_users table
    const client = await pool.connect();
    try {
      const userQuery = 'SELECT id, email, role, is_active FROM hr_users WHERE id = $1 OR email = $2';
      const userResult = await client.query(userQuery, [decoded.userId, decoded.email]);
      
      if (userResult.rows.length === 0) {
        return { error: 'User not found', status: 404 };
      }

      const user = userResult.rows[0];
      
      if (!user.is_active) {
        return { error: 'Account deactivated', status: 401 };
      }

      if (user.role !== 'admin') {
        return { error: 'Admin access required', status: 403 };
      }

      return { user, status: 200 };
    } finally {
      client.release();
    }
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// GET - Fetch all HR users (admin only)
export async function GET(request: NextRequest) {
  const authCheck = await verifyAdminAuth(request);
  if (authCheck.error) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status, headers: corsHeaders }
    );
  }

  const client = await pool.connect();
  
  try {
    console.log('📋 Fetching all HR users');

    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, role, department,
        is_active, email_verified, password_set, created_at,
        last_login, invitation_expires_at
      FROM hr_users 
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(usersQuery);
    
    console.log(`✅ Found ${result.rows.length} HR users`);

    return NextResponse.json({
      success: true,
      users: result.rows
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error fetching HR users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch HR users'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}