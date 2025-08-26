// app/api/hr-users/[id]/resend-invite/route.ts
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

// POST - Resend invitation to HR user
export async function POST(
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

    console.log(`Resending invitation for HR user: ${userId}`);

    // Get user details
    const userQuery = `
      SELECT id, first_name, last_name, email, role, department, 
             email_verified, password_set, invitation_expires_at
      FROM hr_users 
      WHERE id = $1
    `;
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

    // Check if user has already completed setup
    if (user.email_verified && user.password_set) {
      return NextResponse.json({
        success: false,
        error: 'User has already completed account setup'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate new invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with new token
    const updateQuery = `
      UPDATE hr_users 
      SET invitation_token = $1, invitation_expires_at = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await client.query(updateQuery, [invitationToken, expiresAt, userId]);

    // Create setup link
    const setupLink = `${process.env.NODE_ENV === 'production' 
      ? 'https://precise-analytics-ats.vercel.app' 
      : 'http://localhost:3000'}/hr-setup?token=${invitationToken}`;

    console.log(`Sending resend invitation email to: ${user.email}`);

    // Send invitation email
    try {
      const emailResult = await resend.emails.send({
        from: 'Precise Analytics <noreply@resend.dev>',
        to: [user.email],
        subject: 'HR Access Invitation (Resent) - Precise Analytics ATS',
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
              <p style="color: white; margin: 0; font-size: 18px;">HR Team Invitation (Resent)</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi ${user.first_name},</p>
              
              <p>This is a reminder about your invitation to join the Precise Analytics HR team with access to our internal Applicant Tracking System.</p>
              
              <p><strong>Your Role:</strong> ${user.role === 'admin' ? 'Administrator' : user.role === 'hr_manager' ? 'HR Manager' : 'HR Staff'}</p>
              ${user.department ? `<p><strong>Department:</strong> ${user.department}</p>` : ''}
              
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
              
              <p><strong>Important:</strong> This new invitation will expire in 7 days.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px;">
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
Hi ${user.first_name},

This is a reminder about your invitation to join the Precise Analytics HR team with access to our internal Applicant Tracking System.

Your Role: ${user.role === 'admin' ? 'Administrator' : user.role === 'hr_manager' ? 'HR Manager' : 'HR Staff'}
${user.department ? `Department: ${user.department}` : ''}

Next Steps:
1. Click the link below to verify your email address
2. Create a secure password for your account  
3. Access the ATS system and start managing applications

Setup Link: ${setupLink}

Important: This new invitation will expire in 7 days.

The Precise Analytics HR Team
        `
      });

      console.log('Invitation resent successfully:', {
        messageId: emailResult.data?.id,
        email: user.email
      });

      // Log the resend action
      const auditQuery = `
        INSERT INTO hr_user_audit (hr_user_id, action, performed_by, performed_by_email, details)
        VALUES ($1, 'invitation_resent', $2, $3, $4)
      `;
      
      await client.query(auditQuery, [
        userId,
        authCheck.user.id,
        authCheck.user.email,
        JSON.stringify({
          new_expiration: expiresAt.toISOString()
        })
      ]);

    } catch (emailError: any) {
      console.error('Failed to resend invitation email:', emailError);
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
      message: 'Invitation resent successfully'
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to resend invitation'
    }, {
      status: 500,
      headers: corsHeaders
    });
  } finally {
    client.release();
  }
}