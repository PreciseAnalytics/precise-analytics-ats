import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL);
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

  try {
    switch (req.method) {
      case 'GET':
        // Fetch all applications with job titles (for ATS dashboard)
        const applications = await sql`
          SELECT 
            a.id,
            a.job_id,
            a.first_name,
            a.last_name,
            a.email,
            a.phone,
            a.resume_url,
            a.cover_letter,
            a.status,
            a.applied_at,
            a.updated_at,
            a.notes,
            j.title as job_title
          FROM applications a
          LEFT JOIN jobs j ON a.job_id = j.id
          ORDER BY a.applied_at DESC
        `;
        res.status(200).json(applications);
        break;

      case 'POST':
        // Submit new application (from careers page)
        const { 
          job_id, 
          first_name, 
          last_name, 
          email, 
          phone, 
          resume_url, 
          cover_letter 
        } = req.body;
        
        // Insert new application
        const newApplication = await sql`
          INSERT INTO applications (
            job_id, 
            first_name, 
            last_name, 
            email, 
            phone, 
            resume_url, 
            cover_letter,
            status
          )
          VALUES (
            ${job_id}, 
            ${first_name}, 
            ${last_name}, 
            ${email}, 
            ${phone}, 
            ${resume_url}, 
            ${cover_letter},
            'applied'
          )
          RETURNING *
        `;

        // Get job details for email notification
        const job = await sql`
          SELECT title FROM jobs WHERE id = ${job_id}
        `;
        
        // Send notification email using Resend
        try {
          await resend.emails.send({
            from: 'careers@preciseanalytics.io',
            to: ['careers@preciseanalytics.io'],
            subject: `New Application: ${job[0]?.title || 'Unknown Position'}`,
            html: `
              <h2>New Job Application Received</h2>
              <p><strong>Position:</strong> ${job[0]?.title || 'Unknown Position'}</p>
              <p><strong>Applicant:</strong> ${first_name} ${last_name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Applied:</strong> ${new Date().toLocaleString()}</p>
              <br>
              <p><a href="https://precise-analytics-ats.vercel.app/dashboard" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in ATS Dashboard</a></p>
            `,
          });
          console.log('Email notification sent successfully via Resend');
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          // Don't fail the application submission if email fails
        }

        res.status(201).json(newApplication[0]);
        break;

      case 'PUT':
        // Update application status (from ATS dashboard)
        const applicationId = req.query.id || req.body.id;
        const { status, notes } = req.body;
        
        const updatedApplication = await sql`
          UPDATE applications 
          SET 
            status = ${status},
            notes = ${notes || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${applicationId}
          RETURNING *
        `;
        
        res.status(200).json(updatedApplication[0]);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Applications API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}