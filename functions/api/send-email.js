/**
 * Cloudflare Pages Function - /api/send-email
 * Handles email sending via Resend API AND logging to Supabase email_log.
 * All email logic runs server-side — frontend only submits the request.
 *
 * Environment variables (set in Cloudflare Pages):
 *   RESEND_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY  (service role key for DB writes)
 */

export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY || 're_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A';
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY || context.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmdqeWZyamF3cXBkcHdpY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM5OTUsImV4cCI6MjA4MDg4OTk5NX0.ORKsqnNyfOtU9T9u6YWmo4j1pldMAC_ZakMCRMCiVmo';

  const headers = { 'Content-Type': 'application/json' };

  try {
    const { to, subject, html, text, from, relatedType, relatedId, sentBy } = await context.request.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), { status: 400, headers });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const fromAddress = from || 'tyy <send@tyymonsey.com>';
    const emailHtml = html || (text ? text.replace(/\n/g, '<br>') : '');
    const emailText = text || '';

    // 1. Send email via Resend
    let emailStatus = 'sent';
    let resendId = null;
    let sendError = null;

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          subject,
          html: emailHtml,
          text: emailText
        })
      });

      const resendResult = await resendResponse.json();

      if (!resendResponse.ok) {
        emailStatus = 'failed';
        sendError = resendResult.message || 'Resend API error';
      } else {
        resendId = resendResult.id;
      }
    } catch (err) {
      emailStatus = 'failed';
      sendError = err.message;
    }

    // 2. Log to Supabase email_log (server-side, using service role key)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/email_log`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          recipients,
          subject,
          body: emailText || emailHtml,
          related_type: relatedType || null,
          related_id: relatedId || null,
          sent_by: sentBy || null,
          status: emailStatus
        })
      });
    } catch (logErr) {
      // Don't fail the request if logging fails
      console.error('Failed to log email:', logErr);
    }

    // 3. Return result
    if (emailStatus === 'failed') {
      return new Response(JSON.stringify({ error: sendError || 'Failed to send email' }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ success: true, id: resendId }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
