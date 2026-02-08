/**
 * Cloudflare Pages Function - /api/send-email
 * Handles email sending via Resend API in production.
 * 
 * Set RESEND_API_KEY in Cloudflare Pages environment variables.
 */

export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY || 're_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A';

  try {
    const { to, subject, html, text, from } = await context.request.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from || 'School Management <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || text || '',
        text: text || ''
      })
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: result.message || 'Failed to send email', details: result }), {
        status: resendResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
