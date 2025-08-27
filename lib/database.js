// REPLACE these functions in your lib/database.js
// Use position_applied = title (text matching), not job_id

// Applications
static async getAllApplications() {
  const result = await query(`
    SELECT a.*, j.title as job_title, j.department
    FROM applications a
    LEFT JOIN jobs j ON a.position_applied = j.title
    ORDER BY a.applied_at DESC NULLS LAST, a.application_date DESC NULLS LAST, a.created_at DESC
  `);
  return result.rows;
}

static async getApplicationById(id) {
  const result = await query(`
    SELECT a.*, j.title as job_title, j.department
    FROM applications a
    LEFT JOIN jobs j ON a.position_applied = j.title
    WHERE a.id = $1
  `, [id]);
  return result.rows[0];
}

// Jobs - correct join
static async getAllJobs() {
  const result = await query(`
    SELECT j.*, COUNT(a.id) as application_count
    FROM jobs j
    LEFT JOIN applications a ON j.title = a.position_applied
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `);
  return result.rows;
}

// Analytics - fix status and joins
static async getDashboardStats() {
  try {
    const [applicationsCount, jobsCount, stageStats, recentActivity] = await Promise.all([
      query('SELECT COUNT(*) as total FROM applications'),
      // CHANGED: 'Active' to 'published'
      query('SELECT COUNT(*) as total FROM jobs WHERE status = $1', ['published']),
      query(`
        SELECT stage, COUNT(*) as count
        FROM applications
        WHERE stage IS NOT NULL
        GROUP BY stage
      `),
      query(`
        SELECT a.*, j.title as job_title, j.department
        FROM applications a
        LEFT JOIN jobs j ON a.position_applied = j.title
        ORDER BY a.applied_at DESC NULLS LAST, a.application_date DESC NULLS LAST, a.created_at DESC
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
    LEFT JOIN jobs j ON a.position_applied = j.title
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
      a.position_applied ILIKE $${paramCount} OR
      j.title ILIKE $${paramCount}
    )`;
    params.push(`%${searchTerm}%`);
  }

  // Position filter - use position_applied text
  if (filters.position && filters.position !== 'all') {
    paramCount++;
    query_text += ` AND a.position_applied = $${paramCount}`;
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
    query_text += ` AND COALESCE(a.applied_at, a.application_date, a.created_at) >= $${paramCount}`;
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    paramCount++;
    query_text += ` AND COALESCE(a.applied_at, a.application_date, a.created_at) <= $${paramCount}`;
    params.push(filters.dateTo);
  }

  query_text += ' ORDER BY COALESCE(a.applied_at, a.application_date, a.created_at) DESC';

  const result = await query(query_text, params);
  return result.rows;
}
