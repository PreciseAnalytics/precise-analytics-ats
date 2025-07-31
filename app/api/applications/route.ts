import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || (() => {
  throw new Error('DATABASE_URL environment variable is not set');
})());

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// POST - Submit new application
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('📝 Received application for job:', data.job_id);
    console.log('Full payload:', data);

    const requiredFields = ['job_id', 'first_name', 'last_name', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('✅ Validation passed, inserting application...');

    const result = await sql`
      INSERT INTO applications (
        job_id, first_name, middle_name, last_name, email, phone,
        linkedin_url, portfolio_url, address, city, state, zip_code, country,
        work_authorized, visa_sponsorship, open_to_remote, preferred_work_location,
        total_experience, highest_education, position_applied, position_applying_for,
        available_start_date, expected_salary_range, interview_availability,
        gender, race_ethnicity, veteran_status, disability_status,
        signature, why_interested, resume_url, cover_letter_url,
        work_experiences, submission_date, status, created_at
      ) VALUES (
        ${data.job_id},
        ${data.first_name},
        ${data.middle_name || ''},
        ${data.last_name},
        ${data.email},
        ${data.phone},
        ${data.linkedin_url || ''},
        ${data.portfolio_url || ''},
        ${data.address || ''},
        ${data.city || ''},
        ${data.state || ''},
        ${data.zip_code || ''},
        ${data.country || 'United States'},
        ${data.work_authorized || ''},
        ${data.visa_sponsorship || ''},
        ${data.open_to_remote || ''},
        ${data.preferred_work_location || ''},
        ${data.total_experience || ''},
        ${data.highest_education || ''},
        ${data.position_applied || data.position_applying_for || ''},
        ${data.position_applying_for || ''},
        ${data.available_start_date || null},
        ${data.expected_salary_range || ''},
        ${data.interview_availability || ''},
        ${data.gender || ''},
        ${data.race_ethnicity || ''},
        ${data.veteran_status || ''},
        ${data.disability_status || ''},
        ${data.signature || ''},
        ${data.why_interested || ''},
        ${data.resume_url || ''},
        ${data.cover_letter_url || ''},
        ${JSON.stringify(data.work_experiences || [])},
        ${data.submission_date || new Date().toISOString()},
        'applied',
        NOW()
      ) RETURNING id
    `;

    const applicationId = result[0]?.id;
    console.log('✅ Application saved with ID:', applicationId);

    try {
      if (process.env.RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ATS Notifications <ats@preciseanalytics.io>',
            to: ['careers@preciseanalytics.io'],
            subject: `🆕 New Application: ${data.position_applying_for} - ${data.first_name} ${data.last_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff7d00, #ffa500); color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">🎯 New Job Application</h1>
                  <p style="margin: 5px 0 0 0;">Application for: <strong>${data.position_applying_for}</strong></p>
                </div>

                <div style="padding: 30px; background: #f9f9f9;">
                  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #ff7d00; margin-top: 0;">👤 Applicant Information</h3>
                    <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                    <p><strong>Phone:</strong> ${data.phone}</p>
                    <p><strong>Experience:</strong> ${data.total_experience} years</p>
                  </div>

                  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #ff7d00; margin-top: 0;">💭 Why They're Interested</h3>
                    <p style="line-height: 1.6;">${data.why_interested}</p>
                  </div>

                  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #ff7d00; margin-top: 0;">📎 Documents</h3>
                    ${data.resume_url ? `<p>• <a href="${data.resume_url}" target="_blank">Resume/CV</a></p>` : '<p>• No resume attached</p>'}
                    ${data.cover_letter_url ? `<p>• <a href="${data.cover_letter_url}" target="_blank">Cover Letter</a></p>` : ''}
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://precise-analytics-ats.vercel.app"
                      style="background: #ff7d00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      📋 View in ATS Dashboard
                    </a>
                  </div>
                </div>

                <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                  <p>Application ID: ${applicationId}</p>
                  <p>Submitted: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            `
          })
        });

        if (emailResponse.ok) {
          console.log('📧 Notification email sent successfully');
        } else {
          console.warn('📧 Email sending failed:', await emailResponse.text());
        }
      } else {
        console.log('📧 No RESEND_API_KEY found, skipping email notification');
      }
    } catch (emailError) {
      console.warn('📧 Email notification failed (non-critical):', emailError);
    }

    return NextResponse.json({
      success: true,
      application: {
        id: applicationId,
        status: 'submitted'
      },
      message: 'Application submitted successfully'
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Application submission error:', error);

    let errorMessage = 'Failed to submit application';
    let statusCode = 500;

    if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
      errorMessage = 'Application already exists for this position and email';
      statusCode = 409;
    } else if (error.message?.includes('foreign key') || error.message?.includes('job_id')) {
      errorMessage = 'Invalid job position selected';
      statusCode = 400;
    } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      errorMessage = 'Database structure mismatch. Please run the database update script.';
      statusCode = 500;
    } else if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      errorMessage = 'Database connection error. Please try again.';
      statusCode = 503;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: statusCode,
      headers: corsHeaders
    });
  }
}

// GET - Fetch applications (unchanged)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'applied';
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📋 Fetching applications:', { status, jobId, limit, offset });

    let applications;

    if (jobId && status !== 'all') {
      applications = await sql`
        SELECT 
          a.id, a.job_id, a.first_name, a.last_name, a.email, a.phone,
          a.position_applying_for, a.status, a.submission_date, a.total_experience,
          a.highest_education, a.expected_salary_range, a.why_interested,
          a.resume_url, a.cover_letter_url, a.created_at,
          j.title as job_title, j.department as job_department
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        WHERE a.status = ${status} AND a.job_id = ${jobId}
        ORDER BY a.submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (jobId) {
      applications = await sql`
        SELECT 
          a.id, a.job_id, a.first_name, a.last_name, a.email, a.phone,
          a.position_applying_for, a.status, a.submission_date, a.total_experience,
          a.highest_education, a.expected_salary_range, a.why_interested,
          a.resume_url, a.cover_letter_url, a.created_at,
          j.title as job_title, j.department as job_department
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        WHERE a.job_id = ${jobId}
        ORDER BY a.submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (status !== 'all') {
      applications = await sql`
        SELECT 
          a.id, a.job_id, a.first_name, a.last_name, a.email, a.phone,
          a.position_applying_for, a.status, a.submission_date, a.total_experience,
          a.highest_education, a.expected_salary_range, a.why_interested,
          a.resume_url, a.cover_letter_url, a.created_at,
          j.title as job_title, j.department as job_department
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        WHERE a.status = ${status}
        ORDER BY a.submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      applications = await sql`
        SELECT 
          a.id, a.job_id, a.first_name, a.last_name, a.email, a.phone,
          a.position_applying_for, a.status, a.submission_date, a.total_experience,
          a.highest_education, a.expected_salary_range, a.why_interested,
          a.resume_url, a.cover_letter_url, a.created_at,
          j.title as job_title, j.department as job_department
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        ORDER BY a.submission_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    console.log(`✅ Found ${applications.length} applications`);

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        limit,
        offset,
        total: applications.length,
        hasMore: applications.length === limit
      }
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Applications fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}
