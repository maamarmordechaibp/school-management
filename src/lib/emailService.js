/**
 * Email Service - calls the /api/send-email endpoint
 * Works with both Vite dev server (plugin) and Cloudflare Pages Functions (production)
 */

export async function sendEmail({ to, subject, body, from }) {
  // Ensure 'to' is always an array
  const recipients = Array.isArray(to) ? to : [to];
  
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipients,
      subject,
      html: body.replace(/\n/g, '<br>'),
      text: body,
      from: from || 'School Management <onboarding@resend.dev>'
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Failed to send email (${response.status})`);
  }

  return result;
}
