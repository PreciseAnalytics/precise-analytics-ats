// Create this file: lib/db-test.js
// Run with: node lib/db-test.js

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    console.log('📍 Connection string format check...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL not found in environment variables');
    }
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
    
    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found - you need to run the schema creation script');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
    }
    
    client.release();
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error details:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check your username and password in the connection string');
      console.log('   - Make sure you copied the full connection string from Neon');
    } else if (error.message.includes('could not translate host name')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check your database host/endpoint in the connection string');
      console.log('   - Make sure your Neon project is active');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check the database name in your connection string');
      console.log('   - Create the database in your Neon console if it doesn\'t exist');
    }
  } finally {
    await pool.end();
    process.exit();
  }
}

// Run the test
testConnection();
