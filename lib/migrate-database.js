// lib/migrate-database.js
// Run with: node lib/migrate-database.js

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

async function migrateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Create positions table
    console.log('📋 Creating positions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS positions (
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
    
    // Step 2: Get existing unique positions from applications
    console.log('📊 Analyzing existing application data...');
    const existingPositions = await client.query(`
      SELECT DISTINCT position_applied, COUNT(*) as application_count
      FROM applications 
      WHERE position_applied IS NOT NULL 
      GROUP BY position_applied
      ORDER BY application_count DESC
    `);
    
    console.log(`Found ${existingPositions.rows.length} unique positions:`);
    existingPositions.rows.forEach(pos => {
      console.log(`   📝 "${pos.position_applied}" (${pos.application_count} applications)`);
    });
    
    // Step 3: Insert positions and create mapping
    console.log('\n📥 Creating position records...');
    const positionMapping = new Map();
    
    for (const pos of existingPositions.rows) {
      const insertResult = await client.query(`
        INSERT INTO positions (title, department, status, created_at)
        VALUES ($1, 'General', 'active', CURRENT_TIMESTAMP)
        RETURNING id, title
      `, [pos.position_applied]);
      
      const newPositionId = insertResult.rows[0].id;
      positionMapping.set(pos.position_applied, newPositionId);
      console.log(`   ✅ Created position: "${pos.position_applied}" (ID: ${newPositionId})`);
    }
    
    // Step 4: Add position_id column to applications
    console.log('\n🔧 Adding position_id column to applications...');
    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS position_id INTEGER
    `);
    console.log('✅ Column added');
    
    // Step 5: Update applications with position_id
    console.log('🔄 Updating applications with position_id...');
    for (const [positionTitle, positionId] of positionMapping) {
      const updateResult = await client.query(`
        UPDATE applications 
        SET position_id = $1 
        WHERE position_applied = $2
      `, [positionId, positionTitle]);
      
      console.log(`   ✅ Updated ${updateResult.rowCount} applications for "${positionTitle}"`);
    }
    
    // Step 6: Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE applications 
      ADD CONSTRAINT fk_applications_position_id 
      FOREIGN KEY (position_id) REFERENCES positions(id)
    `);
    console.log('✅ Foreign key constraint added');
    
    // Step 7: Add other missing columns that your ATS might need
    console.log('📋 Adding missing columns to applications...');
    
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
      try {
        await client.query(`
          ALTER TABLE applications 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`   ✅ Added column: ${col.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  Column ${col.name} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Step 8: Update existing applications with default status if needed
    console.log('🔄 Setting default status for existing applications...');
    await client.query(`
      UPDATE applications 
      SET status = COALESCE(stage, 'submitted'),
          applied_at = COALESCE(applied_at, application_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE status IS NULL
    `);
    
    // Step 9: Create application status history table
    console.log('📋 Creating application status history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_status_history (
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
    
    // Step 10: Add indexes for performance
    console.log('⚡ Adding performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id)',
      'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)',
      'CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email)',
      'CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)',
      'CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at)'
    ];
    
    for (const indexSql of indexes) {
      await client.query(indexSql);
      console.log('   ✅ Index created');
    }
    
    // Step 11: Show final schema
    console.log('\n📊 Final migration summary:');
    
    const finalCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM positions) as positions_count,
        (SELECT COUNT(*) FROM applications WHERE position_id IS NOT NULL) as applications_with_position_id,
        (SELECT COUNT(*) FROM applications WHERE position_id IS NULL) as applications_without_position_id
    `);
    
    const summary = finalCheck.rows[0];
    console.log(`   📋 Positions created: ${summary.positions_count}`);
    console.log(`   ✅ Applications linked: ${summary.applications_with_position_id}`);
    console.log(`   ⚠️  Applications unlinked: ${summary.applications_without_position_id}`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n🎉 Database migration completed successfully!');
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test your API endpoints');
    console.log('   2. Update any hardcoded position references');
    console.log('   3. Consider removing the old position_applied column once everything works');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolling back:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    process.exit();
  }
}

// Run the migration
migrateDatabase();
