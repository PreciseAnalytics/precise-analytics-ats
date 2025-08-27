// app/api/auth/reset-password/route.ts - Updated for HR Users Only
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const isValidPassword = Object.values(passwordValidation).every(Boolean);

    if (!isValidPassword) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find HR user by reset token
      const result = await client.query(
        `SELECT id, email, first_name, last_name, invitation_expires_at
         FROM hr_users 
         WHERE invitation_token = $1 AND is_active = true`,
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 404 }
        );
      }

      const user = result.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.invitation_expires_at)) {
        return NextResponse.json(
          { error: 'Reset token has expired' },
          { status: 410 }
        );
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update password and clear reset token
      await client.query(
        `UPDATE hr_users 
         SET password_hash = $1, 
             invitation_token = NULL, 
             invitation_expires_at = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      // Log password reset completion
      await client.query(
        `INSERT INTO hr_user_audit (hr_user_id, action, performed_by_email, details)
         VALUES ($1, 'password_reset_completed', $2, $3)`,
        [
          user.id,
          user.email,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            ip_address: request.ip || 'unknown'
          })
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, email, first_name, invitation_expires_at
         FROM hr_users 
         WHERE invitation_token = $1 AND is_active = true`,
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { valid: false, error: 'Invalid token' },
          { status: 404 }
        );
      }

      const user = result.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.invitation_expires_at)) {
        return NextResponse.json(
          { valid: false, error: 'Token has expired' },
          { status: 410 }
        );
      }

      return NextResponse.json({
        valid: true,
        user: {
          email: user.email,
          firstName: user.first_name
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
