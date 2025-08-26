// app/api/hr-users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { Resend } from 'resend';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preciseanalytics.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function verifyAdminAuth(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  
  if (!authToken) {
    return { error: 'Authentication required', status: 401 };
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const userQuery = 'SELECT id, email, role, is_active FROM hr_users WHERE id = $1 OR email = $2';
      const userResult = await client.query(userQuery, [decoded.userId, decoded.email]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].is_active || userResult.rows[0].role !== 'admin') {
        return { error: 'Admin access required', status: 403 };
      }

      return { user: userResult.rows[0], status: 200 };
    } finally {
      client.release();
    }
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// PUT - Update HR user (activate/deactivate)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await verifyAdminAuth(request);
  if (authCheck.error) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status, headers: corsHeaders }
    );
  }

  const client = await pool.connect();
  
  try {
    const userId = params.id;
    const { is_active } = await request.json();

    console.log(`📝 Updating HR user ${userId}:`, { is_active });

    // Validate that user exists
    const userQuery = 'SELECT id, email, first_name, last_name, is_active FROM hr_users WHERE id = $1';
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const currentUser = userResult.rows[0];

    // Prevent admin from deactivating themselves
    if (authCheck.user.id === userId && is_active === false) {
      return NextResponse.json({
        success: false,
        error: 'You cannot deactivate your own account'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Update user
    const updateQuery = `
      UPDATE hr_users 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [is_active, userId]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update user'
      }, {
        status: 500,
        headers: corsHeaders
      });
    }

    // Log the action
    const auditQuery = `
      INSERT INTO hr_user_audit (hr_user_id, action, performed_by, performed_by_email, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(auditQuery, [
      userId,
      is_active ? 'activated' : 'deactivated',
      authCheck.user.id,
      authCheck.user.email,
      JSON.stringify({ 
        previous_status: currentUser.is_active,
        new_status: is_active 
      })
    ]);

    console.log(`✅ HR user ${is_active ? 'activated' : 'deactivated'}:`, currentUser.email);

    return NextResponse.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error updating HR user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}

// DELETE - Remove HR user completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await verifyAdminAuth(request);
  if (authCheck.error) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status, headers: corsHeaders }
    );
  }

  const client = await pool.connect();
  
  try {
    const userId = params.id;

    console.log(`🗑️ Deleting HR user: ${userId}`);

    // Prevent admin from deleting themselves
    if (authCheck.user.id === userId) {
      return NextResponse.json({
        success: false,
        error: 'You cannot delete your own account'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get user info for audit
    const userQuery = 'SELECT email, first_name, last_name FROM hr_users WHERE id = $1';
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const user = userResult.rows[0];

    // Delete user (audit records will remain due to foreign key constraints)
    const deleteQuery = 'DELETE FROM hr_users WHERE id = $1';
    const result = await client.query(deleteQuery, [userId]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete user'
      }, {
        status: 500,
        headers: corsHeaders
      });
    }

    // Log the deletion
    const auditQuery = `
      INSERT INTO hr_user_audit (hr_user_id, action, performed_by, performed_by_email, details)
      VALUES ($1, 'deleted', $2, $3, $4)
    `;
    
    await client.query(auditQuery, [
      userId,
      authCheck.user.id,
      authCheck.user.email,
      JSON.stringify({
        deleted_user_email: user.email,
        deleted_user_name: `${user.first_name} ${user.last_name}`
      })
    ]);

    console.log(`✅ HR user deleted:`, user.email);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error deleting HR user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}