/**
 * Email Service
 * 
 * Supports multiple providers via env config:
 * - Resend (recommended)
 * - SendGrid
 * - Console (dev mode - logs to console)
 * 
 * Set EMAIL_PROVIDER and corresponding API key in env.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InviteEmailData {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

// Get base URL for invite links
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// Email templates
export function generateInviteEmail(data: InviteEmailData): { subject: string; html: string; text: string } {
  const subject = `You're invited to join ${data.organizationName} on Booth`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📊 Booth</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0; color: #111;">You've been invited!</h2>
    
    <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as an <strong>${data.role}</strong>.</p>
    
    <p>With Booth, you can:</p>
    <ul style="color: #666;">
      <li>Track trade show schedules and budgets</li>
      <li>Manage attendees and logistics</li>
      <li>Analyze ROI and performance</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      This invitation expires on ${new Date(data.expiresAt).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
You've been invited to join ${data.organizationName}!

${data.inviterName} has invited you to join as an ${data.role}.

Accept your invitation here:
${data.inviteUrl}

This invitation expires on ${new Date(data.expiresAt).toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
  
  return { subject, html, text };
}

// Provider implementations
async function sendViaResend(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Booth <noreply@yourdomain.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
}

async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: process.env.EMAIL_FROM || 'noreply@yourdomain.com' },
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text || '' },
        { type: 'text/html', value: options.html },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }
}

function sendViaConsole(options: EmailOptions): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 EMAIL (dev mode - not actually sent)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(options.text || '(HTML only)');
  console.log('═══════════════════════════════════════════════════════════');
}

// Main send function
export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'console';
  
  switch (provider) {
    case 'resend':
      return sendViaResend(options);
    case 'sendgrid':
      return sendViaSendGrid(options);
    case 'console':
    default:
      return sendViaConsole(options);
  }
}

// Welcome email template
export function generateWelcomeEmail(data: { name: string; orgName: string; loginUrl: string }): { subject: string; html: string; text: string } {
  const subject = `Welcome to Booth!`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📊 Welcome to Booth!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0; color: #111;">Hey ${data.name}! 👋</h2>
    
    <p>You're all set up with <strong>${data.orgName}</strong>. Here's what you can do now:</p>
    
    <ul style="color: #666;">
      <li><strong>Add your first trade show</strong> — Get all the details in one place</li>
      <li><strong>Track your budget</strong> — Know exactly what each show costs</li>
      <li><strong>Invite your team</strong> — Collaborate without the spreadsheet chaos</li>
      <li><strong>Measure ROI</strong> — Finally know which shows are worth it</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Go to Booth
      </a>
    </div>
    
    <p style="color: #666;">
      Questions? Just reply to this email — we're here to help.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      You're receiving this because you signed up for Booth.
    </p>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
Welcome to Booth, ${data.name}!

You're all set up with ${data.orgName}. Here's what you can do now:

- Add your first trade show — Get all the details in one place
- Track your budget — Know exactly what each show costs
- Invite your team — Collaborate without the spreadsheet chaos
- Measure ROI — Finally know which shows are worth it

Go to Booth: ${data.loginUrl}

Questions? Just reply to this email — we're here to help.
  `.trim();
  
  return { subject, html, text };
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string, orgName: string): Promise<void> {
  const loginUrl = `${getBaseUrl()}/`;
  const { subject, html, text } = generateWelcomeEmail({ name, orgName, loginUrl });
  await sendEmail({ to: email, subject, html, text });
}

// High-level: Send invitation email
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  role: string,
  token: string,
  expiresAt: string
): Promise<void> {
  const inviteUrl = `${getBaseUrl()}/invite?token=${token}`;
  
  const { subject, html, text } = generateInviteEmail({
    inviterName,
    organizationName,
    role,
    inviteUrl,
    expiresAt,
  });
  
  await sendEmail({ to: email, subject, html, text });
}
