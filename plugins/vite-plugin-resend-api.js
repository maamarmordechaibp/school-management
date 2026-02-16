/**
 * Vite plugin that adds a dev server middleware for the /api/send-email endpoint.
 * Handles both email sending (Resend) and logging (Supabase) server-side during development.
 */

const RESEND_API_KEY = 're_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A';
const SUPABASE_URL = 'https://rfvgjyfrjawqpdpwicev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmdqeWZyamF3cXBkcHdpY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM5OTUsImV4cCI6MjA4MDg4OTk5NX0.ORKsqnNyfOtU9T9u6YWmo4j1pldMAC_ZakMCRMCiVmo';

export default function resendApiPlugin() {
  return {
    name: 'resend-api',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Parse request body
        let rawBody = '';
        for await (const chunk of req) {
          rawBody += chunk;
        }

        try {
          const { to, subject, html, text, from, relatedType, relatedId, sentBy } = JSON.parse(rawBody);

          if (!to || !subject) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing required fields: to, subject' }));
            return;
          }

          const recipients = Array.isArray(to) ? to : [to];
          const fromAddress = from || 'School Management <onboarding@resend.dev>';
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
              console.error('Resend API error:', resendResult);
            } else {
              resendId = resendResult.id;
            }
          } catch (err) {
            emailStatus = 'failed';
            sendError = err.message;
          }

          // 2. Log to Supabase email_log (server-side)
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/email_log`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
            console.error('Failed to log email:', logErr);
          }

          // 3. Return result
          res.setHeader('Content-Type', 'application/json');

          if (emailStatus === 'failed') {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: sendError || 'Failed to send email' }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, id: resendId }));
        } catch (err) {
          console.error('Email API error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}
