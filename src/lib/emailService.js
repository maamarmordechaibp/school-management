/**
 * Email Service - calls the /api/send-email backend endpoint.
 * The backend handles: sending via Resend + logging to email_log in Supabase.
 * The frontend only submits the request and shows the result.
 */

export async function sendEmail({ to, subject, body, from, relatedType, relatedId, sentBy }) {
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
      from: from || 'School Management <onboarding@resend.dev>',
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      sentBy: sentBy || null
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Failed to send email (${response.status})`);
  }

  return result;
}
