/**
 * Email Service - sends email via Supabase RPC function (pg_net → Resend API).
 * The database function handles: sending via Resend + logging to email_log.
 * Falls back to /api/send-email endpoint if RPC fails.
 */

import { supabase } from '@/lib/customSupabaseClient';

export async function sendEmail({ to, subject, body, from, relatedType, relatedId, sentBy }) {
  // Ensure 'to' is always an array
  const recipients = Array.isArray(to) ? to : [to];
  const htmlBody = body.replace(/\n/g, '<br>');

  // Primary method: Supabase RPC (pg_net → Resend API)
  try {
    const { data, error } = await supabase.rpc('send_email', {
      p_to: recipients,
      p_subject: subject,
      p_html: htmlBody,
      p_text: body,
      p_from: from || 'School Management <onboarding@resend.dev>',
      p_related_type: relatedType || null,
      p_related_id: relatedId || null,
      p_sent_by: sentBy || null
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.error || 'Email function returned failure');
    }

    return data || { success: true };
  } catch (rpcError) {
    console.warn('RPC send_email failed, trying /api/send-email fallback:', rpcError.message);

    // Fallback: /api/send-email endpoint (Cloudflare Pages Function or Vite dev plugin)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          html: htmlBody,
          text: body,
          from: from || 'School Management <onboarding@resend.dev>',
          relatedType: relatedType || null,
          relatedId: relatedId || null,
          sentBy: sentBy || null
        })
      });

      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Email API returned non-JSON response (${response.status})`);
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to send email (${response.status})`);
      }
      return result;
    } catch (fallbackError) {
      // If both methods fail, throw the original RPC error (more useful)
      console.error('Both email methods failed:', fallbackError.message);
      throw new Error(rpcError.message || fallbackError.message);
    }
  }
}
