import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);

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
    return res.status(400).json({ error: 'Application ID is required' });
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
    console.error('Individual Application API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

// GET - Fetch individual application with full details
async function handleGet(req, res) {
  const { id } = req.query;

  try {
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
      WHERE a.id = ${id}
    `;

    if (application.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get application activity history
    let activityHistory = [];
    try {
      activityHistory = await sql`
        SELECT *
        FROM application_activity_log
        WHERE application_id = ${id}
        ORDER BY created_at DESC
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    res.status(200).json({
      success: true,
      application: application[0],
      activity_history: activityHistory
    });

  } catch (error) {
    throw error;
  }
}

// PUT - Update application status and details
async function handlePut(req, res) {
  const { id } = req.query;
  const { 
    status, 
    notes, 
    interview_date, 
    interview_feedback,
    salary_offer,
    start_date,
    updated_by = 'system'
  } = req.body;

  // Enhanced status categories as requested
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
    'withdrawn'
  ];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      valid_statuses: validStatuses
    });
  }

  try {
    // Get current application
    const currentApplication = await sql`
      SELECT a.*, j.title as job_title, j.department
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ${id}
    `;

    if (currentApplication.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = currentApplication[0];
    const oldStatus = application.status;

    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date();

    // Update application
    const updatedApplication = await sql`
      UPDATE applications 
      SET ${sql(updateData)}
      WHERE id = ${id}
      RETURNING *
    `;

    // Log activity with detailed information
    try {
      let activityDetails = {
        interview_date,
        interview_feedback,
        salary_offer,
        start_date
      };

      await sql`
        INSERT INTO application_activity_log (
          application_id, action, old_status, new_status, notes, created_by, created_at
        ) VALUES (${id}, ${status ? 'status_changed' : 'updated'}, ${oldStatus}, ${status || oldStatus}, ${notes || JSON.stringify(activityDetails)}, ${updated_by}, NOW())
      `;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }

    // Send notifications based on status change
    if (status && status !== oldStatus) {
      try {
        await sendStatusChangeNotifications(updatedApplication[0], application, oldStatus, status);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      application: {
        ...updatedApplication[0],
        job_title: application.job_title,
        department: application.department
      }
    });

  } catch (error) {
    throw error;
  }
}

// DELETE - Delete application
async function handleDelete(req, res) {
  const { id } = req.query;

  try {
    // Get application details
    const application = await sql`
      SELECT a.*, j.title as job_title
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ${id}
    `;

    if (application.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Delete related records first (if tables exist)
    try {
      await sql`DELETE FROM application_activity_log WHERE application_id = ${id}`;
    } catch (logError) {
      console.log('Activity log table may not exist yet:', logError.message);
    }
    
    // Delete the application
    await sql`DELETE FROM applications WHERE id = ${id}`;

    // Send deletion notification
    try {
      await sendDeletionNotificationEmail(application[0]);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    throw error;
  }
}

// Email notification helpers
async function sendStatusChangeNotifications(updatedApplication, jobInfo, oldStatus, newStatus) {
  // Send internal notification
  await sendInternalStatusNotification(updatedApplication, jobInfo, oldStatus, newStatus);
  
  // Send candidate notification for certain status changes
  const candidateNotificationStatuses = [
    'shortlisted_for_interview',
    'interviewing',
    'hired',
    'not_hired'
  ];

  if (candidateNotificationStatuses.includes(newStatus)) {
    await sendCandidateStatusNotification(updatedApplication, jobInfo, newStatus);
  }
}

async function sendInternalStatusNotification(application, jobInfo, oldStatus, newStatus) {
  const subject = `Application Status Update: ${jobInfo.job_title} - ${application.first_name} ${application.last_name}`;
  
  const statusMessages = {
    'not_selected': 'Application marked as not selected',
    'shortlisted_for_interview': 'Candidate shortlisted for interview',
    'interviewing': 'Interview process started',
    'first_interview': 'First interview completed',
    'second_interview': 'Second interview completed',
    'hired': 'Candidate hired!',
    'not_hired': 'Candidate not hired',
    'background_check': 'Background check initiated',
    'onboarding': 'Onboarding process started',
    'withdrawn': 'Application withdrawn'
  };

  try {
    await resend.emails.send({
      from: 'careers@preciseanalytics.io',
      to: ['careers@preciseanalytics.io'],
      subject,
      html: `
        <h2>Application Status Update</h2>
        <p><strong>Position:</strong> ${jobInfo.job_title}</p>
        <p><strong>Department:</strong> ${jobInfo.department}</p>
        <p><strong>Candidate:</strong> ${application.first_name} ${application.last_name}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Status Change:</strong> ${oldStatus} → ${newStatus}</p>
        <p><strong>Message:</strong> ${statusMessages[newStatus] || 'Status updated'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        ${application.notes ? `<p><strong>Notes:</strong> ${application.notes}</p>` : ''}
        
        <br>
        <p><a href="${process.env.NEXT_PUBLIC_ATS_URL}/applications/${application.id}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Application</a></p>
        <p>This is an automated notification from the Precise Analytics ATS.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send internal notification:', error);
  }
}

async function sendCandidateStatusNotification(application, jobInfo, status) {
  const statusSubjects = {
    'shortlisted_for_interview': 'Interview Opportunity',
    'interviewing': 'Interview Process Update',
    'hired': 'Congratulations - Job Offer',
    'not_hired': 'Application Status Update'
  };

  const statusMessages = {
    'shortlisted_for_interview': 'We are pleased to inform you that you have been shortlisted for an interview.',
    'interviewing': 'Your interview process is currently in progress.',
    'hired': 'Congratulations! We are pleased to offer you the position.',
    'not_hired': 'Thank you for your interest. We have decided to move forward with other candidates.'
  };

  const subject = `${statusSubjects[status]} - ${jobInfo.job_title}`;
  
  try {
    await resend.emails.send({
      from: 'careers@preciseanalytics.io',
      to: [application.email],
      subject,
      html: `
        <h2>${statusSubjects[status]}</h2>
        <p>Dear ${application.first_name} ${application.last_name},</p>
        <p>${statusMessages[status]}</p>
        
        <p><strong>Position:</strong> ${jobInfo.job_title}</p>
        <p><strong>Department:</strong> ${jobInfo.department}</p>
        
        ${status === 'shortlisted_for_interview' ? 
          '<p>Our team will contact you soon to schedule your interview. Please ensure your contact information is up to date.</p>' : ''}
        
        ${status === 'hired' ? 
          '<p>Our HR team will contact you shortly with next steps and onboarding information.</p>' : ''}
        
        <p>Thank you for your interest in Precise Analytics.</p>
        
        <br>
        <p>Best regards,<br>The Precise Analytics Team</p>
      `
    });
  } catch (error) {
    console.error('Failed to send candidate notification:', error);
  }
}

async function sendDeletionNotificationEmail(application) {
  const subject = `Application Deleted: ${application.job_title} - ${application.first_name} ${application.last_name}`;
  
  try {
    await resend.emails.send({
      from: 'careers@preciseanalytics.io',
      to: ['careers@preciseanalytics.io'],
      subject,
      html: `
        <h2>Application Deleted</h2>
        <p><strong>Position:</strong> ${application.job_title}</p>
        <p><strong>Candidate:</strong> ${application.first_name} ${application.last_name}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Deletion Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <p>This application has been permanently deleted from the ATS.</p>
        <p>This is an automated notification from the Precise Analytics ATS.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send deletion notification:', error);
  }
}