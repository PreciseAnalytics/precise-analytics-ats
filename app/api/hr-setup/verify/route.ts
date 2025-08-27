import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Setup token is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Verifying HR setup token');

    // Find user by invitation token
    const userQuery = `
      SELECT id, first_name, last_name, email, role, department,
             email_verified, password_set, invitation_expires_at
      FROM hr_users
      WHERE invitation_token = $1 AND is_active = true
    `;

    const userResult = await client.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid setup token' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = userResult.rows[0];

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.invitation_expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Setup token has expired. Please contact your administrator for a new invitation.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user has already completed setup
    if (user.password_set) {
      return NextResponse.json(
        { success: false, error: 'Account setup has already been completed' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Setup token verified for:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        email_verified: user.email_verified
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error verifying setup token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify setup token' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    client.release();
  }
}
