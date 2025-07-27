import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`🔄 Updating job ${id}:`, body);
    console.log('Request body keys:', Object.keys(body));
    
    // Handle status toggle (publish/unpublish) - from publish button
    if (body.posted !== undefined && Object.keys(body).length === 1) {
      console.log('📌 Status toggle request');
      
      const result = await sql`
        UPDATE jobs 
        SET status = ${body.posted ? 'published' : 'draft'}, 
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

      console.log(`✅ Job ${id} ${body.posted ? 'published' : 'unpublished'}`);

      return Response.json({
        success: true,
        job: result[0]
      });
    }
    
    // Handle full job update (from edit form)
    else {
      console.log('📝 Full job update request');
      
      // Validate required fields
      if (!body.title || !body.department) {
        return Response.json({
          success: false,
          error: 'Title and department are required'
        }, { status: 400 });
      }

      const result = await sql`
        UPDATE jobs SET
          title = ${body.title},
          department = ${body.department},
          location = ${body.location || ''},
          type = ${body.employment_type || body.type || 'Full-time'},
          salary_range = ${body.salary_range || ''},
          description = ${body.description || ''},
          requirements = ${body.requirements || ''},
          benefits = ${body.benefits || ''},
          status = ${body.status || 'draft'},
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

      console.log('✅ Job updated successfully:', result[0]);

      return Response.json({
        success: true,
        job: result[0],
        message: 'Job updated successfully'
      });
    }
  } catch (error) {
    console.error('❌ Job update error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to update job',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      RETURNING id, title
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
      message: 'Job deleted successfully',
      job: result[0]
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

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log(`📖 Fetching job ${id}`);
    
    const result = await sql`
      SELECT * FROM jobs 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      job: result[0]
    });
  } catch (error) {
    console.error('❌ Job fetch error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to fetch job',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}