import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  // Enable CORS
  const allowedOrigins = [
    'https://preciseanalytics.io',
    'https://www.preciseanalytics.io',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Individual Job API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

// GET - Fetch individual job with applications
async function handleGet(req, res) {
  const { id } = req.query;

  try {
    // Get job details
    const job = await sql`
      SELECT * FROM jobs WHERE id = ${id}
    `;

    if (job.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get applications for this job
    const applications = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        status,
        applied_at,
        updated_at,
        notes
      FROM applications 
      WHERE job_id = ${id}
      ORDER BY applied_at DESC
    `;

    // Get application counts by status
    const statusCounts = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM applications 
      WHERE job_id = ${id}
      GROUP BY status
    `;

    const counts = statusCounts.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Get activity log if table exists
    let activityLog = [];
    try {
      activityLog = await sql`
        SELECT * FROM job_activity_log 
        WHERE job_id = ${id}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    res.status(200).json({
      success: true,
      job: job[0],
      applications: applications,
      application_counts: counts,
      total_applications: applications.length,
      activity_log: activityLog
    });

  } catch (error) {
    throw error;
  }
}

// PUT - Update individual job
async function handlePut(req, res) {
  const { id } = req.query;
  const updates = req.body;

  try {
    // Check if job exists
    const existingJob = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    if (existingJob.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = existingJob[0];

    // Build update object with only allowed fields
    const allowedFields = [
      'title', 'department', 'location', 'type', 'salary_range',
      'description', 'requirements', 'benefits', 'expires_at', 'status',
      'priority', 'remote_option'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Perform update
    const updatedJob = await sql`
      UPDATE jobs 
      SET ${sql(updateData)}
      WHERE id = ${id}
      RETURNING *
    `;

    // Log activity if table exists
    try {
      await sql`
        INSERT INTO job_activity_log (job_id, action, details, created_by, created_at)
        VALUES (${id}, 'updated', ${JSON.stringify({ changes: updates })}, ${updates.updated_by || 'system'}, NOW())
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob[0]
    });

  } catch (error) {
    throw error;
  }
}

// DELETE - Delete individual job
async function handleDelete(req, res) {
  const { id } = req.query;

  try {
    // Check if job exists
    const job = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    if (job.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check for existing applications
    const applications = await sql`
      SELECT COUNT(*) as count FROM applications WHERE job_id = ${id}
    `;

    const applicationCount = parseInt(applications[0].count);

    if (applicationCount > 0) {
      // Soft delete - mark as inactive
      const updatedJob = await sql`
        UPDATE jobs 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      // Log activity
      try {
        await sql`
          INSERT INTO job_activity_log (job_id, action, details, created_by, created_at)
          VALUES (${id}, 'deactivated', ${JSON.stringify({ reason: 'Has applications', application_count: applicationCount })}, 'system', NOW())
        `;
      } catch (logError) {
        console.log('Activity log table may not exist yet:', logError.message);
      }

      res.status(200).json({
        success: true,
        message: `Job deactivated (${applicationCount} applications exist)`,
        job: updatedJob[0]
      });

    } else {
      // Hard delete if no applications
      await sql`DELETE FROM jobs WHERE id = ${id}`;

      res.status(200).json({
        success: true,
        message: 'Job deleted successfully'
      });
    }

  } catch (error) {
    throw error;
  }
}