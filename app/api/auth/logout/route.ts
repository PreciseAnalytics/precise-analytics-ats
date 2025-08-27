// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      try {
        // Decode token to get user info for audit log
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const client = await pool.connect();
        
        try {
          // Log logout action
          await client.query(
            `INSERT INTO hr_user_audit (hr_user_id, action, performed_by_email, details)
             VALUES ($1, 'logout', $2, $3)`,
            [
              decoded.userId,
              decoded.email,
              JSON.stringify({
                timestamp: new Date().toISOString(),
                ip_address: request.ip || 'unknown'
              })
            ]
          );
        } finally {
          client.release();
        }
      } catch (error) {
        // Token verification failed, but we still want to clear the cookie
        console.error('Token verification failed during logout:', error);
      }
    }

    // Clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json(
      { error: 'Error during logout' },
      { status: 500 }
    );
    
    response.cookies.delete('auth-token');
    
    return response;
  }
}
