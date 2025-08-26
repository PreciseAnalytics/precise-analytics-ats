// app/api/hr-users/invite/route.ts
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

// Middleware to verify admin authentication
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

// POST - Invite new HR user
export async function POST(request: NextRequest) {
  const authCheck = await verifyAdminAuth(request);
  if (authCheck.error) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status, headers: corsHeaders }
    );
  }

  const client = await pool.connect();
  
  try {
    const { first_name, last_name, email, role, department } = await request.json();

    console.log('📧 Creating HR user invitation for:', email);

    // Validate required fields
    if (!first_name || !last_name || !email || !role) {
      return NextResponse.json({
        success: false,
        error: 'First name, last name, email, and role are required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate role
    const validRoles = ['admin', 'hr_manager', 'hr_staff'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role specified'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id, email FROM hr_users WHERE email = $1';
    const existingUserResult = await client.query(existingUserQuery, [email.toLowerCase()]);
    
    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A user with this email address already exists'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert new HR user
    const insertQuery = `
      INSERT INTO hr_users (
        first_name, last_name, email, role, department, 
        invitation_token, invitation_expires_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name, last_name, email
    `;

    const result = await client.query(insertQuery, [
      first_name,
      last_name,
      email.toLowerCase(),
      role,
      department || null,
      invitationToken,
      expiresAt,
      authCheck.user.id
    ]);

    const newUser = result.rows[0];

    // Create setup link
    const setupLink = `${process.env.NODE_ENV === 'production' 
      ? 'https://precise-analytics-ats.vercel.app' 
      : 'http://localhost:3000'}/hr-setup?token=${invitationToken}`;

    console.log('📧 Sending invitation email to:', email);

    // Send invitation email
    try {
      const emailResult = await resend.emails.send({
        from: 'Precise Analytics <noreply@resend.dev>',
        to: [email],
        subject: 'HR Access Invitation - Precise Analytics ATS',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HR Access Invitation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px;">
                Precise Analytics
              </div>
              <p style="color: white; margin: 0; font-size: 18px;">HR Team Invitation</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi ${first_name},</p>
              
              <p>You've been invited to join the Precise Analytics HR team with access to our internal Applicant Tracking System.</p>
              
              <p><strong>Your Role:</strong> ${role === 'admin' ? 'Administrator' : role === 'hr_manager' ? 'HR Manager' : 'HR Staff'}</p>
              ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Set Up Your Account
                </a>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol style="padding-left: 20px;">
                <li>Click the link above to verify your email address</li>
                <li>Create a secure password for your account</li>
                <li>Access the ATS system and start managing applications</li>
              </ol>
              
              <p><strong>Important:</strong> This invitation will expire in 7 days for security reasons.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px;">
                Welcome to the team!<br>
                The Precise Analytics HR Team<br>
                <em>Minority-Owned • Veteran-Owned • SDVOSB Certified</em>
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <span style="word-break: break-all;">${setupLink}</span>
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
Hi ${first_name},

You've been invited to join the Precise Analytics HR team with access to our internal Applicant Tracking System.

Your Role: ${role === 'admin' ? 'Administrator' : role === 'hr_manager' ? 'HR Manager' : 'HR Staff'}
${department ? `Department: ${department}` : ''}

Next Steps:
1. Click the link below to verify your email address
2. Create a secure password for your account  
3. Access the ATS system and start managing applications

Setup Link: ${setupLink}

Important: This invitation will expire in 7 days for security reasons.

Welcome to the team!
The Precise Analytics HR Team
        `
      });

      console.log('✅ Invitation email sent successfully:', {
        messageId: emailResult.data?.id,
        email: email
      });

      // Log the invitation in audit table
      const auditQuery = `
        INSERT INTO hr_user_audit (hr_user_id, action, performed_by, performed_by_email, details)
        VALUES ($1, 'invited', $2, $3, $4)
      `;
      
      await client.query(auditQuery, [
        newUser.id,
        authCheck.user.id,
        authCheck.user.email,
        JSON.stringify({
          role,
          department,
          invitation_expires: expiresAt.toISOString()
        })
      ]);

    } catch (emailError: any) {
      console.error('❌ Failed to send invitation email:', emailError);
      
      // Delete the user since email failed
      await client.query('DELETE FROM hr_users WHERE id = $1', [newUser.id]);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send invitation email. Please try again.'
      }, {
        status: 500,
        headers: corsHeaders
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role,
        department
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error creating HR user invitation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create invitation'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}