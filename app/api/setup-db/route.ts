import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Create users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Create admin user
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      'careers@preciseanalytics.io',
      hashedPassword,
      'Admin',
      'User',
      'admin',
      true
    ]);

    return NextResponse.json({
      success: true,
      message: 'Admin user created',
      credentials: {
        email: 'careers@preciseanalytics.io',
        password: 'admin123'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}