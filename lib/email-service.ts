// lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ApplicationEmailData {
  candidateName: string;
  candidateEmail: string;
  position: string;
  applicationId: string;
  submissionDate: string;
  phone?: string;
  location?: string;
  experience?: string;
}

export class EmailService {
  
  /**
   * Send application confirmation email to candidate
   */
  static async sendApplicationConfirmation(data: ApplicationEmailData) {
    try {
      const { data: emailData, error } = await resend.emails.send({
        from: 'Precise Analytics <noreply@preciseanalytics.io>',
        to: [data.candidateEmail],
        subject: `Application Received - ${data.position} Position`,
        html: this.applicationConfirmationTemplate(data)
      });

      if (error) {
        console.error('Failed to send confirmation email:', error);
        return { success: false, error };
      }

      console.log('âœ… Confirmation email sent to:', data.candidateEmail);
      return { success: true, emailId: emailData?.id };

    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }

  /**
   * Send HR notification about new application
   */
  static async sendHRNotification(data: ApplicationEmailData) {
    try {
      const { data: emailData, error } = await resend.emails.send({
        from: 'ATS System <noreply@preciseanalytics.io>',
        to: ['careers@preciseanalytics.io'], // Add other HR emails as needed
        subject: `ðŸ”” New Application: ${data.position} - ${data.candidateName}`,
        html: this.hrNotificationTemplate(data)
      });

      if (error) {
        console.error('Failed to send HR notification:', error);
        return { success: false, error };
      }

      console.log('âœ… HR notification sent for application:', data.applicationId);
      return { success: true, emailId: emailData?.id };

    } catch (error) {
      console.error('HR notification error:', error);
      return { success: false, error };
    }
  }

  /**
   * Send both confirmation and HR notification
   */
  static async sendApplicationEmails(data: ApplicationEmailData) {
    const results = await Promise.allSettled([
      this.sendApplicationConfirmation(data),
      this.sendHRNotification(data)
    ]);

    return {
      confirmationSent: results[0].status === 'fulfilled' && results[0].value.success,
      hrNotificationSent: results[1].status === 'fulfilled' && results[1].value.success,
      results
    };
  }

  /**
   * Application confirmation email template
   */
  private static applicationConfirmationTemplate(data: ApplicationEmailData): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #9ACD32, #40E0D0); padding: 3rem 2rem; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 2.5rem; font-weight: 700; letter-spacing: 1px;">PRECISE ANALYTICS</h1>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9; font-weight: 600; letter-spacing: 0.5px;">YOUR DATA, OUR INSIGHTS!</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 3rem 2rem; background: #f8f9fa;">
    <h2 style="color: #2B4566; margin: 0 0 1.5rem 0; font-size: 1.8rem;">Thank you for your application! ðŸŽ‰</h2>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 1.5rem;">
      Hi <strong>${data.candidateName}</strong>,
    </p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 1.5rem;">
      We've successfully received your application for the <strong>${data.position}</strong> position at Precise Analytics. 
      Thank you for your interest in joining our veteran-owned data analytics team!
    </p>
    
    <!-- Application Details -->
    <div style="background: #ffffff; padding: 2rem; border-radius: 8px; border-left: 4px solid #9ACD32; margin: 2rem 0;">
      <h3 style="color: #2B4566; margin: 0 0 1rem 0; font-size: 1.3rem;">Application Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600; width: 30%;">Position:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.position}</td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Application ID:</td>
          <td style="padding: 0.5rem 0; color: #333; font-family: monospace;">${data.applicationId}</td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Submitted:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.submissionDate}</td>
        </tr>
        ${data.location ? `
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Location:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.location}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <!-- What's Next -->
    <div style="background: rgba(154, 205, 50, 0.1); padding: 2rem; border-radius: 8px; margin: 2rem 0;">
      <h3 style="color: #2B4566; margin: 0 0 1rem 0; font-size: 1.3rem;">What happens next?</h3>
      <ul style="color: #333; line-height: 1.8; margin: 0; padding-left: 1.5rem;">
        <li>Our HR team will review your application within <strong>2-3 business days</strong></li>
        <li>If your background matches our needs, we'll reach out to schedule an initial conversation</li>
        <li>You may receive a brief technical assessment depending on the role</li>
        <li>We'll keep you updated throughout the entire process</li>
      </ul>
    </div>
    
    <!-- Company Info -->
    <div style="background: #ffffff; padding: 2rem; border-radius: 8px; margin: 2rem 0;">
      <h3 style="color: #2B4566; margin: 0 0 1rem 0; font-size: 1.3rem;">About Precise Analytics</h3>
      <p style="color: #555; line-height: 1.6; margin: 0;">
        We're a veteran-owned data analytics company specializing in comprehensive solutions for government and commercial clients. 
        As an SDVOSB and minority-owned business, we're committed to turning complex data into actionable insights that drive 
        informed decision-making across all technology domains.
      </p>
      <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span style="background: rgba(154, 205, 50, 0.2); color: #2d5016; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">VOSB</span>
        <span style="background: rgba(255, 127, 0, 0.2); color: #b45309; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">SDVOSB</span>
        <span style="background: rgba(64, 224, 208, 0.2); color: #0f766e; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">Minority-Owned</span>
      </div>
    </div>
    
    <p style="color: #333; line-height: 1.6; margin: 2rem 0 1rem 0;">
      If you have any questions about your application or our hiring process, feel free to reply to this email or contact us at 
      <a href="mailto:careers@preciseanalytics.io" style="color: #9ACD32; text-decoration: none; font-weight: 600;">careers@preciseanalytics.io</a>.
    </p>
    
    <p style="color: #333; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>The Precise Analytics Hiring Team</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background: #2B4566; padding: 2rem; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: white; margin: 0; font-size: 0.9rem; opacity: 0.8;">
      Precise Analytics | Richmond, VA | Veteran-Owned â€¢ SDVOSB â€¢ Minority-Owned
    </p>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.6;">
      Visit us at <a href="https://preciseanalytics.io" style="color: #9ACD32; text-decoration: none;">preciseanalytics.io</a>
    </p>
  </div>
</div>
    `;
  }

