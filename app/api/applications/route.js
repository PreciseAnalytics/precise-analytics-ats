import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    console.log('🔍 Fetching applications from database...');
    
    const applications = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        position_applied as position,
        status,
        applied_at as created_at,
        updated_at,
        phone,
        resume_url,
        cover_letter_url,
        portfolio_url,
        linkedin_url,
        notes
      FROM applications 
      ORDER BY applied_at DESC
    `;

    console.log(`✅ Found ${applications.length} applications`);

    return Response.json({
      success: true,
      applications: applications
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to fetch applications',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200 });
}