-- =====================================================
-- 071 — Chat-style call dialogue
--
-- Stores an AI-reconstructed, speaker-labeled dialogue so a
-- recorded call can be read like a chat (who said what) in
-- addition to the raw transcript.
--
-- Safe / idempotent. Additive only.
-- =====================================================

ALTER TABLE call_conversations
  ADD COLUMN IF NOT EXISTS ai_dialogue JSONB;   -- [{speaker:'staff'|'caller', text}]
