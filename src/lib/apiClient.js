/**
 * Helper to call our Cloudflare Pages Functions with the current Supabase
 * session JWT attached as a Bearer token.
 *
 * Usage:
 *   const res = await apiFetch('/api/create-user', { method: 'POST', body: { ... } });
 */
import { supabase } from '@/lib/customSupabaseClient';

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body !== undefined && method !== 'GET') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return fetch(path, init);
}
