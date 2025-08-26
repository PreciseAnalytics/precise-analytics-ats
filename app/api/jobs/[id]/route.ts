// app/api/jobs/[id]/route.ts - FIXED VERSION
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

    // FIXED: Use proper parameterized query
    const result = await sql`
      SELECT 
        id, title, department, location, type, salary_range,
        description, requirements, benefits, status, 
        created_at, updated_at, expires_at, remote_option,
        priority, posted_by, posted
      FROM jobs 
      WHERE id = ${jobId}
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log('❌ Job not found:', jobId);
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const job = result[0];
    console.log('✅ Found job:', { 
      id: job.id, 
      title: job.title, 
      status: job.status, 
      posted: job.posted 
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
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT - Update job (FIXED with proper parameterized queries)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const jobData = await request.json();
    
    console.log('📝 Updating job:', jobId, 'Data received:', JSON.stringify(jobData));

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validate status if provided
    const validStatuses = ['published', 'archived', 'deactivated', 'draft', 'active'];
    if (jobData.status && !validStatuses.includes(jobData.status)) {
      console.log('❌ Invalid status received:', jobData.status);
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get current job first
    const currentJobResult = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    
    if (currentJobResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const current = currentJobResult[0];
    
    // FIXED: Use proper parameterized update with coalescing
    const result = await sql`
      UPDATE jobs 
      SET 
        title = ${jobData.title ?? current.title},
        department = ${jobData.department ?? current.department ?? ''},
        location = ${jobData.location ?? current.location ?? ''},
        type = ${jobData.type ?? current.type ?? 'full_time'},
        salary_range = ${jobData.salary_range ?? current.salary_range ?? ''},
        description = ${jobData.description ?? current.description},
        requirements = ${jobData.requirements ?? current.requirements ?? ''},
        benefits = ${jobData.benefits ?? current.benefits ?? ''},
        status = ${jobData.status ?? current.status ?? 'published'},
        remote_option = ${jobData.remote_option ?? current.remote_option ?? false},
        expires_at = ${jobData.expires_at ?? current.expires_at},
        priority = ${jobData.priority ?? current.priority ?? 'medium'},
        updated_at = NOW(),
        posted = ${jobData.posted ?? current.posted}
      WHERE id = ${jobId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Update operation failed - no rows affected');
    }

    console.log('✅ Job updated successfully:', result[0].title, '- Status:', result[0].status);

    // Get application count for the updated job
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
        ...result[0],
        application_count: applicationCount
      },
      message: `Job updated successfully`
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job update error:', error);
    console.error('❌ Error stack:', error.stack);
    
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
// DELETE - Permanently delete job and associated applications
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    console.log('🗑️ Permanently deleting job:', jobId);

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

    // Delete associated applications first
    await sql`
      DELETE FROM applications 
      WHERE job_id = ${jobId}
    `;

    // Delete the job
    const result = await sql`
      DELETE FROM jobs 
      WHERE id = ${jobId}
      RETURNING id, title
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

    console.log('✅ Job permanently deleted:', jobId, '- Title:', result[0].title);

    return NextResponse.json({
      success: true,
      message: 'Job permanently deleted'
    }, { 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Job deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: error.message === 'Job not found' ? 404 : 500,
      headers: corsHeaders
    });
  }
}