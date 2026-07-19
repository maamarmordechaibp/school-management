-- =====================================================
-- 047: Feature gaps from the Principal's Software Guide
--
-- Adds / extends:
--   1. grades.category, grades.score, grades.date  — structured 1-5 grading
--   2. weekly_reports                              — weekly status by Parsha
--   3. farhers                                     — oral test (farher) log
--   4. points                                      — encouragement points / midos
--   5. v_student_timeline                          — now also includes grades,
--                                                    farhers and points
--
-- Evaluation criteria (overall rating, learning/midos criteria, strengths,
-- notes, recommendations) are stored inside the existing
-- assessments.custom_data JSONB column, so no schema change is needed there.
--
-- Idempotent and safe to re-run.
-- =====================================================

-- ---------- 1. GRADES: structured scoring ----------
-- The `grades` table is shared: it holds both grade LEVELS (name/grade_number)
-- and per-student SCORE rows (student_id/subject/grade). These columns support
-- the guide's category + 1-5 colour scale + optional note for score rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='grades' AND column_name='category') THEN
    ALTER TABLE grades ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='grades' AND column_name='score') THEN
    ALTER TABLE grades ADD COLUMN score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='grades' AND column_name='date') THEN
    ALTER TABLE grades ADD COLUMN date DATE;
  END IF;
END $$;

-- ---------- 2. WEEKLY REPORTS (by Parsha) ----------
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  teacher_name TEXT,
  parsha TEXT NOT NULL,                 -- Torah portion key, e.g. 'bereishis'
  week_start DATE,                      -- Sunday of the reported week
  status TEXT CHECK (status IN ('succeeded','needs_to','personal_contact')),
  grade INTEGER,                        -- optional 1-5 grade
  description TEXT,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_student ON weekly_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_parsha ON weekly_reports(parsha);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_class ON weekly_reports(class_id);
-- One row per student per parsha (a student has one rebbe per class).
CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_reports_student_parsha
  ON weekly_reports(student_id, parsha);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS weekly_reports_authenticated_all ON weekly_reports;
CREATE POLICY weekly_reports_authenticated_all
  ON weekly_reports
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON weekly_reports FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_reports TO authenticated;

-- ---------- 3. FARHERS (oral tests) ----------
CREATE TABLE IF NOT EXISTS farhers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject TEXT CHECK (subject IN ('gemara','chumash','mishnayos','other')),
  farher_date DATE DEFAULT CURRENT_DATE,
  grade INTEGER,                        -- 1-5
  examiner_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  examiner_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farhers_student ON farhers(student_id);
CREATE INDEX IF NOT EXISTS idx_farhers_class ON farhers(class_id);
CREATE INDEX IF NOT EXISTS idx_farhers_date ON farhers(farher_date);

ALTER TABLE farhers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS farhers_authenticated_all ON farhers;
CREATE POLICY farhers_authenticated_all
  ON farhers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON farhers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON farhers TO authenticated;

-- ---------- 4. POINTS (encouragement / midos) ----------
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 1,
  reason TEXT,                          -- good_deed, diligence, midos, etc.
  awarded_at DATE DEFAULT CURRENT_DATE,
  awarded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  awarded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_student ON points(student_id);
CREATE INDEX IF NOT EXISTS idx_points_date ON points(awarded_at);

ALTER TABLE points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS points_authenticated_all ON points;
CREATE POLICY points_authenticated_all
  ON points
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON points FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON points TO authenticated;

-- ---------- 5. TIMELINE VIEW: add grades, farhers, points ----------
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
WHERE p.student_id IS NOT NULL;

GRANT SELECT ON v_student_timeline TO authenticated;
GRANT SELECT ON v_student_timeline TO anon;

-- =====================================================
-- 047 COMPLETE
-- =====================================================
