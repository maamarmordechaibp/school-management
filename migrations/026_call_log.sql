-- =====================================================
-- 026 — Voice call log (mass calls / single calls via SignalWire)
-- One row per outbound call attempted from /api/send-call.
-- =====================================================

CREATE TABLE IF NOT EXISTS call_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient       TEXT NOT NULL,            -- E.164 phone number that was dialed
  message         TEXT NOT NULL,            -- spoken script
  voice           TEXT,                     -- e.g. Polly.Joanna, Polly.Carmen
  language        TEXT,                     -- e.g. en-US, he-IL
  provider        TEXT NOT NULL DEFAULT 'signalwire',
  provider_sid    TEXT,                     -- Call SID returned by SignalWire
  status          TEXT NOT NULL DEFAULT 'queued',  -- queued | failed | invalid_number
  error           TEXT,                     -- error message if failed
  related_type    TEXT,                     -- 'announcement', 'late_arrival', etc.
  related_id      UUID,
  sent_by         UUID                      -- app_users.id of sender
);

CREATE INDEX IF NOT EXISTS idx_call_log_created_at ON call_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_log_sent_by    ON call_log (sent_by);
CREATE INDEX IF NOT EXISTS idx_call_log_status     ON call_log (status);

ALTER TABLE call_log ENABLE ROW LEVEL SECURITY;

-- Authenticated staff can read their org's call log
DROP POLICY IF EXISTS "call_log_read_authenticated" ON call_log;
CREATE POLICY "call_log_read_authenticated" ON call_log
  FOR SELECT TO authenticated USING (true);

-- Inserts come from the Cloudflare Function using the service role; no
-- direct client INSERT policy is needed. (Service role bypasses RLS.)
