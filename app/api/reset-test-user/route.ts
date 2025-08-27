// app/api/reset-test-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST() {
  const client = await pool.connect();
  
  try {
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await client.query(`
      UPDATE hr_users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE email = 'careers@preciseanalytics.io'
      RETURNING email, first_name, last_name, is_active, email_verified, password_set
    `, [hashedPassword]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password successfully reset to: admin123',
      user: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to reset password for careers@preciseanalytics.io to admin123' 
  });
}
