// app/api/test-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  let client;
  
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Test basic connection
    client = await pool.connect();
    console.log('Database connected successfully');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Basic query successful:', result.rows[0]);
    
    // Check if hr_users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hr_users'
      );
    `);
    
    console.log('hr_users table exists:', tableCheck.rows[0].exists);
    
    // If table exists, count users
    let userCount = 0;
    let sampleUsers = [];
    
    if (tableCheck.rows[0].exists) {
      const countResult = await client.query('SELECT COUNT(*) FROM hr_users');
      userCount = parseInt(countResult.rows[0].count);
      
      // Get sample of users (without passwords)
      const sampleResult = await client.query(`
        SELECT id, first_name, last_name, email, role, is_active, 
               email_verified, password_set, created_at 
        FROM hr_users 
        LIMIT 5
      `);
      sampleUsers = sampleResult.rows;
    }
    
    return NextResponse.json({
      success: true,
      database_connected: true,
      current_time: result.rows[0].current_time,
      hr_users_table_exists: tableCheck.rows[0].exists,
      hr_users_count: userCount,
      sample_users: sampleUsers,
      environment: {
        node_env: process.env.NODE_ENV,
        has_database_url: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'NOT SET'
      }
    });
    
  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      database_connected: false,
      error: error.message,
      error_code: error.code,
      error_details: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      environment: {
        node_env: process.env.NODE_ENV,
        has_database_url: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'NOT SET'
      }
    }, { status: 500 });
    
  } finally {
    if (client) {
      client.release();
    }
  }
}
