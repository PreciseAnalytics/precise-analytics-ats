// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    console.log('🔍 Fetching all jobs...');
    
    const jobs = await sql`
      SELECT 
        j.id, j.title, j.department, j.location, j.type, j.salary_range,
        j.description, j.requirements, j.benefits, j.status, 
        j.created_at, j.updated_at, j.expires_at, j.remote_option,
        j.priority, j.posted_by,
        COUNT(a.id)::int as application_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.status = 'published'
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `;

    console.log(`✅ Found ${jobs.length} jobs`);

    return NextResponse.json({
      success: true,
      jobs: jobs,
      total: jobs.length
    }, { headers: corsHeaders });

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

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();
    console.log('📝 Creating new job:', jobData.title);

    if (!jobData.title || !jobData.description) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required'
      }, { status: 400, headers: corsHeaders });
    }

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
      job: { ...newJob, application_count: 0 },
      message: 'Job created successfully'
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Job creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create job'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
