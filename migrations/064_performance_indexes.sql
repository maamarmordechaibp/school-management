-- =====================================================
-- 064: Performance indexes (Phase 26)
--
-- Adds composite / missing indexes for the hottest query paths:
-- dashboard "my tasks", staff workload, student profile fan-out, the
-- role-based RLS helpers (can_access_student), and communication lookups.
--
-- All CREATE INDEX IF NOT EXISTS — purely ADDITIVE, idempotent, and safe.
-- Single-column indexes already created in earlier migrations are not
-- duplicated here.
-- =====================================================

-- ---- Tasks: dashboard + staff-workload filter (assignee + status + due) ----
CREATE INDEX IF NOT EXISTS idx_todos_assignee_status_due
  ON todos(assigned_to, status, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);

-- ---- Reminders: profile / timeline / RLS by student ----
CREATE INDEX IF NOT EXISTS idx_reminders_related_student
  ON reminders(related_student_id);

-- ---- Meetings: "today / upcoming scheduled" dashboard query ----
CREATE INDEX IF NOT EXISTS idx_meetings_status_date
  ON meetings(status, scheduled_date);

-- ---- Notes: threaded ordering per student ----
CREATE INDEX IF NOT EXISTS idx_student_notes_student_created
  ON student_notes(student_id, created_at DESC);

-- ---- Documents: per-student listing ----
CREATE INDEX IF NOT EXISTS idx_student_documents_student
  ON student_documents(student_id);

-- ---- RLS helper can_access_student(): teacher-of-class + tutor lookups ----
CREATE INDEX IF NOT EXISTS idx_classes_hebrew_teacher
  ON classes(hebrew_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_english_teacher
  ON classes(english_teacher_id);
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_tutor
  ON tutor_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_student
  ON tutor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_students_student
  ON special_ed_students(student_id);

-- ---- Needs-attention dashboard flag ----
CREATE INDEX IF NOT EXISTS idx_students_needs_elevation
  ON students(needs_elevation) WHERE needs_elevation = TRUE;

-- ---- Communication lookups (Phase 12/13): emails by student + recipient ----
CREATE INDEX IF NOT EXISTS idx_email_log_related ON email_log(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_email_log_recipients_gin ON email_log USING GIN (recipients);

-- =====================================================
-- 064 COMPLETE  (rollback: DROP each index above)
-- =====================================================
