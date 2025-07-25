// app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io',
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
    const status = searchParams.get('status');
    const positionId = searchParams.get('position_id');
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.email,
        a.phone,
        a.position_id,
        a.position_applied,
        a.resume_url,
        a.cover_letter,
        a.linkedin_url,
        a.portfolio_url,
        a.status,
        a.source,
        a.notes,
        a.rating,
        a.applied_at,
        a.updated_at,
        COALESCE(p.title, 'Unknown Position') as position_title,
        COALESCE(p.department, '') as position_department,
        COALESCE(p.location, 'Remote') as position_location
      FROM applications a
      LEFT JOIN positions p ON a.position_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    if (positionId) {
      paramCount++;
      query += ` AND a.position_id = $${paramCount}`;
      params.push(positionId);
    }

    query += ` ORDER BY a.applied_at DESC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Transform for dashboard compatibility
    const applications = result.rows.map(row => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      position: row.position_applied || row.position_title,
      location: row.position_location,
      stage: row.status,
      applied_date: row.applied_at,
      source: row.source,
      resume_url: row.resume_url,
      cover_letter: row.cover_letter,
      rating: row.rating,
      notes: row.notes
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM applications a WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (positionId) {
      countParamCount++;
      countQuery += ` AND a.position_id = $${countParamCount}`;
      countParams.push(positionId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      success: true,
      applications: applications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
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
      position_id,
      position_applied,
      first_name,
      last_name,
      email,
      phone,
      resume_url,
      cover_letter,
      linkedin_url,
      portfolio_url,
      source = 'careers_website'
    } = body;

    console.log('📝 Received application:', {
      position_id,
      position_applied,
      name: `${first_name} ${last_name}`,
      email,
      source
    });

    // Validate required fields
    if (!position_id || !first_name || !last_name || !email) {
      return NextResponse.json({
        error: 'Missing required fields: position_id, first_name, last_name, email'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if position exists and get title if position_applied not provided
    const positionCheck = await pool.query(
      'SELECT id, title FROM positions WHERE id = $1 AND status = $2',
      [position_id, 'active']
    );

    if (positionCheck.rows.length === 0) {
      return NextResponse.json({
        error: 'Position not found or not active'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    // Use provided position_applied or fallback to position title from database
    const finalPositionApplied = position_applied || positionCheck.rows[0].title;

    // Insert new application
    const insertQuery = `
      INSERT INTO applications (
        position_id, position_applied, first_name, last_name, email, phone,
        resume_url, cover_letter, linkedin_url, portfolio_url, source, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'submitted')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      position_id, finalPositionApplied, first_name, last_name, email, phone,
      resume_url, cover_letter, linkedin_url, portfolio_url, source
    ]);

    console.log('✅ Application created successfully:', {
      id: result.rows[0].id,
      position: finalPositionApplied,
      applicant: `${first_name} ${last_name}`
    });

    // Log status change
    try {
      await pool.query(
        'INSERT INTO application_status_history (application_id, new_status, notes) VALUES ($1, $2, $3)',
        [result.rows[0].id, 'submitted', 'Application submitted from careers page']
      );
    } catch (historyError: any) {
      console.log('Status history logging skipped:', historyError.message);
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: result.rows[0]
    }, {
      status: 201,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Application submission error:', error);
    return NextResponse.json({
      error: 'Failed to submit application',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, rating, interviewer_id } = body;

    if (!id) {
      return NextResponse.json({
        error: 'Application ID is required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current application status
    const currentApp = await pool.query(
      'SELECT status FROM applications WHERE id = $1',
      [id]
    );

    if (currentApp.rows.length === 0) {
      return NextResponse.json({
        error: 'Application not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const oldStatus = currentApp.rows[0].status;

    // Update application
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (status) {
      updateFields.push(`status = $${++paramCount}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (rating !== undefined) {
      updateFields.push(`rating = $${++paramCount}`);
      values.push(rating);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        error: 'No fields to update'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE applications 
      SET ${updateFields.join(', ')} 
      WHERE id = $${++paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    // Log status change if status was updated
    if (status && status !== oldStatus) {
      try {
        await pool.query(
          'INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, notes) VALUES ($1, $2, $3, $4, $5)',
          [id, oldStatus, status, interviewer_id || null, notes || `Status changed from ${oldStatus} to ${status}`]
        );
      } catch (historyError: any) {
        console.log('Status history logging skipped:', historyError.message);
      }
    }

    return NextResponse.json({
      message: 'Application updated successfully',
      application: result.rows[0]
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Application update error:', error);
    return NextResponse.json({
      error: 'Failed to update application',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}