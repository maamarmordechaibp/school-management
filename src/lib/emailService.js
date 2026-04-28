/**
 * Email Service - sends email via Supabase RPC function (http extension → Resend API).
 * The database function handles: sending via Resend + logging to email_log.
 * Returns actual Resend API response (synchronous, not fire-and-forget).
 */

import { supabase } from '@/lib/customSupabaseClient';

export async function sendEmail({ to, subject, body, from, replyTo, relatedType, relatedId, sentBy }) {
  // Ensure 'to' is always an array
  const recipients = Array.isArray(to) ? to : [to];
  const htmlBody = body.replace(/\n/g, '<br>');

  // Send via Supabase RPC → http extension → Resend API
  const { data, error } = await supabase.rpc('send_email', {
    p_to: recipients,
    p_subject: subject,
    p_html: htmlBody,
    p_text: body,
    p_from: from || 'TYY Monsey <send@tyymonsey.com>',
    p_reply_to: replyTo || 'info@tyymonsey.com',
    p_related_type: relatedType || null,
    p_related_id: relatedId || null,
    p_sent_by: sentBy || null
  });

  if (error) {
    console.error('send_email RPC error:', error);
    throw new Error(error.message || 'Failed to call send_email function');
  }

  if (data && data.success === false) {
    console.error('Resend API error:', data);
    throw new Error(data.error || `Email failed (HTTP ${data.status})`);
  }

  console.log('Email sent successfully:', data);
  return data || { success: true };
}

/**
 * Render an email template by substituting {{variable}} placeholders.
 * Returns { subject, body_html, missing }.
 *
 * - `template` is a row from the `email_templates` table.
 * - `vars` is a flat object of values, e.g. { student_name: 'משה', count: 3 }.
 * - Missing variables are reported in `missing` and shown literally in the
 *   output (so the AP can spot them in preview).
 */
export function renderTemplate(template, vars = {}) {
  if (!template) return { subject: '', body_html: '', missing: [] };
  const missing = new Set();

  const replace = (str) => {
    if (!str) return '';
    return String(str).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const value = vars[key];
      if (value === undefined || value === null || value === '') {
        missing.add(key);
        return `{{${key}}}`;
      }
      return String(value);
    });
  };

  return {
    subject: replace(template.subject || ''),
    body_html: replace(template.body_html || ''),
    missing: Array.from(missing),
  };
}

/**
 * Load a template from the database by its `key` (e.g. 'late_letter').
 * Returns null if not found. Caller decides what to do (often: fall back to
 * the hard-coded version in `letterTemplates.js`).
 */
export async function loadTemplate(key) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error('loadTemplate error:', error);
    return null;
  }
  return data;
}
