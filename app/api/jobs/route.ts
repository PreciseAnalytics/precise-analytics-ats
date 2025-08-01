// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || (() => {
  throw new Error('DATABASE_URL environment variable is not set');
})());

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// GET - Fetch all jobs (modified to include all statuses by default)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching all jobs...');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Query for all jobs if no status is specified, otherwise filter by status
    const jobs = await sql`
      SELECT 
        id, title, department, location, type, salary_range,
        description, requirements, benefits, status, 
        created_at, updated_at, expires_at, remote_option,
        priority, posted_by
      FROM jobs 
      ${status ? sql`WHERE status = ${status}` : sql``}
      ORDER BY created_at DESC
    `;

    console.log(`✅ Found ${jobs.length} jobs${status ? ` with status: ${status}` : ''}`);

    // Return in the format the frontend expects
    return NextResponse.json({
      success: true,
      jobs: jobs,
      total: jobs.length
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Jobs fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();
    console.log('📝 Creating new job:', jobData.title);

    // Validate required fields
    if (!jobData.title || !jobData.description) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Create the job
    const result = await sql`
      INSERT INTO jobs (
        title, department, location, type, salary_range,
        description, requirements, benefits, status,
        remote_option, expires_at, priority, posted_by
      ) VALUES (
        ${jobData.title},
        ${jobData.department || ''},
        ${jobData.location || ''},
        ${jobData.type || 'full_time'},
        ${jobData.salary_range || ''},
        ${jobData.description},
        ${jobData.requirements || ''},
        ${jobData.benefits || ''},
        ${jobData.status || 'published'},
        ${jobData.remote_option || false},
        ${jobData.expires_at || null},
        ${jobData.priority || 'medium'},
        ${jobData.posted_by || 'system'}
      )
      RETURNING *
    `;

    const newJob = result[0];
    console.log('✅ Job created successfully:', newJob.title);

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Job created successfully'
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}