import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`🔄 Updating job ${id}:`, body);
    
    // Handle status toggle (publish/unpublish)
    if (body.posted !== undefined) {
      const result = await sql`
        UPDATE jobs 
        SET status = ${body.posted ? 'published' : 'draft'}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return Response.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 });
      }

      console.log(`✅ Job ${id} ${body.posted ? 'published' : 'unpublished'}`);

      return Response.json({
        success: true,
        job: result[0]
      });
    }
    
    // Handle full job update (from edit form)
    else {
      const result = await sql`
        UPDATE jobs SET
          title = ${body.title},
          department = ${body.department},
          location = ${body.location},
          type = ${body.employment_type || body.type},
          salary_range = ${body.salary_range},
          description = ${body.description},
          requirements = ${body.requirements},
          benefits = ${body.benefits || ''},
          status = ${body.posted ? 'published' : 'draft'},
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
    }
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