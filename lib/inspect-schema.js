// lib/inspect-schema.js
// Run with: node lib/inspect-schema.js

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

async function inspectSchema() {
  try {
    console.log('🔍 Inspecting current database schema...\n');
    
    const client = await pool.connect();
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Found tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Inspect each table structure
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`📄 Table: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      // Get columns for this table
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (columnsResult.rows.length === 0) {
        console.log('   ⚠️  No columns found');
      } else {
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   📝 ${col.column_name} | ${col.data_type}${length} | ${nullable}${defaultVal}`);
        });
      }
      
      // Get row count
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`   📊 Rows: ${countResult.rows[0].count}`);
      } catch (e) {
        console.log(`   📊 Rows: Unable to count (${e.message})`);
      }
      
      console.log('');
    }
    
    // Check for foreign key relationships
    console.log('🔗 Foreign Key Relationships:');
    console.log('-'.repeat(40));
    
    const fkResult = await client.query(`
      SELECT 
        tc.table_name as table_name,
        kcu.column_name as column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (fkResult.rows.length === 0) {
      console.log('   ⚠️  No foreign key relationships found');
    } else {
      fkResult.rows.forEach(fk => {
        console.log(`   🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    client.release();
    console.log('\n✅ Schema inspection completed!');
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

// Run the inspection
inspectSchema();