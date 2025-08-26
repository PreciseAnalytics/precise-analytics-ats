import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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
        { success: false, error: 'Setup token and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Setting password for HR setup token');

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user with hashed password
    const updateQuery = `
      UPDATE hr_users
      SET password_hash = $1, password_set = true, invitation_token = NULL, 
          invitation_expires_at = NULL, updated_at = NOW()
      WHERE invitation_token = $2 AND is_active = true AND email_verified = true 
            AND invitation_expires_at > NOW() AND password_set = false
      RETURNING id, first_name, last_name, email, role, department
    `;

    const result = await client.query(updateQuery, [hashedPassword, token]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid token, token expired, email not verified, or password already set' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = result.rows[0];

    console.log('Password set successfully for:', user.email);

    // Log the password setup completion
    const auditQuery = `
      INSERT INTO hr_user_audit (hr_user_id, action, details)
      VALUES ($1, 'password_set', $2)
    `;

    await client.query(auditQuery, [
      user.id,
      JSON.stringify({ completed_at: new Date().toISOString() })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in to your account.',
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set password' },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    client.release();
  }
}