-- =====================================================
-- 069 — Call recording AI analysis
--
-- Adds `call_conversations`: one row per recorded inbound
-- conversation. The Cloudflare voice Functions record the
-- call (SignalWire), transcribe it (Yiddish Labs), and run
-- the AI to produce a summary + suggested action items.
-- Staff apply the suggestions with one click, creating
-- todos/reminders (marked source='ai_draft').
--
-- Safe / idempotent: IF NOT EXISTS everywhere, re-runnable.
-- Additive only.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- 1. call_conversations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS call_conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_call_id     UUID REFERENCES inbound_calls(id) ON DELETE SET NULL,
  caller_number       TEXT,
  extension_id        UUID REFERENCES phone_extensions(id) ON DELETE SET NULL,
  target_user_id      UUID REFERENCES app_users(id) ON DELETE SET NULL,
  matched_type        TEXT,                       -- parent | staff | tutor | unknown
  matched_id          UUID,
  matched_name        TEXT,
  matched_student_ids UUID[],
  recording_url       TEXT,                       -- public call-audio URL
  duration_sec        INTEGER,
  provider_sid        TEXT,                       -- SignalWire CallSid
  recording_sid       TEXT,                       -- SignalWire RecordingSid
  yl_job_id           TEXT,                       -- Yiddish Labs transcription job id
  transcript          TEXT,
  transcript_summary  TEXT,                       -- Yiddish Labs' own summary
  keywords            TEXT[],
  ai_summary          TEXT,
  ai_action_items     JSONB,                      -- [{title,description,due_date,priority}]
  sentiment           TEXT,
  -- recorded | transcribing | transcribed | analyzed | failed
  status              TEXT NOT NULL DEFAULT 'recorded',
  applied             BOOLEAN NOT NULL DEFAULT FALSE, -- suggestions accepted into todos/reminders
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_conv_created  ON call_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_conv_status   ON call_conversations(status);
CREATE INDEX IF NOT EXISTS idx_call_conv_call     ON call_conversations(provider_sid);
CREATE INDEX IF NOT EXISTS idx_call_conv_target   ON call_conversations(target_user_id);

-- updated_at trigger (reuses touch_phone_updated_at from migration 037)
DROP TRIGGER IF EXISTS trg_touch_call_conversations ON call_conversations;
CREATE TRIGGER trg_touch_call_conversations
  BEFORE UPDATE ON call_conversations
  FOR EACH ROW EXECUTE FUNCTION touch_phone_updated_at();

-- -----------------------------------------------------
-- 2. Mark AI-drafted follow-ups so they can be traced/undone
-- -----------------------------------------------------
ALTER TABLE todos     ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS source TEXT;

-- -----------------------------------------------------
-- 3. RLS — mirror inbound_calls: staff read; owner/admin
--    update/delete. Inserts come from the service-role
--    Function, which bypasses RLS.
-- -----------------------------------------------------
ALTER TABLE call_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_conversations_read" ON call_conversations;
CREATE POLICY "call_conversations_read" ON call_conversations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "call_conversations_update" ON call_conversations;
CREATE POLICY "call_conversations_update" ON call_conversations
  FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin())
  WITH CHECK (target_user_id = auth.uid() OR is_phone_admin());

DROP POLICY IF EXISTS "call_conversations_delete" ON call_conversations;
CREATE POLICY "call_conversations_delete" ON call_conversations
  FOR DELETE TO authenticated
  USING (target_user_id = auth.uid() OR is_phone_admin());

-- -----------------------------------------------------
-- 4. Extend v_student_timeline with recorded-call summaries.
--    A conversation surfaces on every matched student's timeline.
--    (Full view redefined; matches the pattern of 047.)
-- -----------------------------------------------------
DROP VIEW IF EXISTS v_student_timeline CASCADE;

