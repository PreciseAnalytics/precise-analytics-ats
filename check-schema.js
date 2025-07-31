// check-schema.js
// Save and run: node check-schema.js

import { query } from './lib/database.js';

async function checkSchema() {
  try {
    console.log('=== DATABASE SCHEMA CHECK ===\n');
    
    // Check jobs table structure
    console.log('📋 JOBS TABLE COLUMNS:');
    const jobsSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'jobs'
      ORDER BY ordinal_position;
    `);
    console.log(jobsSchema.rows);
    
    // Count total jobs
    console.log('\n📊 JOBS COUNT:');
    const jobCount = await query('SELECT COUNT(*) as total FROM jobs');
    console.log(`Total jobs in database: ${jobCount.rows[0].total}`);
    
    // Count jobs with status
    console.log('\n🏷️ JOBS BY STATUS:');
    try {
      const statusCount = await query(`
        SELECT 
          CASE 
            WHEN status IS NULL THEN 'NULL/No Status'
            ELSE status
          END as status,
          COUNT(*) as count
        FROM jobs 
        GROUP BY status
      `);
      console.log(statusCount.rows);
    } catch (err) {
      console.log('No status column exists:', err.message);
    }
    
    // Show all jobs
    console.log('\n📝 ALL JOBS:');
    const allJobs = await query('SELECT id, title, status, created_at FROM jobs ORDER BY id');
    console.log(allJobs.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();