/**
 * Voice-call service. POSTs to /api/send-call (Cloudflare Pages Function),
 * which then dials via SignalWire. The frontend NEVER touches the API token.
 */
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Place one outbound call.
 * @param {object} args
 * @param {string|string[]} args.to    E.164 (or US 10/11-digit; server normalizes)
 * @param {string} args.message        text-to-speech script
 * @param {string} [args.voice]        e.g. 'Polly.Joanna', 'Polly.Carmen'
 * @param {string} [args.language]     e.g. 'en-US', 'he-IL'
 * @param {string} [args.relatedType]
 * @param {string} [args.relatedId]
 * @param {string} [args.sentBy]
 */
export async function sendCall(args) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const resp = await fetch('/api/send-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `Call failed (HTTP ${resp.status})`);
  }
  return data;
}
