-- =====================================================
-- 070 — Voicemails in the transcription/AI pipeline
--
-- Voicemails now flow through the same record → transcribe
-- (Yiddish Labs) → AI-notes pipeline as answered/DISA calls.
-- A `kind` column distinguishes them in the "Call Recordings
-- & AI" tab; `voicemail_id` links back to the voicemails row.
--
-- Safe / idempotent. Additive only.
-- =====================================================

ALTER TABLE call_conversations
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'call';   -- call | voicemail

ALTER TABLE call_conversations
  ADD COLUMN IF NOT EXISTS voicemail_id UUID REFERENCES voicemails(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_call_conv_kind ON call_conversations(kind);
