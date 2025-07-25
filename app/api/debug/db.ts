import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const result = await query('SELECT current_database(), current_user;');
    const users = await query('SELECT id, email FROM users;');
    
    return NextResponse.json({
      database: result.rows[0],
      users: users.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}