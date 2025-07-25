// lib/database.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
}

// Helper functions for common operations
export class DatabaseHelper {
  // Applications
  static async getAllApplications() {
    const result = await query(`
      SELECT a.*, j.title as job_title 
      FROM applications a 
      LEFT JOIN jobs j ON a.position = j.title 
      ORDER BY a.applied_date DESC
    `);
    return result.rows;
  }

  static async getApplicationById(id) {
    const result = await query(`
      SELECT a.*, j.title as job_title, j.department
      FROM applications a 
      LEFT JOIN jobs j ON a.position = j.title 
      WHERE a.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async createApplication(applicationData) {
    const {
      firstName, lastName, email, phone, position, message,
      company, resumeUrl, coverLetterUrl, source = 'careers_page'
    } = applicationData;

    const result = await query(`
      INSERT INTO applications (
        first_name, last_name, email, phone, position, message,
        company, resume_url, cover_letter_url, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [firstName, lastName, email, phone, position, message, company, resumeUrl, coverLetterUrl, source]);
    
    return result.rows[0];
  }

  static async updateApplicationStage(id, stage, userId = null) {
    const result = await query(`
      UPDATE applications 
      SET stage = $1, last_activity = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `, [stage, id]);

    // Log the activity
    if (result.rows[0] && userId) {
      await query(`
        INSERT INTO activity_log (application_id, user_id, action, details)
        VALUES ($1, $2, 'stage_change', $3)
      `, [id, userId, JSON.stringify({ to_stage: stage })]);
    }

    return result.rows[0];
  }

  static async updateApplicationRating(id, rating, userId = null) {
    const result = await query(`
      UPDATE applications 
      SET rating = $1, last_activity = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `, [rating, id]);

    if (result.rows[0] && userId) {
      await query(`
        INSERT INTO activity_log (application_id, user_id, action, details)
        VALUES ($1, $2, 'rating_update', $3)
      `, [id, userId, JSON.stringify({ rating })]);
    }

    return result.rows[0];
  }

  // Jobs
  static async getAllJobs() {
    const result = await query(`
      SELECT j.*, COUNT(a.id) as application_count
      FROM jobs j
      LEFT JOIN applications a ON j.title = a.position
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);
    return result.rows;
  }

  static async getJobById(id) {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createJob(jobData) {
    const { title, department, location, description, requirements = [], openings = 1 } = jobData;
    
    const result = await query(`
      INSERT INTO jobs (title, department, location, description, requirements, openings)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, department, location, description, requirements, openings]);
    
    return result.rows[0];
  }

  // Users
  static async getUserByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
    return result.rows[0];
  }

  static async createUser(userData) {
    const { email, name, role = 'recruiter', passwordHash } = userData;
    
    const result = await query(`
      INSERT INTO users (email, name, role, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role, created_at
    `, [email, name, role, passwordHash]);
    
    return result.rows[0];
  }

  // Analytics
  static async getDashboardStats() {
    try {
      const [applicationsCount, jobsCount, stageStats, recentActivity] = await Promise.all([
        query('SELECT COUNT(*) as total FROM applications'),
        query('SELECT COUNT(*) as total FROM jobs WHERE status = $1', ['Active']),
        query(`
          SELECT stage, COUNT(*) as count 
          FROM applications 
          GROUP BY stage
        `),
        query(`
          SELECT a.*, j.title as job_title 
          FROM applications a 
          LEFT JOIN jobs j ON a.position = j.title 
          ORDER BY a.applied_date DESC 
          LIMIT 10
        `)
      ]);

      return {
        totalApplications: parseInt(applicationsCount.rows[0].total),
        activeJobs: parseInt(jobsCount.rows[0].total),
        stageBreakdown: stageStats.rows.reduce((acc, row) => {
          acc[row.stage] = parseInt(row.count);
          return acc;
        }, {}),
        recentApplications: recentActivity.rows
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalApplications: 0,
        activeJobs: 0,
        stageBreakdown: {},
        recentApplications: []
      };
    }
  }

  // Search and filtering
  static async searchApplications(searchTerm, filters = {}) {
    let query_text = `
      SELECT a.*, j.title as job_title, j.department
      FROM applications a 
      LEFT JOIN jobs j ON a.position = j.title 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Search term
    if (searchTerm) {
      paramCount++;
      query_text += ` AND (
        a.first_name ILIKE $${paramCount} OR 
        a.last_name ILIKE $${paramCount} OR 
        a.email ILIKE $${paramCount} OR 
        a.position ILIKE $${paramCount}
      )`;
      params.push(`%${searchTerm}%`);
    }

    // Position filter
    if (filters.position && filters.position !== 'all') {
      paramCount++;
      query_text += ` AND a.position = $${paramCount}`;
      params.push(filters.position);
    }

    // Stage filter
    if (filters.stage && filters.stage !== 'all') {
      paramCount++;
      query_text += ` AND a.stage = $${paramCount}`;
      params.push(filters.stage);
    }

    // Date range filter
    if (filters.dateFrom) {
      paramCount++;
      query_text += ` AND a.applied_date >= $${paramCount}`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      paramCount++;
      query_text += ` AND a.applied_date <= $${paramCount}`;
      params.push(filters.dateTo);
    }

    query_text += ' ORDER BY a.applied_date DESC';

    const result = await query(query_text, params);
    return result.rows;
  }
}

export default pool;