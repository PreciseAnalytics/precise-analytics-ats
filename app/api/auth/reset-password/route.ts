import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 400 }
      );
    }

    const email = decoded.email;

    // Verify this is the allowed admin email
    const allowedEmail = 'careers@preciseanalytics.io';
    if (email.toLowerCase() !== allowedEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized email address' },
        { status: 403 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // First, check if user exists in database
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingUser.length === 0) {
        // Create the user if they don't exist (for initial setup)
        await sql`
          INSERT INTO users (email, password, role, created_at)
          VALUES (${email}, ${hashedPassword}, 'admin', NOW())
        `;
      } else {
        // Update existing user's password
        await sql`
          UPDATE users 
          SET password = ${hashedPassword}, updated_at = NOW()
          WHERE email = ${email}
        `;
      }

      return NextResponse.json(
        { message: 'Password has been successfully reset' },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}