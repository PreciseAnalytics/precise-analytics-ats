import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    
    console.log('🔍 Fetching jobs...', { activeOnly });
    
    let query;
    if (activeOnly) {
      query = sql`
        SELECT 
          id, title, department, location, type, salary_range,
          description, requirements, benefits, status, 
          created_at, updated_at, expires_at, remote_option
        FROM jobs 
        WHERE status = 'published'
        ORDER BY created_at DESC
      `;
    } else {
      query = sql`
        SELECT 
          id, title, department, location, type, salary_range,
          description, requirements, benefits, status,
          created_at, updated_at, expires_at, remote_option,
          priority, posted_by
        FROM jobs 
        ORDER BY created_at DESC
      `;
    }
    
    const jobs = await query;
    console.log(`✅ Found ${jobs.length} jobs`);

    const response = Response.json({ success: true, jobs });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.error('❌ Jobs fetch error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch jobs',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const jobData = await request.json();
    console.log('🔄 Creating new job:', jobData);
    
    const result = await sql`
      INSERT INTO jobs (
        title, department, location, type, salary_range,
        description, requirements, benefits, status,
        remote_option, expires_at, posted_by, created_at, updated_at
      ) VALUES (
        ${jobData.title},
        ${jobData.department},
        ${jobData.location},
        ${jobData.type || 'full_time'},
        ${jobData.salary_range},
        ${jobData.description},
        ${jobData.requirements},
        ${jobData.benefits},
        ${jobData.posted ? 'published' : 'draft'},
        ${jobData.remote_option || false},
        ${jobData.expires_at || null},
        ${jobData.posted_by || 'system'},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    console.log('✅ Job created:', result[0]);
    return Response.json({ success: true, job: result[0] });
  } catch (error) {
    console.error('❌ Job creation error:', error);
    return Response.json({
      success: false,
      error: 'Failed to create job',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return response;
}