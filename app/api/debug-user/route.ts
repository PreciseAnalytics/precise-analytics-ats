// app/api/debug-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        id, email, first_name, last_name, role, department,
        is_active, email_verified, password_set,
        created_at, updated_at, last_login,
        -- Don't show actual password hash for security
        CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NULL' END as password_status
      FROM hr_users 
      WHERE email = 'careers@preciseanalytics.io'
    `);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' });
    }

    return NextResponse.json({
      user: result.rows[0],
      debug_info: {
        can_login: result.rows[0].is_active && result.rows[0].email_verified && result.rows[0].password_set,
        issues: [
          !result.rows[0].is_active && 'Account not active',
          !result.rows[0].email_verified && 'Email not verified', 
          !result.rows[0].password_set && 'Password not set',
          result.rows[0].password_status === 'NULL' && 'No password hash'
        ].filter(Boolean)
      }
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST() {
  const client = await pool.connect();
  
  try {
    // Test password verification with known password
    const testPassword = 'admin123';
    
    const user = await client.query(`
      SELECT password_hash FROM hr_users WHERE email = 'careers@preciseanalytics.io'
    `);
    
    if (user.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(testPassword, user.rows[0].password_hash);
    
    return NextResponse.json({
      password_test: {
        testing_password: testPassword,
        hash_exists: !!user.rows[0].password_hash,
        password_matches: isValid
      }
    });
    
  } catch (error: any) {
    console.error('Password test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
