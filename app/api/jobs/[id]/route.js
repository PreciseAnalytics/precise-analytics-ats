import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const jobData = await request.json();
    console.log(`🔄 Updating job ${id}:`, jobData);
    
    const result = await sql`
      UPDATE jobs SET
        title = ${jobData.title},
        department = ${jobData.department},
        location = ${jobData.location},
        type = ${jobData.type},
        salary_range = ${jobData.salary_range},
        description = ${jobData.description},
        requirements = ${jobData.requirements},
        benefits = ${jobData.benefits},
        status = ${jobData.status},
        remote_option = ${jobData.remote_option},
        expires_at = ${jobData.expires_at},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    console.log('✅ Job updated:', result[0]);
    return Response.json({
      success: true,
      job: result[0]
    });
  } catch (error) {
    console.error('❌ Job update error:', error);
    return Response.json({
      success: false,
      error: 'Failed to update job',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    console.log(`🗑️ Deleting job ${id}`);
    
    const result = await sql`
      DELETE FROM jobs 
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    console.log('✅ Job deleted:', result[0]);
    return Response.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('❌ Job deletion error:', error);
    return Response.json({
      success: false,
      error: 'Failed to delete job',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  return response;
}