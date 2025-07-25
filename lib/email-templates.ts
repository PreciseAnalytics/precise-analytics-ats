// lib/email-templates.ts
// Email templates for your ATS system

export interface ApplicationEmailData {
  candidateName: string;
  position: string;
  applicationId: string;
  submissionDate: string;
}

export interface InterviewEmailData {
  candidateName: string;
  position: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string; // 'phone', 'video', 'in-person'
  location?: string;
  meetingLink?: string;
}

export const applicationConfirmationTemplate = (data: ApplicationEmailData) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #9ACD32, #40E0D0); padding: 3rem 2rem; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 2.5rem; font-weight: 700; letter-spacing: 1px;">PRECISE ANALYTICS</h1>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9; font-weight: 600; letter-spacing: 0.5px;">YOUR DATA, OUR INSIGHTS!</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 3rem 2rem; background: #f8f9fa;">
    <h2 style="color: #2B4566; margin: 0 0 1.5rem 0; font-size: 1.8rem;">Thank you for your application! 🎉</h2>
    
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
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Position:</td>
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
    </div>
    
    <p style="color: #333; line-height: 1.6; margin: 2rem 0 1rem 0;">
      If you have any questions about your application or our hiring process, feel free to reply to this email or contact us at 
      <a href="mailto:careers@preciseanalytics.io" style="color: #9ACD32; text-decoration: none;">careers@preciseanalytics.io</a>.
    </p>
    
    <p style="color: #333; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>The Precise Analytics Hiring Team</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background: #2B4566; padding: 2rem; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: white; margin: 0; font-size: 0.9rem; opacity: 0.8;">
      Precise Analytics | Richmond, VA | Veteran-Owned • SDVOSB • Minority-Owned
    </p>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.6;">
      Visit us at <a href="https://preciseanalytics.io" style="color: #9ACD32; text-decoration: none;">preciseanalytics.io</a>
    </p>
  </div>
</div>
`;

export const interviewInviteTemplate = (data: InterviewEmailData) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #9ACD32, #40E0D0); padding: 3rem 2rem; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 2.5rem; font-weight: 700; letter-spacing: 1px;">PRECISE ANALYTICS</h1>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9; font-weight: 600; letter-spacing: 0.5px;">YOUR DATA, OUR INSIGHTS!</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 3rem 2rem; background: #f8f9fa;">
    <h2 style="color: #2B4566; margin: 0 0 1.5rem 0; font-size: 1.8rem;">Interview Invitation! 🎯</h2>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 1.5rem;">
      Hi <strong>${data.candidateName}</strong>,
    </p>
    
    <p style="color: #333; line-height: 1.6; margin-bottom: 1.5rem;">
      Great news! We were impressed with your application for the <strong>${data.position}</strong> position 
      and would like to invite you for an interview with our team.
    </p>
    
    <!-- Interview Details -->
    <div style="background: #ffffff; padding: 2rem; border-radius: 8px; border-left: 4px solid #FF7F00; margin: 2rem 0;">
      <h3 style="color: #2B4566; margin: 0 0 1rem 0; font-size: 1.3rem;">Interview Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Position:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.position}</td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Date:</td>
          <td style="padding: 0.5rem 0; color: #333; font-weight: 600;">${data.interviewDate}</td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Time:</td>
          <td style="padding: 0.5rem 0; color: #333; font-weight: 600;">${data.interviewTime}</td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Format:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.interviewType}</td>
        </tr>
        ${data.location ? `
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Location:</td>
          <td style="padding: 0.5rem 0; color: #333;">${data.location}</td>
        </tr>
        ` : ''}
        ${data.meetingLink ? `
        <tr>
          <td style="padding: 0.5rem 0; color: #666; font-weight: 600;">Meeting Link:</td>
          <td style="padding: 0.5rem 0;"><a href="${data.meetingLink}" style="color: #9ACD32; text-decoration: none; font-weight: 600;">Join Interview</a></td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <!-- Preparation Tips -->
    <div style="background: rgba(255, 127, 0, 0.1); padding: 2rem; border-radius: 8px; margin: 2rem 0;">
      <h3 style="color: #2B4566; margin: 0 0 1rem 0; font-size: 1.3rem;">How to prepare:</h3>
      <ul style="color: #333; line-height: 1.8; margin: 0; padding-left: 1.5rem;">
        <li>Review your application and be ready to discuss your experience</li>
        <li>Research our company and recent projects at <a href="https://preciseanalytics.io" style="color: #FF7F00;">preciseanalytics.io</a></li>
        <li>Prepare questions about the role and our team</li>
        <li>Test your audio/video setup if this is a virtual interview</li>
        <li>Have examples ready of your data analytics or relevant technical work</li>
      </ul>
    </div>
    
    <p style="color: #333; line-height: 1.6; margin: 2rem 0 1rem 0;">
      Please confirm your attendance by replying to this email. If you need to reschedule, let us know as soon as possible at 
      <a href="mailto:careers@preciseanalytics.io" style="color: #9ACD32; text-decoration: none;">careers@preciseanalytics.io</a>.
    </p>
    
    <p style="color: #333; line-height: 1.6; margin: 0;">
      We're looking forward to speaking with you!<br>
      <strong>The Precise Analytics Hiring Team</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background: #2B4566; padding: 2rem; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: white; margin: 0; font-size: 0.9rem; opacity: 0.8;">
      Precise Analytics | Richmond, VA | Veteran-Owned • SDVOSB • Minority-Owned
    </p>
    <p style="color: white; margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.6;">
      Visit us at <a href="https://preciseanalytics.io" style="color: #9ACD32; text-decoration: none;">preciseanalytics.io</a>
    </p>
  </div>
</div>
`;

// Internal HR notification template
export const hrNotificationTemplate = (data: ApplicationEmailData) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2B4566; padding: 2rem; color: white; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 1.5rem;">🔔 New Application Received</h1>
    <p style="margin: 0.5rem 0 0 0; opacity: 0.8;">Precise Analytics ATS System</p>
  </div>
  
  <div style="padding: 2rem; background: #f8f9fa; border-radius: 0 0 8px 8px;">
    <h2 style="color: #2B4566; margin: 0 0 1rem 0;">Application Details</h2>
    
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Candidate:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;">${data.candidateName}</td>
      </tr>
      <tr>
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Position:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6;">${data.position}</td>
      </tr>
      <tr style="background: #e9ecef;">
        <td style="padding: 1rem; font-weight: 600; border-bottom: 1px solid #dee2e6;">Application ID:</td>
        <td style="padding: 1rem; border-bottom: 1px solid #dee2e6; font-family: monospace;">${data.applicationId}</td>
      </tr>
      <tr>
        <td style="padding: 1rem; font-weight: 600;">Submitted:</td>
        <td style="padding: 1rem;">${data.submissionDate}</td>
      </tr>
    </table>
    
    <div style="margin: 2rem 0; padding: 1rem; background: rgba(154, 205, 50, 0.1); border-left: 4px solid #9ACD32; border-radius: 4px;">
      <p style="margin: 0; color: #2d5016;">
        <strong>Action Required:</strong> Please review this application in the ATS dashboard and update the candidate's status.
      </p>
    </div>
    
    <p style="margin: 1rem 0 0 0; text-align: center;">
      <a href="http://localhost:3000/dashboard" style="background: linear-gradient(135deg, #9ACD32, #40E0D0); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        View in ATS Dashboard
      </a>
    </p>
  </div>
</div>
`;