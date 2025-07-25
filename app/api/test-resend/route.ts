import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY environment variable is not set',
        instructions: [
          '1. Go to https://resend.com/api-keys',
          '2. Create a new API key',
          '3. Add RESEND_API_KEY=your_key_here to your .env.local file',
          '4. Restart your development server'
        ]
      }, { status: 400 });
    }

    // Test sending a simple email
    const { data, error } = await resend.emails.send({
      from: 'ATS System <noreply@preciseanalytics.io>', // Update with your domain
      to: ['careers@preciseanalytics.io'], // Test email
      subject: 'Resend API Key Test - ATS System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #9ACD32, #40E0D0); padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
            <h1 style="color: white; margin: 0; text-align: center;">Precise Analytics ATS</h1>
            <p style="color: white; margin: 0.5rem 0 0 0; text-align: center; opacity: 0.9;">Your Data, Our Insights!</p>
          </div>
          
          <div style="padding: 2rem; background: #f8f9fa; border-radius: 8px;">
            <h2 style="color: #2B4566; margin-top: 0;">✅ Resend API Test Successful!</h2>
            
            <p>Your Resend API key is working correctly. The ATS system can now send emails for:</p>
            
            <ul style="color: #555;">
              <li>Application confirmations to candidates</li>
              <li>Interview scheduling notifications</li>
              <li>Status update emails</li>
              <li>Internal HR notifications</li>
            </ul>
            
            <div style="background: #e8f5e8; padding: 1rem; border-radius: 6px; border-left: 4px solid #9ACD32; margin: 1.5rem 0;">
              <strong style="color: #2d5016;">Test Date:</strong> ${new Date().toLocaleString()}<br>
              <strong style="color: #2d5016;">Environment:</strong> ${process.env.NODE_ENV || 'development'}
            </div>
            
            <p style="color: #666; font-size: 0.9rem; margin-top: 2rem;">
              This is an automated test email from your Precise Analytics ATS system.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: error,
        troubleshooting: [
          '1. Verify your API key is correct',
          '2. Check if your domain is verified in Resend',
          '3. Ensure you have sending permissions',
          '4. Check Resend dashboard for any issues'
        ]
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Resend API key is working! Test email sent successfully.',
      emailId: data?.id,
      sentTo: 'careers@preciseanalytics.io',
      instructions: [
        '✅ Check your inbox for the test email',
        '✅ Your ATS system can now send emails',
        '✅ You can now enable email notifications in your application flow'
      ]
    });

  } catch (error) {
    console.error('Resend test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Resend API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      nextSteps: [
        '1. Check your RESEND_API_KEY in .env.local',
        '2. Verify the API key is valid in Resend dashboard',
        '3. Ensure your development server was restarted after adding the key'
      ]
    }, { status: 500 });
  }
}