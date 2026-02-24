import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  
  // Check if the from email is from a common personal domain that won't be verified
  // In that case, use Resend's onboarding email for testing
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  const emailDomain = fromEmail?.split('@')[1]?.toLowerCase();
  const safeFromEmail = personalDomains.includes(emailDomain) 
    ? 'EtherAI-Dental <onboarding@resend.dev>' 
    : fromEmail;
  
  return {
    client: new Resend(apiKey),
    fromEmail: safeFromEmail
  };
}

interface InvitationEmailParams {
  toEmail: string;
  practiceName: string;
  role: string;
  invitationLink: string;
  message?: string;
  inviterName?: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { toEmail, practiceName, role, invitationLink, message, inviterName } = params;
    
    const personalMessage = message 
      ? `<p style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; font-style: italic; color: #6b7280;">"${message}"</p>` 
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${practiceName}</strong> has invited you to join their professional network on EtherAI-Dental as a <strong>${role}</strong>.
    </p>
    
    ${personalMessage}
    
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 25px;">
      By accepting this invitation, you'll be able to view and claim shifts posted by this practice.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationLink}" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
        View Invitation
      </a>
    </div>
    
    <p style="font-size: 13px; color: #9ca3af; margin-top: 25px;">
      This invitation will expire in 30 days. If you have any questions, please contact the practice directly.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      This email was sent by EtherAI-Dental on behalf of ${practiceName}.<br>
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `${practiceName} has invited you to join their network on EtherAI-Dental`,
      html: htmlContent,
    });

    console.log('Invitation email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return false;
  }
}

interface DemoRequestEmailParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  practiceName: string;
  practiceSize?: string;
  currentSoftware?: string;
  message?: string;
}

export async function sendDemoRequestNotification(params: DemoRequestEmailParams): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();

    const { firstName, lastName, email, phone, practiceName, practiceSize, currentSoftware, message } = params;

    const practiceSizeLabel: Record<string, string> = {
      solo: "Solo Practice",
      small: "2-5 Providers",
      medium: "6-15 Providers",
      large: "16-50 Providers",
      dso: "DSO / 50+ Providers",
    };

    const detailRows = [
      { label: "Name", value: `${firstName} ${lastName}` },
      { label: "Email", value: email },
      { label: "Phone", value: phone || "Not provided" },
      { label: "Practice", value: practiceName },
      { label: "Practice Size", value: practiceSize ? (practiceSizeLabel[practiceSize] || practiceSize) : "Not specified" },
      { label: "Current Software", value: currentSoftware || "Not specified" },
    ];

    const detailsHtml = detailRows.map(r =>
      `<tr><td style="padding: 8px 12px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; width: 160px;">${r.label}</td><td style="padding: 8px 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${r.value}</td></tr>`
    ).join("");

    const messageBlock = message
      ? `<div style="margin-top: 20px;"><p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message:</p><p style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; color: #6b7280; font-style: italic;">"${message}"</p></div>`
      : "";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Demo Request</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new demo has been requested from the EtherAI-Dental website.
    </p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${detailsHtml}
    </table>
    
    ${messageBlock}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:${email}" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
        Reply to ${firstName}
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      This notification was generated by EtherAI-Dental.
    </p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: fromEmail,
      replyTo: email,
      subject: `New Demo Request: ${practiceName} - ${firstName} ${lastName}`,
      html: htmlContent,
    });

    console.log('Demo request notification email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send demo request notification email:', error);
    return false;
  }
}

interface OtpEmailParams {
  toEmail: string;
  otpCode: string;
  expiryMinutes?: number;
}

export async function sendOtpEmail(params: OtpEmailParams): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { toEmail, otpCode, expiryMinutes = 10 } = params;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Use the following code to verify your email address:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #f3f4f6; padding: 20px 40px; border-radius: 8px; display: inline-block;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d9488;">${otpCode}</span>
      </div>
    </div>
    
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 25px; text-align: center;">
      This code will expire in <strong>${expiryMinutes} minutes</strong>.
    </p>
    
    <p style="font-size: 13px; color: #9ca3af; margin-top: 25px;">
      If you didn't request this code, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      This email was sent by EtherAI-Dental.<br>
      Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Your EtherAI-Dental verification code: ${otpCode}`,
      html: htmlContent,
    });

    console.log('OTP email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}
