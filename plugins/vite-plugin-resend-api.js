/**
 * Vite plugin that adds dev server middleware for backend API endpoints.
 * Handles email sending (Resend), logging (Supabase), and user creation during development.
 */

const RESEND_API_KEY = 're_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A';
const SUPABASE_URL = 'https://rfvgjyfrjawqpdpwicev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmdqeWZyamF3cXBkcHdpY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM5OTUsImV4cCI6MjA4MDg4OTk5NX0.ORKsqnNyfOtU9T9u6YWmo4j1pldMAC_ZakMCRMCiVmo';
// For dev, set SUPABASE_SERVICE_KEY env var, or it falls back to anon key (limited)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

async function parseBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body);
}

export default function resendApiPlugin() {
  return {
    name: 'backend-api',
    configureServer(server) {

      // ============================
      // POST /api/create-user
      // ============================
      server.middlewares.use('/api/create-user', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { email, password, name, role, first_name, last_name, assigned_class } = await parseBody(req);

          if (!email || !password) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Email and password are required' }));
            return;
          }

          // 1. Create auth user via Supabase Admin API
          const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: { name: name || email }
            })
          });

          const authResult = await authResponse.json();

          if (!authResponse.ok) {
            console.error('Auth create error:', authResult);
            res.statusCode = authResponse.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: authResult.msg || authResult.message || 'Failed to create auth user' }));
            return;
          }

          const userId = authResult.id;

          // 2. Insert into app_users table
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                id: userId,
                email,
                name: name || `${first_name || ''} ${last_name || ''}`.trim() || email,
                first_name: first_name || name?.split(' ')[0] || '',
                last_name: last_name || name?.split(' ').slice(1).join(' ') || '',
                role: role || 'teacher',
                assigned_class: assigned_class || null
              })
            });
          } catch (profileErr) {
            console.error('Failed to create app_users profile:', profileErr);
          }

          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, userId }));
        } catch (err) {
          console.error('Create user error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // ============================
      // POST /api/update-user-role
      // ============================
      server.middlewares.use('/api/update-user-role', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { userId, role, assigned_class } = await parseBody(req);

          if (!userId || !role) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'userId and role are required' }));
            return;
          }

          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              role,
              assigned_class: assigned_class || null
            })
          });

          if (!updateResponse.ok) {
            const errText = await updateResponse.text();
            res.statusCode = updateResponse.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errText || 'Failed to update role' }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.error('Update role error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // ============================
      // POST /api/send-email
      // ============================
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
