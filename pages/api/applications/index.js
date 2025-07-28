// pages/api/applications/index.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    } else {
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} not allowed` 
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// GET - Fetch all applications (Fixed date handling and job titles)
async function handleGet(req, res) {
  try {
    console.log('🔍 Fetching applications from database...');
    
    const applications = await sql`
      SELECT 
        a.id,
        CONCAT(a.first_name, ' ', a.last_name) as full_name,
        a.first_name,
        a.last_name,
        a.email,
        COALESCE(j.title, a.position_applied, 'Position Not Listed') as position,
        a.status,
        a.applied_at,
        a.application_date,
        a.updated_at,
        a.phone,
        a.resume_url,
        a.cover_letter_url,
        a.linkedin_url,
        a.portfolio_url,
        a.years_experience,
        a.source,
        a.notes,
        a.job_id,
        j.title as job_title,
        j.department
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      ORDER BY a.applied_at DESC
    `;

    // Process applications to ensure proper date formatting
    const processedApplications = applications.map(app => ({
      ...app,
      // Ensure dates are properly formatted
      applied_at: app.applied_at ? new Date(app.applied_at).toISOString() : null,
      application_date: app.application_date ? new Date(app.application_date).toISOString() : null,
      updated_at: app.updated_at ? new Date(app.updated_at).toISOString() : null,
      // Add created_at alias for compatibility
      created_at: app.applied_at ? new Date(app.applied_at).toISOString() : null,
      // Ensure position is never null
      position: app.position || 'Position Not Listed'
    }));

    console.log(`✅ Found ${applications.length} applications`);

    return res.status(200).json({
      success: true,
      applications: processedApplications
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}

// POST - Submit new application (Updated to match actual database schema)
async function handlePost(req, res) {
  try {
    console.log('📝 Submitting new application...');
    console.log('Request body:', req.body);

    const {
      job_id,
      first_name,
      last_name,
      email,
      phone,
      linkedin_url,
      portfolio_url,
      position_applying_for,
      years_experience,
      why_interested,
      resume_url,
      cover_letter_url,
      cover_letter_text,
      source = 'careers_website'
    } = req.body;

    // Validate required fields (matching your database schema)
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email'
      });
    }

    // Convert years_experience to integer if provided
    const experienceYears = years_experience ? parseInt(years_experience) : null;

    // Insert new application into database (matching your actual schema)
    const newApplication = await sql`
      INSERT INTO applications (
        job_id,
        first_name,
        last_name,
        email,
        phone,
        linkedin_url,
        portfolio_url,
        position_applied,
        years_experience,
        resume_url,
        cover_letter,
        cover_letter_url,
        status,
        stage,
        source,
        applied_at,
        updated_at,
        application_date
      ) VALUES (
        ${job_id},
        ${first_name},
        ${last_name},
        ${email},
        ${phone || ''},
        ${linkedin_url || ''},
        ${portfolio_url || ''},
        ${position_applying_for || ''},
        ${experienceYears},
        ${resume_url || ''},
        ${cover_letter_text || why_interested || ''},
        ${cover_letter_url || ''},
        'submitted',
        'applied',
        ${source},
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id, first_name, last_name, email, position_applied, status, applied_at
    `;

    console.log('✅ Application submitted successfully:', newApplication[0]);

    // Send email notification to careers@preciseanalytics.io
    try {
      await sendNotificationEmail({
        application: newApplication[0],
        applicant_name: `${first_name} ${last_name}`,
        position: position_applying_for,
        email: email,
        phone: phone,
        linkedin: linkedin_url,
        portfolio: portfolio_url,
        resume_url: resume_url,
        cover_letter: why_interested || cover_letter_text
      });
    } catch (emailError) {
      console.error('Email notification failed (non-critical):', emailError);
      // Don't fail the application submission if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: newApplication[0]
    });

  } catch (error) {
    console.error('❌ Application submission error:', error);
    
    // Handle specific database errors
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        error: 'An application with this email already exists for this position'
      });
    }
    
    if (error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }
    
    throw error;
  }
}

// Email notification function
async function sendNotificationEmail(data) {
  // Simple email notification - you can enhance this later
  console.log('📧 Email notification would be sent to careers@preciseanalytics.io');
  console.log('Application details:', {
    name: data.applicant_name,
    position: data.position,
    email: data.email,
    applied_at: new Date().toISOString()
  });
  
  // TODO: Implement actual email sending using nodemailer or similar
  // For now, just log the notification
}