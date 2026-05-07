-- =====================================================
-- 029: Link everything to the student profile
-- - Extend v_student_timeline to include reminders, grades,
--   assessments, notes (in addition to calls/meetings/issues/lates/todos)
-- - Robust meeting date handling (scheduled_date OR meeting_date)
-- - Permissive RLS on tables we read so saves are visible
-- =====================================================

-- ---------- TIMELINE VIEW ----------
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
  AND COALESCE(sn.is_active, true) = true;

GRANT SELECT ON v_student_timeline TO authenticated;
GRANT SELECT ON v_student_timeline TO anon;

-- ---------- PERMISSIVE RLS so writes are immediately visible on profile ----------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='todos') THEN
    EXECUTE 'ALTER TABLE todos ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS todos_all ON todos';
    EXECUTE 'CREATE POLICY todos_all ON todos FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='reminders') THEN
    EXECUTE 'ALTER TABLE reminders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS reminders_all ON reminders';
    EXECUTE 'CREATE POLICY reminders_all ON reminders FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='student_issues') THEN
    EXECUTE 'ALTER TABLE student_issues ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS student_issues_all ON student_issues';
    EXECUTE 'CREATE POLICY student_issues_all ON student_issues FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='call_logs') THEN
    EXECUTE 'ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS call_logs_all ON call_logs';
    EXECUTE 'CREATE POLICY call_logs_all ON call_logs FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='student_notes') THEN
    EXECUTE 'ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS student_notes_all ON student_notes';
    EXECUTE 'CREATE POLICY student_notes_all ON student_notes FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
