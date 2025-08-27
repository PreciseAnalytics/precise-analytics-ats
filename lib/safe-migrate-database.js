// lib/safe-migrate-database.js
// Run with: node lib/safe-migrate-database.js

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

async function safeMigrateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting safe database migration...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Check if positions table exists, create if not
    console.log('📋 Checking positions table...');
    const positionsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      )
    `);
    
    if (!positionsExists.rows[0].exists) {
      console.log('Creating positions table...');
      await client.query(`
        CREATE TABLE positions (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          department VARCHAR(100),
          location VARCHAR(255),
          employment_type VARCHAR(50) DEFAULT 'full-time',
          salary_min INTEGER,
          salary_max INTEGER,
          description TEXT,
          requirements TEXT,
          benefits TEXT,
          status VARCHAR(50) DEFAULT 'active',
          posted_date DATE DEFAULT CURRENT_DATE,
          application_deadline DATE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Positions table created');
    } else {
      console.log('✅ Positions table already exists');
    }
    
    // Step 2: Check if position_id column exists in applications
    console.log('🔧 Checking position_id column...');
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'position_id'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('Adding position_id column...');
      await client.query(`ALTER TABLE applications ADD COLUMN position_id INTEGER`);
      console.log('✅ Column added');
    } else {
      console.log('✅ Position_id column already exists');
    }
    
    // Step 3: Check if we need to migrate existing data
    console.log('📊 Checking if migration is needed...');
    const needsMigration = await client.query(`
      SELECT COUNT(*) as count 
      FROM applications 
      WHERE position_applied IS NOT NULL 
      AND position_id IS NULL
    `);
    
    if (parseInt(needsMigration.rows[0].count) > 0) {
      console.log(`Found ${needsMigration.rows[0].count} applications needing migration`);
      
      // Get unique positions that need migration
      const existingPositions = await client.query(`
        SELECT DISTINCT position_applied, COUNT(*) as application_count
        FROM applications 
        WHERE position_applied IS NOT NULL 
        AND position_id IS NULL
        GROUP BY position_applied
        ORDER BY application_count DESC
      `);
      
      console.log('📥 Migrating position data...');
      
      for (const pos of existingPositions.rows) {
        // Check if this position already exists in positions table
        const existingPos = await client.query(`
          SELECT id FROM positions WHERE title = $1
        `, [pos.position_applied]);
        
        let positionId;
        
        if (existingPos.rows.length > 0) {
          positionId = existingPos.rows[0].id;
          console.log(`   🔗 Using existing position: "${pos.position_applied}" (ID: ${positionId})`);
        } else {
          // Create new position
          const insertResult = await client.query(`
            INSERT INTO positions (title, department, status, created_at)
            VALUES ($1, 'General', 'active', CURRENT_TIMESTAMP)
            RETURNING id
          `, [pos.position_applied]);
          
          positionId = insertResult.rows[0].id;
          console.log(`   ✅ Created position: "${pos.position_applied}" (ID: ${positionId})`);
        }
        
        // Update applications with position_id
        const updateResult = await client.query(`
          UPDATE applications 
          SET position_id = $1 
          WHERE position_applied = $2 AND position_id IS NULL
        `, [positionId, pos.position_applied]);
        
        console.log(`   🔄 Updated ${updateResult.rowCount} applications`);
      }
    } else {
      console.log('✅ No migration needed - all applications already have position_id');
    }
    
    // Step 4: Check and add foreign key constraint if not exists
    console.log('🔗 Checking foreign key constraint...');
    const constraintExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_applications_position_id'
        AND table_name = 'applications'
      )
    `);
    
    if (!constraintExists.rows[0].exists) {
      console.log('Adding foreign key constraint...');
      await client.query(`
        ALTER TABLE applications 
        ADD CONSTRAINT fk_applications_position_id 
        FOREIGN KEY (position_id) REFERENCES positions(id)
      `);
      console.log('✅ Foreign key constraint added');
    } else {
      console.log('✅ Foreign key constraint already exists');
    }
    
    // Step 5: Add missing columns safely
    console.log('📋 Adding missing columns...');
    
    const columnsToAdd = [
      { name: 'resume_url', type: 'VARCHAR(500)' },
      { name: 'cover_letter', type: 'TEXT' },
      { name: 'linkedin_url', type: 'VARCHAR(255)' },
      { name: 'portfolio_url', type: 'VARCHAR(255)' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT \'submitted\'' },
      { name: 'notes', type: 'TEXT' },
      { name: 'applied_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const col of columnsToAdd) {
      // Check if column exists
      const colExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'applications' 
          AND column_name = $1
        )
      `, [col.name]);
      
      if (!colExists.rows[0].exists) {
        await client.query(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✅ Added column: ${col.name}`);
      } else {
        console.log(`   ⏭️  Column ${col.name} already exists`);
      }
    }
    
    // Step 6: Update existing applications with default values
    console.log('🔄 Setting default values...');
    await client.query(`
      UPDATE applications 
      SET 
        status = COALESCE(status, COALESCE(stage, 'submitted')),
        applied_at = COALESCE(applied_at, application_date, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
      WHERE status IS NULL OR applied_at IS NULL OR updated_at IS NULL
    `);
    
    // Step 7: Create status history table if not exists
    console.log('📋 Checking status history table...');
    const statusHistoryExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_status_history'
      )
    `);
    
    if (!statusHistoryExists.rows[0].exists) {
      console.log('Creating application status history table...');
      await client.query(`
        CREATE TABLE application_status_history (
          id SERIAL PRIMARY KEY,
          application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
          old_status VARCHAR(50),
          new_status VARCHAR(50) NOT NULL,
          changed_by INTEGER REFERENCES users(id),
          notes TEXT,
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Status history table created');
    } else {
      console.log('✅ Status history table already exists');
    }
    
    // Step 8: Add indexes safely
    console.log('⚡ Adding indexes...');
    const indexes = [
      { name: 'idx_applications_position_id', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id)' },
      { name: 'idx_applications_status', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)' },
      { name: 'idx_applications_email', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email)' },
      { name: 'idx_positions_status', sql: 'CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)' },
      { name: 'idx_applications_applied_at', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at)' }
    ];
    
    for (const index of indexes) {
      await client.query(index.sql);
      console.log(`   ✅ Index ${index.name} ensured`);
    }
    
    // Step 9: Final verification
    console.log('\n📊 Final verification:');
    
    const finalCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM positions) as positions_count,
        (SELECT COUNT(*) FROM applications WHERE position_id IS NOT NULL) as applications_with_position_id,
        (SELECT COUNT(*) FROM applications WHERE position_id IS NULL) as applications_without_position_id,
        (SELECT COUNT(*) FROM applications) as total_applications
    `);
    
    const summary = finalCheck.rows[0];
    console.log(`   📋 Total positions: ${summary.positions_count}`);
    console.log(`   ✅ Applications linked: ${summary.applications_with_position_id}`);
    console.log(`   ⚠️  Applications unlinked: ${summary.applications_without_position_id}`);
    console.log(`   📊 Total applications: ${summary.total_applications}`);
    
    // Show sample data
    const sampleData = await client.query(`
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.position_id,
        p.title as position_title,
        a.status
      FROM applications a
      LEFT JOIN positions p ON a.position_id = p.id
      LIMIT 5
    `);
    
    console.log('\n📝 Sample applications:');
    sampleData.rows.forEach(app => {
      console.log(`   👤 ${app.first_name} ${app.last_name} → Position ID: ${app.position_id} (${app.position_title}) - Status: ${app.status}`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n🎉 Safe database migration completed successfully!');
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test your build: npm run build');
    console.log('   2. Test your API endpoints');
    console.log('   3. Check that the position column error is resolved');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolling back:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
    process.exit();
  }
}

// Run the safe migration
safeMigrateDatabase();
