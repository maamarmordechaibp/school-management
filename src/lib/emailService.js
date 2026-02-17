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
