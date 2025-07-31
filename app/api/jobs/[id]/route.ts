// app/api/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || (() => {
  throw new Error('DATABASE_URL environment variable is not set');
})());

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

// GET - Fetch individual job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    console.log('🔍 Fetching job with ID:', jobId);

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validate job ID format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job ID format'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Query the jobs table for the specific job
    const result = await sql`
      SELECT 
        id, title, department, location, type, salary_range,
        description, requirements, benefits, status, 
        created_at, updated_at, expires_at, remote_option,
        priority, posted_by
      FROM jobs 
      WHERE id = ${jobId} AND status = 'published'
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log('❌ Job not found or not published:', jobId);
      return NextResponse.json({
        success: false,
        error: 'Job not found or not published'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const job = result[0];
    console.log('✅ Found job:', { 
      id: job.id, 
      title: job.title, 
      status: job.status 
    });

    // Add application count for this job
    let applicationCount = 0;
    try {
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE job_id = ${jobId}
      `;
      applicationCount = parseInt(countResult[0]?.count || '0');
    } catch (countError) {
      console.warn('⚠️ Failed to get application count:', countError);
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        application_count: applicationCount
      }
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job fetch error:', error);
    
    let errorMessage = 'Failed to fetch job details';
    let statusCode = 500;

    if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      errorMessage = 'Database connection error. Please try again.';
      statusCode = 503;
    } else if (error.message?.includes('invalid input syntax')) {
      errorMessage = 'Invalid job ID format';
      statusCode = 400;
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

// PUT - Update job (for ATS management)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const jobData = await request.json();
    
    console.log('📝 Updating job:', jobId);

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validate required fields for update
    if (!jobData.title || !jobData.description) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const result = await sql`
      UPDATE jobs 
      SET 
        title = ${jobData.title},
        department = ${jobData.department || ''},
        location = ${jobData.location || ''},
        type = ${jobData.type || 'full_time'},
        salary_range = ${jobData.salary_range || ''},
        description = ${jobData.description},
        requirements = ${jobData.requirements || ''},
        benefits = ${jobData.benefits || ''},
        status = ${jobData.status || 'published'},
        remote_option = ${jobData.remote_option || false},
        expires_at = ${jobData.expires_at || null},
        priority = ${jobData.priority || 'medium'},
        updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Job updated successfully:', result[0].title);

    return NextResponse.json({
      success: true,
      job: result[0],
      message: 'Job updated successfully'
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job update error:', error);
    
    let errorMessage = 'Failed to update job';
    let statusCode = 500;

    if (error.message?.includes('constraint') || error.message?.includes('invalid')) {
      errorMessage = 'Invalid job data provided';
      statusCode = 400;
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

// DELETE - Archive job (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    console.log('🗑️ Archiving job:', jobId);

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Soft delete by changing status to 'archived'
    const result = await sql`
      UPDATE jobs 
      SET 
        status = 'archived', 
        updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING id, title, status
    `;

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Job archived successfully:', result[0].title);

    // Check if there are any applications for this job
    let applicationCount = 0;
    try {
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE job_id = ${jobId}
      `;
      applicationCount = parseInt(countResult[0]?.count || '0');
    } catch (countError) {
      console.warn('⚠️ Failed to get application count:', countError);
    }

    return NextResponse.json({
      success: true,
      message: 'Job archived successfully',
      job: {
        ...result[0],
        application_count: applicationCount
      }
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to archive job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}