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

// PUT - Update job (FIXED VERSION - handles both status updates and full updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const jobData = await request.json();
    
    console.log('📝 Updating job:', jobId, 'Data:', jobData);

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // FIXED: Only require title/description for full job updates, not status changes
    const isStatusOnlyUpdate = Object.keys(jobData).length === 1 && jobData.status;
    
    if (!isStatusOnlyUpdate && (!jobData.title || !jobData.description)) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required for job content updates'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Simple update - get current job first, then update with provided fields
    const currentJob = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    
    if (currentJob.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Use provided values or keep existing ones
    const current = currentJob[0];
    
    const result = await sql`
      UPDATE jobs 
      SET 
        title = ${jobData.title || current.title},
        department = ${jobData.department || current.department || ''},
        location = ${jobData.location || current.location || ''},
        type = ${jobData.type || current.type || 'full_time'},
        salary_range = ${jobData.salary_range || current.salary_range || ''},
        description = ${jobData.description || current.description},
        requirements = ${jobData.requirements || current.requirements || ''},
        benefits = ${jobData.benefits || current.benefits || ''},
        status = ${jobData.status || current.status || 'published'},
        remote_option = ${jobData.remote_option !== undefined ? jobData.remote_option : current.remote_option || false},
        expires_at = ${jobData.expires_at || current.expires_at || null},
        priority = ${jobData.priority || current.priority || 'medium'},
        updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING *
    `;

    console.log('✅ Job updated successfully:', result[0].title);

    return NextResponse.json({
      success: true,
      job: result[0],
      message: isStatusOnlyUpdate 
        ? `Job status updated to ${jobData.status}` 
        : 'Job updated successfully'
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job update error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
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