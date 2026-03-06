import sgMail from '@sendgrid/mail';
import type { Workspace } from '@/types/database';

// Initialize SendGrid with default API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface SendEmailParams {
  workspace: Workspace;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { workspace, to, subject, text, html, replyTo } = params;

  // Use workspace-specific SendGrid if configured
  if (workspace.sendgrid_api_key) {
    sgMail.setApiKey(workspace.sendgrid_api_key);
  }

  const fromEmail = workspace.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL!;
  const fromName = workspace.name || process.env.SENDGRID_FROM_NAME || 'Vault AI';

  try {
    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text: text || '',
      html: html || text || '',
      replyTo: replyTo || fromEmail,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    };

    const [response] = await sgMail.send(msg);

    console.log(`Email sent to ${to}: ${response.statusCode}`);

    return {
      success: response.statusCode >= 200 && response.statusCode < 300,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

export async function sendWelcomeEmail(
  workspace: Workspace,
  lead: { name: string; email: string }
): Promise<SendEmailResult> {
  const subject = `Welcome! ${workspace.name} - We're excited to connect`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome, ${lead.name}!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for reaching out to <strong>${workspace.name}</strong>! We received your inquiry and are excited to help you.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${workspace.ai_offer_details || 'We specialize in helping businesses like yours succeed. Our team is ready to discuss how we can best serve your needs.'}
    </p>

    ${workspace.booking_link ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${workspace.booking_link}" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Schedule a Call
      </a>
    </div>
    ` : ''}

    <p style="font-size: 16px; color: #666;">
      We'll be in touch shortly. In the meantime, feel free to reply to this email with any questions!
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #888; margin: 0;">
      Best regards,<br>
      <strong>The ${workspace.name} Team</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Powered by Vault AI</p>
  </div>
</body>
</html>
`;

  const text = `
Welcome, ${lead.name}!

Thank you for reaching out to ${workspace.name}! We received your inquiry and are excited to help you.

${workspace.ai_offer_details || 'We specialize in helping businesses like yours succeed. Our team is ready to discuss how we can best serve your needs.'}

${workspace.booking_link ? `Ready to chat? Schedule a call here: ${workspace.booking_link}` : ''}

We'll be in touch shortly. In the meantime, feel free to reply to this email with any questions!

Best regards,
The ${workspace.name} Team
`;

  return sendEmail({
    workspace,
    to: lead.email,
    subject,
    text,
    html,
  });
}

export async function sendBookingConfirmation(
  workspace: Workspace,
  lead: { name: string; email: string },
  appointmentDetails: { date: string; time: string; meetingLink?: string }
): Promise<SendEmailResult> {
  const subject = `Confirmed: Your appointment with ${workspace.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${lead.name}, your appointment is all set!
    </p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${appointmentDetails.date}</p>
      <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${appointmentDetails.time}</p>
      ${appointmentDetails.meetingLink ? `<p style="margin: 0;"><strong>Meeting Link:</strong> <a href="${appointmentDetails.meetingLink}">${appointmentDetails.meetingLink}</a></p>` : ''}
    </div>

    <p style="font-size: 14px; color: #666;">
      We're looking forward to speaking with you!
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({
    workspace,
    to: lead.email,
    subject,
    html,
    text: `Your appointment with ${workspace.name} is confirmed!\n\nDate: ${appointmentDetails.date}\nTime: ${appointmentDetails.time}\n${appointmentDetails.meetingLink ? `Meeting Link: ${appointmentDetails.meetingLink}` : ''}`,
  });
}
