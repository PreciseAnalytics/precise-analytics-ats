// app/api/auth/login/route.ts - Debug Version
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find HR user by email
      const result = await client.query(
        `SELECT id, email, first_name, last_name, password_hash, role, 
                is_active, email_verified, password_set
         FROM hr_users 
         WHERE email = $1`,
        [email.toLowerCase()]
      );

      console.log('Database query result:', result.rows.length > 0 ? 'User found' : 'No user found');

      if (result.rows.length === 0) {
        console.log('No user found for email:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const user = result.rows[0];
      console.log('User status - Active:', user.is_active, 'Email verified:', user.email_verified, 'Password set:', user.password_set);

      // Check if user account is active
      if (!user.is_active) {
        console.log('User account is inactive');
        return NextResponse.json(
          { error: 'Account is deactivated. Contact administrator.' },
          { status: 403 }
        );
      }

      // Check if user has completed setup
      if (!user.email_verified || !user.password_set) {
        console.log('User setup incomplete');
        return NextResponse.json(
          { error: 'Account setup not completed. Check your email for setup instructions.' },
          { status: 403 }
        );
      }

      // Verify password
      if (!user.password_hash) {
        console.log('No password hash found');
        return NextResponse.json(
          { error: 'Account not properly configured. Contact administrator.' },
          { status: 403 }
        );
      }

      console.log('Comparing password with hash...');
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Password comparison result:', isValidPassword);

      if (!isValidPassword) {
        console.log('Password comparison failed');
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      console.log('Login successful for:', user.email);

      // Update last login timestamp
      await client.query(
        'UPDATE hr_users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Log successful login
      await client.query(
        `INSERT INTO hr_user_audit (hr_user_id, action, performed_by_email, details)
         VALUES ($1, 'login', $2, $3)`,
        [
          user.id,
          user.email,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            ip_address: request.ip || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
          })
        ]
      );

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Set HTTP-only cookie
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 // 8 hours in seconds
      });

      return response;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
