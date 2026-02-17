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

const UNSUBSCRIBE_URL = 'https://tyymonsey.com/unsubscribe';

/**
 * Wrap raw HTML content in a proper email document structure
 * with anti-spam best practices (proper DOCTYPE, footer, unsubscribe link, physical address).
 */
function wrapHtmlEmail(subject, innerHtml) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;">
    <tr><td align="center" style="padding:20px 0;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:20px 30px;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:15px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
          <p style="margin:0 0 8px 0;">TYY Monsey &middot; Monsey, NY</p>
          <p style="margin:0;"><a href="${UNSUBSCRIBE_URL}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY;
  const SUPABASE_URL = context.env.SUPABASE_URL || 'https://rfvgjyfrjawqpdpwicev.supabase.co';
  const SUPABASE_SERVICE_KEY = context.env.SUPABASE_SERVICE_KEY || context.env.SUPABASE_ANON_KEY;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const headers = { 'Content-Type': 'application/json' };

  try {
    const { to, subject, html, text, from, replyTo, relatedType, relatedId, sentBy } = await context.request.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), { status: 400, headers });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const fromAddress = from || 'TYY Monsey <send@tyymonsey.com>';
    const replyToAddress = replyTo || 'info@tyymonsey.com';
    const rawHtml = html || (text ? text.replace(/\n/g, '<br>') : '');
    const emailHtml = wrapHtmlEmail(subject, rawHtml);
    const emailText = text || '';

    // 1. Send email via Resend with deliverability headers
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
          reply_to: replyToAddress,
          subject,
          html: emailHtml,
          text: emailText,
          headers: {
            'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
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