  /**
   * HR notification email template
   */
  private static hrNotificationTemplate(data: ApplicationEmailData): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2B4566; padding: 2rem; color: white; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 1.5rem;">ðŸ”” New Application Received</h1>
    <p style="margin: 0.5rem 0 0 0; opacity: 0.8;">Precise Analytics ATS System</p>
  </div>
  
  <div style="padding: 2rem; background: #f8f9fa; border-radius: 0 0 8px 8px;">
    <h2 style="color: #2B4566; margin: 0 0 1rem 0;">Application Details</h2>
    
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6; width: 30%;">Candidate:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;"><strong>${data.candidateName}</strong></td>
      </tr>
      <tr>
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Email:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;"><a href="mailto:${data.candidateEmail}" style="color: #9ACD32; text-decoration: none;">${data.candidateEmail}</a></td>
      </tr>
      ${data.phone ? `
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Phone:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;">${data.phone}</td>
      </tr>
      ` : ''}
      <tr ${!data.phone ? 'style="background: #e9ecef;"' : ''}>
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Position:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;"><strong>${data.position}</strong></td>
      </tr>
      ${data.location ? `
      <tr>
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Location:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;">${data.location}</td>
      </tr>
      ` : ''}
      ${data.experience ? `
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Experience:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;">${data.experience}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Application ID:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6; font-family: monospace; color: #666;">${data.applicationId}</td>
      </tr>
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600;">Submitted:</td>
        <td style="padding: 1rem;"><strong>${data.submissionDate}</strong></td>
      </tr>
    </table>
    
    <div style="margin: 2rem 0; padding: 1.5rem; background: rgba(154, 205, 50, 0.1); border-left: 4px solid #9ACD32; border-radius: 4px;">
      <p style="margin: 0; color: #2d5016;">
        <strong>ðŸŽ¯ Action Required:</strong> Please review this application in the ATS dashboard and update the candidate's status.
      </p>
    </div>
    
    <div style="text-align: center; margin: 2rem 0;">
      <a href="http://localhost:3000/" style="background: linear-gradient(135deg, #9ACD32, #40E0D0); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(154, 205, 50, 0.3);">
        ðŸ“‹ View in ATS Dashboard
      </a>
    </div>
    
    <div style="border-top: 1px solid #dee2e6; padding-top: 1rem; margin-top: 2rem; text-align: center; color: #666; font-size: 0.9rem;">
      <p style="margin: 0;">Automated notification from Precise Analytics ATS</p>
    </div>
  </div>
</div>
    `;
  }
}

