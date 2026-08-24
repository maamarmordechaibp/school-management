/**
 * Cloudflare Pages Function — /api/voice/transcription-webhook  (PUBLIC webhook)
 *
 * Yiddish Labs POSTs here when a call transcription completes. We store the
 * transcript on the matching `call_conversations` row, then run the AI
 * (OpenAI-compatible) to produce a short summary + suggested action items.
 * Staff apply the suggestions with one click in the app.
 *
 * Query: ?cc=<call_conversation_id>&token=<CALL_WEBHOOK_SECRET>
 * Body (JSON): { event, data: { id, text, summary, keywords, ... } }
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, CALL_WEBHOOK_SECRET,
 *      AI_API_KEY, AI_BASE_URL (opt), AI_MODEL (opt).
 */
import { sbSelect, sbUpdate } from '../../_lib/voice-helpers.js';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT =
  'You analyze a transcript of a phone call between a Jewish school (staff/principal) and a ' +
  'caller (usually a parent). The transcript may be in Yiddish, Hebrew or English. ' +
  'Respond with ONLY a valid JSON object (no markdown, no code fences) with this exact shape: ' +
  '{"summary": string, "key_points": string[], "sentiment": "positive"|"neutral"|"negative", ' +
  '"follow_up_needed": boolean, "action_items": [{"title": string, "description": string, ' +
  '"due_date": string|null, "priority": "low"|"normal"|"high"|"urgent"}], ' +
  '"dialogue": [{"speaker": "staff"|"caller", "text": string}]}. ' +
  'Write "summary", "key_points", action-item text, and dialogue text in the SAME language as the ' +
  'conversation. For "dialogue", reconstruct the call as an ordered list of turns — "speaker" is ' +
  '"staff" for the school employee/principal and "caller" for the person who phoned in; split the ' +
  'transcript into natural back-and-forth turns and keep each turn verbatim. ' +
  'Keep each action-item "title" short (a task line a staff member can act on). Use "due_date" as ' +
  'YYYY-MM-DD only when the caller clearly implies a date, otherwise null. If there is nothing to ' +
  'act on, return an empty "action_items" array. Base everything strictly on the transcript; never invent facts.';

async function analyze(env, transcript, callerName) {
  const AI_API_KEY = env.AI_API_KEY;
  if (!AI_API_KEY || !transcript) return null;
  const AI_BASE_URL = (env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const AI_MODEL = env.AI_MODEL || 'gpt-4o';

  const who = callerName ? `The caller is ${callerName}.\n\n` : '';
  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${who}Transcript:\n\n${transcript}` },
      ],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`AI HTTP ${resp.status}: ${detail.slice(0, 200)}`);
  }
  const data = await resp.json();
  let content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) return null;
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(content);
}

export async function onRequestPost(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const ccId = url.searchParams.get('cc');
  const token = url.searchParams.get('token') || '';

  const secret = env.CALL_WEBHOOK_SECRET || '';
  if (secret && token !== secret) return json(401, { error: 'unauthorized' });
  if (!ccId) return json(400, { error: 'missing cc' });

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const data = body?.data || body || {};
  const transcript = data.text || '';

  // Guard: only accept the transcript for the job we submitted.
  const rows = await sbSelect(env, `call_conversations?id=eq.${ccId}&limit=1`);
  const conv = rows && rows[0];
  if (!conv) return json(404, { error: 'conversation not found' });
  if (conv.yl_job_id && data.id && conv.yl_job_id !== data.id) {
    return json(409, { error: 'job mismatch' });
  }

  await sbUpdate(env, 'call_conversations', `id=eq.${ccId}`, {
    transcript: transcript || null,
    transcript_summary: data.summary || null,
    keywords: Array.isArray(data.keywords) && data.keywords.length ? data.keywords : null,
    status: 'transcribed',
  });

  // Run AI analysis (best-effort — a failure leaves the transcript intact).
  try {
    const result = await analyze(env, transcript, conv.matched_name);
    if (result) {
      await sbUpdate(env, 'call_conversations', `id=eq.${ccId}`, {
        ai_summary: result.summary || null,
        ai_action_items: Array.isArray(result.action_items) ? result.action_items : [],
        ai_dialogue: Array.isArray(result.dialogue) ? result.dialogue : null,
        sentiment: result.sentiment || null,
        status: 'analyzed',
      });
    }
  } catch (e) {
    console.error('call analysis failed', e);
    await sbUpdate(env, 'call_conversations', `id=eq.${ccId}`, {
      error: String(e.message || e).slice(0, 300),
    });
  }

  return json(200, { ok: true });
}
