/**
 * Vite plugin that adds a dev server middleware for the /api/send-email endpoint.
 * This calls the Resend API server-side during development.
 */

const RESEND_API_KEY = 're_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A';

export default function resendApiPlugin() {
  return {
    name: 'resend-api',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Parse request body
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        try {
          const { to, subject, html, text, from } = JSON.parse(body);

          if (!to || !subject) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing required fields: to, subject' }));
            return;
          }

          // Call Resend API
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

          res.setHeader('Content-Type', 'application/json');

          if (!resendResponse.ok) {
            console.error('Resend API error:', result);
            res.statusCode = resendResponse.status;
            res.end(JSON.stringify({ error: result.message || 'Failed to send email', details: result }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, id: result.id }));
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
