// pages/api/applications/[id].js
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

  // Validate application ID
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid application ID is required' 
    });
  }

  const applicationId = parseInt(id);
  console.log(`${method} request for application ID: ${applicationId}`);

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, applicationId);
        break;
      case 'PUT':
        await handlePut(req, res, applicationId);
        break;
      case 'DELETE':
        await handleDelete(req, res, applicationId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Individual Application API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GET - Fetch individual application with full details
async function handleGet(req, res, applicationId) {
  try {
    console.log('Fetching application:', applicationId);

    // Get application with job details
    const application = await sql`
      SELECT 
        a.*,
        j.title as job_title,
        j.department,
        j.location,
        j.type,
        j.salary_range,
        j.description as job_description,
        j.requirements as job_requirements
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ${applicationId}
    `;

    if (application.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    console.log('Application found:', application[0]);

    res.status(200).json({
      success: true,
      application: application[0]
    });

  } catch (error) {
    console.error('Error in handleGet:', error);
    throw error;
  }
}

// PUT - Update application status
async function handlePut(req, res, applicationId) {
  try {
    console.log('PUT request body:', req.body);
    console.log('Updating application:', applicationId);

    const { status, notes, updated_by = 'system' } = req.body;

    // Enhanced status categories validation
    const validStatuses = [
      'applied', 
      'not_selected', 
      'shortlisted_for_interview', 
      'interviewing',
      'first_interview', 
      'second_interview', 
      'hired', 
      'not_hired', 
      'background_check', 
      'onboarding', 
      'withdrawn',
      // Also accept old statuses for compatibility
      'rejected',
      'submitted', 
      'interview',
      'screening'
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    // Check if application exists first
    console.log('Checking if application exists...');
    const existingApp = await sql`
      SELECT id, status, first_name, last_name, email 
      FROM applications 
      WHERE id = ${applicationId}
    `;

    if (existingApp.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    const oldStatus = existingApp[0].status;
    console.log('Current status:', oldStatus, '-> New status:', status);

    // Update application
    let updatedApplication;
    
    if (status && notes) {
      console.log('Updating status and notes...');
      updatedApplication = await sql`
        UPDATE applications 
        SET 
          status = ${status}, 
          notes = ${notes}, 
          updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING *
      `;
    } else if (status) {
      console.log('Updating status only...');
      updatedApplication = await sql`
        UPDATE applications 
        SET 
          status = ${status}, 
          updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING *
      `;
    } else if (notes) {
      console.log('Updating notes only...');
      updatedApplication = await sql`
        UPDATE applications 
        SET 
          notes = ${notes}, 
          updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING *
      `;
    } else {
      // Just update timestamp
      console.log('Updating timestamp only...');
      updatedApplication = await sql`
        UPDATE applications 
        SET updated_at = NOW()
        WHERE id = ${applicationId}
        RETURNING *
      `;
    }

    if (updatedApplication.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Failed to update application' 
      });
    }

    console.log('Application updated successfully:', updatedApplication[0]);

    // Optional: Try to log activity (non-critical)
    if (status && status !== oldStatus) {
      try {
        console.log('Logging activity...');
        await sql`
          INSERT INTO application_activity_log (
            application_id, action, old_status, new_status, notes, created_by, created_at
          ) VALUES (
            ${applicationId}, 
            'status_changed', 
            ${oldStatus}, 
            ${status}, 
            ${notes || `Status changed from ${oldStatus} to ${status}`}, 
            ${updated_by}, 
            NOW()
          )
        `;
        console.log('Activity logged successfully');
      } catch (logError) {
        console.log('Activity logging failed (non-critical):', logError.message);
        // Don't fail the request if activity logging fails
      }
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication[0],
      old_status: oldStatus,
      new_status: status
    });

  } catch (error) {
    console.error('Error in handlePut:', error);
    throw error;
  }
}

// DELETE - Delete application
async function handleDelete(req, res, applicationId) {
  try {
    console.log('Deleting application:', applicationId);

    // Check if application exists
    const existingApp = await sql`
      SELECT id, first_name, last_name, email 
      FROM applications 
      WHERE id = ${applicationId}
    `;

    if (existingApp.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    // Delete the application
    const deletedApp = await sql`
      DELETE FROM applications 
      WHERE id = ${applicationId}
      RETURNING id, first_name, last_name, email
    `;

    console.log('Application deleted successfully:', deletedApp[0]);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      deleted_application: deletedApp[0]
    });

  } catch (error) {
    console.error('Error in handleDelete:', error);
    throw error;
  }
}