CREATE VIEW v_student_timeline AS
-- Call logs
SELECT
  cl.student_id,
  cl.id::uuid AS ref_id,
  'call'::text AS kind,
  COALESCE(cl.call_date::timestamptz, cl.created_at) AS occurred_at,
  COALESCE(cl.purpose, cl.notes, cl.summary, 'Call logged') AS summary,
  jsonb_build_object(
    'contact_person', cl.contact_person,
    'phone_number', cl.phone_number,
    'call_type', cl.call_type,
    'follow_up_date', cl.follow_up_date,
    'follow_up_needed', cl.follow_up_needed,
    'outcome', cl.outcome
  ) AS details
FROM call_logs cl
WHERE cl.student_id IS NOT NULL

UNION ALL

-- Meetings
SELECT
  m.student_id,
  m.id::uuid AS ref_id,
  'meeting'::text AS kind,
  COALESCE(m.scheduled_date::timestamptz, m.meeting_date::timestamptz, m.created_at) AS occurred_at,
  COALESCE(m.title, m.description, 'Meeting') AS summary,
  jsonb_build_object(
    'meeting_type', m.meeting_type,
    'location', m.location,
    'status', m.status,
    'description', m.description,
    'duration_minutes', m.duration_minutes
  ) AS details
FROM meetings m
WHERE m.student_id IS NOT NULL

UNION ALL

-- Student issues
SELECT
  si.student_id,
  si.id::uuid AS ref_id,
  'issue'::text AS kind,
  COALESCE(si.created_at, NOW()) AS occurred_at,
  COALESCE(si.title, 'Issue reported') AS summary,
  jsonb_build_object(
    'category', si.category,
    'severity', si.severity,
    'status', si.status,
    'description', si.description
  ) AS details
FROM student_issues si
WHERE si.student_id IS NOT NULL

UNION ALL

-- Late arrivals
SELECT
  la.student_id,
  la.id::uuid AS ref_id,
  'late'::text AS kind,
  (la.date::timestamptz + COALESCE(la.arrival_time, '00:00'::time)) AS occurred_at,
  CASE
    WHEN la.minutes_late IS NOT NULL THEN 'Late ' || la.minutes_late || ' min'
    ELSE 'Late arrival'
  END AS summary,
  jsonb_build_object(
    'arrival_time', la.arrival_time,
    'minutes_late', la.minutes_late,
    'reason', la.reason,
    'excused', la.excused,
    'parent_notified_at', la.parent_notified_at
  ) AS details
FROM late_arrivals la
WHERE la.student_id IS NOT NULL

UNION ALL

-- Todos linked to a student
SELECT
  t.student_id,
  t.id::uuid AS ref_id,
  'todo'::text AS kind,
  COALESCE(t.created_at, NOW()) AS occurred_at,
  t.title AS summary,
  jsonb_build_object(
    'status', t.status,
    'priority', t.priority,
    'category', t.category,
    'due_date', t.due_date,
    'assigned_to', t.assigned_to,
    'description', t.description
  ) AS details
FROM todos t
WHERE t.student_id IS NOT NULL

UNION ALL

-- Reminders linked to a student
SELECT
  r.related_student_id AS student_id,
  r.id::uuid AS ref_id,
  'reminder'::text AS kind,
  COALESCE(
    (r.reminder_date::timestamptz + COALESCE(r.reminder_time, '00:00'::time)),
    r.created_at
  ) AS occurred_at,
  r.title AS summary,
  jsonb_build_object(
    'description', r.description,
    'status', r.status,
    'priority', r.priority,
    'reminder_date', r.reminder_date,
    'reminder_time', r.reminder_time,
    'is_recurring', r.is_recurring,
    'recurrence_pattern', r.recurrence_pattern
  ) AS details
FROM reminders r
WHERE r.related_student_id IS NOT NULL

UNION ALL

