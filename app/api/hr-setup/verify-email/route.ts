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

    console.log('Verifying email for HR setup token');

    // Find and update user
    const updateQuery = `
      UPDATE hr_users
      SET email_verified = true, updated_at = NOW()
      WHERE invitation_token = $1 AND is_active = true AND invitation_expires_at > NOW()
      RETURNING id, first_name, last_name, email, role, department, email_verified, password_set
    `;

    const result = await client.query(updateQuery, [token]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired setup token' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = result.rows[0];

    console.log('Email verified for:', user.email);

    // Log the email verification
    const auditQuery = `
      INSERT INTO hr_user_audit (hr_user_id, action, details)
      VALUES ($1, 'email_verified', $2)
    `;

    await client.query(auditQuery, [
      user.id,
      JSON.stringify({ verified_at: new Date().toISOString() })
    ]);

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
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    client.release();
  }
}
