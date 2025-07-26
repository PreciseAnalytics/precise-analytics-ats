import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

// Database connection
const sql = neon(process.env.DATABASE_URL);

// Email configuration
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Enable CORS for your main website
  // Allow both production and development origins
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

// GET - Fetch all jobs with optional filtering
async function handleGet(req, res) {
  const { status, department, location, active_only = 'false' } = req.query;
  
  let jobs;
  
  if (active_only === 'true') {
    // Fetch only active jobs for careers page
    jobs = await sql`
      SELECT 
        j.*,
        COUNT(a.id) as application_count,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
        COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed_count,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count,
        COUNT(CASE WHEN a.status = 'not_hired' THEN 1 END) as not_hired_count,
        COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.status = 'active' 
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `;
  } else {
    // Fetch all jobs with optional filtering for ATS
    if (status && department && location) {
      jobs = await sql`
        SELECT 
          j.*,
          COUNT(a.id) as application_count,
          COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
          COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
          COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed_count,
          COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count,
          COUNT(CASE WHEN a.status = 'not_hired' THEN 1 END) as not_hired_count,
          COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.status = ${status} AND j.department = ${department} AND j.location = ${location}
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `;
    } else if (status) {
      jobs = await sql`
        SELECT 
          j.*,
          COUNT(a.id) as application_count,
          COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
          COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
          COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed_count,
          COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count,
          COUNT(CASE WHEN a.status = 'not_hired' THEN 1 END) as not_hired_count,
          COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.status = ${status}
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `;
    } else if (department) {
      jobs = await sql`
        SELECT 
          j.*,
          COUNT(a.id) as application_count,
          COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
          COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
          COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed_count,
          COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count,
          COUNT(CASE WHEN a.status = 'not_hired' THEN 1 END) as not_hired_count,
          COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.department = ${department}
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `;
    } else {
      jobs = await sql`
        SELECT 
          j.*,
          COUNT(a.id) as application_count,
          COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
          COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
          COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed_count,
          COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count,
          COUNT(CASE WHEN a.status = 'not_hired' THEN 1 END) as not_hired_count,
          COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `;
    }
  }
  
  res.status(200).json({
    success: true,
    jobs: jobs,
    total: jobs.length
  });
}

// POST - Create new job
async function handlePost(req, res) {
  const {
    title,
    department,
    location,
    type,
    salary_range,
    description,
    requirements,
    benefits,
    expires_at,
    posted_by,
    priority = 'medium',
    remote_option = false
  } = req.body;

  // Validation
  if (!title || !department || !location || !description) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['title', 'department', 'location', 'description']
    });
  }

  try {
    // Create job posting
    const newJob = await sql`
      INSERT INTO jobs (
        title, department, location, type, salary_range, 
        description, requirements, benefits, expires_at, posted_by, 
        priority, remote_option, status, created_at, updated_at
      ) VALUES (
        ${title}, ${department}, ${location}, ${type}, ${salary_range},
        ${description}, ${requirements}, ${benefits}, ${expires_at}, ${posted_by},
        ${priority}, ${remote_option}, 'active', NOW(), NOW()
      ) RETURNING *
    `;

    const job = newJob[0];

    // Log activity if table exists
    try {
      await sql`
        INSERT INTO job_activity_log (job_id, action, details, created_by, created_at)
        VALUES (${job.id}, 'created', ${JSON.stringify({ title, department, location })}, ${posted_by}, NOW())
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    // Send notification email
    try {
      await sendJobNotificationEmail(job, 'created');
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: job
    });

  } catch (error) {
    throw error;
  }
}

// PUT - Update job
async function handlePut(req, res) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    // Check if job exists
    const existingJob = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    if (existingJob.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = existingJob[0];

    // Update job with only provided fields
    const allowedFields = [
      'title', 'department', 'location', 'type', 'salary_range',
      'description', 'requirements', 'benefits', 'expires_at', 'status',
      'priority', 'remote_option'
    ];

    // Build update object with only allowed fields that are provided
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

    if (updatedJob.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Log activity if table exists
    try {
      await sql`
        INSERT INTO job_activity_log (job_id, action, details, created_by, created_at)
        VALUES (${id}, 'updated', ${JSON.stringify({ changes: updates })}, ${updates.updated_by || 'system'}, NOW())
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    // Send notification if status changed
    if (updates.status && updates.status !== job.status) {
      try {
        await sendJobNotificationEmail(updatedJob[0], 'status_changed', {
          oldStatus: job.status,
          newStatus: updates.status
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
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

// DELETE - Delete job
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    // Check if job exists and get details
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
      // Soft delete - mark as inactive instead of hard delete
      const updatedJob = await sql`
        UPDATE jobs 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      // Log activity if table exists
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

// Email notification helper using Resend
async function sendJobNotificationEmail(job, action, extra = {}) {
  const subject = `ATS Notification: Job ${action} - ${job.title}`;

  let emailContent = `
    <h2>Job ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
    <p><strong>Job Title:</strong> ${job.title}</p>
    <p><strong>Department:</strong> ${job.department}</p>
    <p><strong>Location:</strong> ${job.location}</p>
    <p><strong>Status:</strong> ${job.status}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  `;

  if (action === 'status_changed') {
    emailContent += `
      <p><strong>Status Change:</strong> ${extra.oldStatus} → ${extra.newStatus}</p>
    `;
  }

  emailContent += `
    <br>
    <p><a href="${process.env.NEXT_PUBLIC_ATS_URL}/jobs/${job.id}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in ATS</a></p>
    <p>This is an automated notification from the Precise Analytics ATS.</p>
  `;

  try {
    await resend.emails.send({
      from: 'careers@preciseanalytics.io',
      to: ['careers@preciseanalytics.io'],
      subject,
      html: emailContent
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}