-- Assessments
SELECT
  a.student_id,
  a.id::uuid AS ref_id,
  'assessment'::text AS kind,
  COALESCE(a.created_at, NOW()) AS occurred_at,
  COALESCE(
    NULLIF(a.summary, ''),
    'Assessment by ' || COALESCE(a.teacher_name, 'staff')
  ) AS summary,
  jsonb_build_object(
    'teacher_name', a.teacher_name,
    'status', a.status,
    'date', a."date"
  ) AS details
FROM assessments a
WHERE a.student_id IS NOT NULL

UNION ALL

-- Student notes
SELECT
  sn.student_id,
  sn.id::uuid AS ref_id,
  'note'::text AS kind,
  COALESCE(sn.created_at, NOW()) AS occurred_at,
  COALESCE(sn.title, 'Note') AS summary,
  jsonb_build_object(
    'content', sn.content,
    'note_type', sn.note_type
  ) AS details
FROM student_notes sn
WHERE sn.student_id IS NOT NULL
  AND COALESCE(sn.is_active, true) = true

UNION ALL

-- Grades (per-student score rows only)
SELECT
  g.student_id,
  g.id::uuid AS ref_id,
  'grade'::text AS kind,
  COALESCE(g."date"::timestamptz, g.created_at) AS occurred_at,
  COALESCE(NULLIF(g.subject, ''), g.category, 'Grade')
    || ': ' || COALESCE(g.score::text, g.grade, '—') AS summary,
  jsonb_build_object(
    'subject', g.subject,
    'category', g.category,
    'score', g.score,
    'grade', g.grade,
    'notes', g.notes
  ) AS details
FROM grades g
WHERE g.student_id IS NOT NULL

UNION ALL

-- Farhers (oral tests)
SELECT
  f.student_id,
  f.id::uuid AS ref_id,
  'farher'::text AS kind,
  COALESCE(f.farher_date::timestamptz, f.created_at) AS occurred_at,
  'Farher (' || COALESCE(f.subject, 'other') || ')'
    || CASE WHEN f.grade IS NOT NULL THEN ': ' || f.grade::text ELSE '' END AS summary,
  jsonb_build_object(
    'subject', f.subject,
    'grade', f.grade,
    'examiner_name', f.examiner_name,
    'notes', f.notes
  ) AS details
FROM farhers f
WHERE f.student_id IS NOT NULL

UNION ALL

-- Points (encouragement / midos)
SELECT
  p.student_id,
  p.id::uuid AS ref_id,
  'point'::text AS kind,
  COALESCE(p.awarded_at::timestamptz, p.created_at) AS occurred_at,
  '+' || p.points::text || ' points'
    || CASE WHEN p.reason IS NOT NULL AND p.reason <> '' THEN ' — ' || p.reason ELSE '' END AS summary,
  jsonb_build_object(
    'points', p.points,
    'reason', p.reason,
    'awarded_by_name', p.awarded_by_name
  ) AS details
FROM points p
WHERE p.student_id IS NOT NULL

UNION ALL

-- Recorded calls with AI summary (one row per matched student)
SELECT
  s_id AS student_id,
  cc.id::uuid AS ref_id,
  'call_ai'::text AS kind,
  cc.created_at AS occurred_at,
  COALESCE(NULLIF(cc.ai_summary, ''), 'Recorded call') AS summary,
  jsonb_build_object(
    'caller_number', cc.caller_number,
    'caller_name', cc.matched_name,
    'status', cc.status,
    'duration_sec', cc.duration_sec,
    'recording_url', cc.recording_url,
    'action_items', cc.ai_action_items,
    'sentiment', cc.sentiment
  ) AS details
FROM call_conversations cc
CROSS JOIN LATERAL unnest(COALESCE(cc.matched_student_ids, ARRAY[]::uuid[])) AS s_id
WHERE cc.ai_summary IS NOT NULL;

GRANT SELECT ON v_student_timeline TO authenticated;
GRANT SELECT ON v_student_timeline TO anon;

-- Realtime so the new "Call Recordings & AI" tab updates live.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'call_conversations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE call_conversations';
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;
