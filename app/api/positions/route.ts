// app/api/positions/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const includeCount = searchParams.get('include_count') === 'true';
    
    console.log('📋 Fetching positions with status:', status);

    let query = `
      SELECT 
        p.id,
        p.title,
        p.department,
        p.location,
        p.employment_type,
        p.salary_min,
        p.salary_max,
        p.description,
        p.requirements,
        p.benefits,
        p.status,
        p.posted_date,
        p.application_deadline,
        p.created_at,
        p.updated_at
    `;

    // Add application count if requested
    if (includeCount) {
      query += `, COUNT(a.id) as application_count`;
    }

    query += `
      FROM positions p
    `;

    if (includeCount) {
      query += ` LEFT JOIN applications a ON p.id = a.position_id`;
    }

    query += ` WHERE p.status = $1`;

    if (includeCount) {
      query += ` GROUP BY p.id, p.title, p.department, p.location, p.employment_type, p.salary_min, p.salary_max, p.description, p.requirements, p.benefits, p.status, p.posted_date, p.application_deadline, p.created_at, p.updated_at`;
    }

    query += ` ORDER BY p.posted_date DESC`;

    const result = await pool.query(query, [status]);

    console.log('✅ Found', result.rows.length, 'positions');

    // Transform data for careers page compatibility
    const positions = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      location: `${row.location} | ${row.employment_type}`,
      description: row.description,
      requirements: row.requirements ? row.requirements.split('\n').filter(req => req.trim()) : [],
      department: row.department,
      employment_type: row.employment_type,
      salary_min: row.salary_min,
      salary_max: row.salary_max,
      benefits: row.benefits,
      status: row.status,
      posted_date: row.posted_date,
      application_deadline: row.application_deadline,
      application_count: includeCount ? parseInt(row.application_count || 0) : undefined
    }));

    return NextResponse.json({
      success: true,
      positions: positions
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Positions fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch positions',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      department,
      location,
      employment_type,
      salary_min,
      salary_max,
      description,
      requirements,
      benefits,
      application_deadline
    } = body;

    console.log('📝 Creating new position:', { title, department, location });

    // Validate required fields
    if (!title || !description || !location) {
      return NextResponse.json({
        error: 'Missing required fields: title, description, location'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Process requirements (convert array to text or keep as text)
    const processedRequirements = Array.isArray(requirements) 
      ? requirements.join('\n') 
      : requirements || '';

    // Insert new position
    const insertQuery = `
      INSERT INTO positions (
        title, department, location, employment_type, salary_min, salary_max,
        description, requirements, benefits, application_deadline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      title,
      department || 'General',
      location,
      employment_type || 'Full-Time',
      salary_min || null,
      salary_max || null,
      description,
      processedRequirements,
      benefits || null,
      application_deadline || null
    ]);

    console.log('✅ Position created successfully:', {
      id: result.rows[0].id,
      title: result.rows[0].title
    });

    return NextResponse.json({
      success: true,
      message: 'Position created successfully',
      position: result.rows[0]
    }, {
      status: 201,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ Position creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create position',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}