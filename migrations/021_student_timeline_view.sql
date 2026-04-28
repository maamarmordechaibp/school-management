-- =====================================================
-- 021 — Student Timeline View
-- A normalized chronological feed of every interaction
-- with a student: calls, meetings, issues, late arrivals,
-- todos, and grades. Used by the unified profile hub.
-- =====================================================

CREATE OR REPLACE VIEW v_student_timeline AS
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

UNION ALL

-- Meetings
SELECT
  m.student_id,
  m.id::uuid AS ref_id,
  'meeting'::text AS kind,
  COALESCE(m.meeting_date::timestamptz, m.scheduled_date::timestamptz, m.created_at) AS occurred_at,
  COALESCE(m.title, m.description, 'Meeting') AS summary,
  jsonb_build_object(
    'meeting_type', m.meeting_type,
    'location', m.location,
    'status', m.status,
    'description', m.description
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
    'assigned_to', t.assigned_to
  ) AS details
FROM todos t
WHERE t.student_id IS NOT NULL;

-- Grants (RLS for underlying tables already governs visibility)
GRANT SELECT ON v_student_timeline TO authenticated;
GRANT SELECT ON v_student_timeline TO anon;
