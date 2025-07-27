import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();
    
    console.log(`🔄 Updating application ${id} to status: ${status}`);
    
    const result = await sql`
      UPDATE applications 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status
    `;

    if (result.length === 0) {
      return Response.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    console.log(`✅ Updated application ${id} to ${status}`);

    return Response.json({
      success: true,
      application: result[0]
    });
  } catch (error) {
    console.error('❌ Status update error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to update status',
      details: error.message
    }, { status: 500 });
  }
}