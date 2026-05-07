-- =====================================================
-- 030: Recurring tasks per student + auto follow-up notes
-- - Add recurrence cols to todos (reminders already have them)
-- - Function + trigger that, when a recurring task is marked
--   completed, automatically creates the next occurrence
-- - Trigger that auto-creates a follow-up reminder + a student
--   note whenever a call_log is saved with follow_up_needed
-- =====================================================

-- ---------- TODOS recurrence columns ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='is_recurring') THEN
    ALTER TABLE todos ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='recurrence_pattern') THEN
    ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='recurrence_end_date') THEN
    ALTER TABLE todos ADD COLUMN recurrence_end_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='next_occurrence_date') THEN
    ALTER TABLE todos ADD COLUMN next_occurrence_date DATE;
  END IF;
END $$;

-- ---------- Helper: compute next occurrence ----------
CREATE OR REPLACE FUNCTION compute_next_occurrence(start_d DATE, pattern TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF start_d IS NULL OR pattern IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN CASE pattern
    WHEN 'daily'     THEN start_d + INTERVAL '1 day'
    WHEN 'weekly'    THEN start_d + INTERVAL '1 week'
    WHEN 'biweekly'  THEN start_d + INTERVAL '2 weeks'
    WHEN 'monthly'   THEN start_d + INTERVAL '1 month'
    WHEN 'bimonthly' THEN start_d + INTERVAL '2 months'
    WHEN 'quarterly' THEN start_d + INTERVAL '3 months'
    WHEN 'yearly'    THEN start_d + INTERVAL '1 year'
    ELSE NULL
  END;
END;
$$;

-- ---------- Roll over recurring TODO when completed ----------
CREATE OR REPLACE FUNCTION roll_recurring_todo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_d DATE;
BEGIN
  IF NEW.is_recurring = TRUE
     AND NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.recurrence_pattern IS NOT NULL THEN
    next_d := compute_next_occurrence(COALESCE(NEW.due_date, NEW.next_occurrence_date, CURRENT_DATE), NEW.recurrence_pattern);
    IF next_d IS NOT NULL
       AND (NEW.recurrence_end_date IS NULL OR next_d <= NEW.recurrence_end_date) THEN
      INSERT INTO todos (
        assigned_to, created_by, title, description, student_id, student_name,
        category, priority, status, due_date,
        related_type, related_id, notes,
        is_recurring, recurrence_pattern, recurrence_end_date, next_occurrence_date
      ) VALUES (
        NEW.assigned_to, NEW.created_by, NEW.title, NEW.description, NEW.student_id, NEW.student_name,
        NEW.category, NEW.priority, 'pending', next_d,
        NEW.related_type, NEW.related_id, NEW.notes,
        TRUE, NEW.recurrence_pattern, NEW.recurrence_end_date, next_d
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_roll_recurring_todo ON todos;
CREATE TRIGGER trg_roll_recurring_todo
AFTER UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION roll_recurring_todo();

-- ---------- Roll over recurring REMINDER when completed/cancelled ----------
CREATE OR REPLACE FUNCTION roll_recurring_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_d DATE;
BEGIN
  IF NEW.is_recurring = TRUE
     AND NEW.status IN ('completed', 'sent')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.recurrence_pattern IS NOT NULL THEN
    next_d := compute_next_occurrence(COALESCE(NEW.reminder_date, NEW.next_occurrence_date, CURRENT_DATE), NEW.recurrence_pattern);
    IF next_d IS NOT NULL
       AND (NEW.recurrence_end_date IS NULL OR next_d <= NEW.recurrence_end_date) THEN
      INSERT INTO reminders (
        title, description, reminder_date, reminder_time,
        related_type, related_id, related_student_id, related_student_name,
        priority, status, send_email, email_recipients,
        is_recurring, recurrence_pattern, recurrence_end_date, next_occurrence_date,
        created_by
      ) VALUES (
        NEW.title, NEW.description, next_d, NEW.reminder_time,
        NEW.related_type, NEW.related_id, NEW.related_student_id, NEW.related_student_name,
        NEW.priority, 'pending', NEW.send_email, NEW.email_recipients,
        TRUE, NEW.recurrence_pattern, NEW.recurrence_end_date, next_d,
        NEW.created_by
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_roll_recurring_reminder ON reminders;
CREATE TRIGGER trg_roll_recurring_reminder
AFTER UPDATE ON reminders
FOR EACH ROW
EXECUTE FUNCTION roll_recurring_reminder();

-- ---------- Auto follow-up from call_logs ----------
-- When a call is logged with follow_up_needed, create a reminder
-- and a student_note so it shows in the student's file automatically.
CREATE OR REPLACE FUNCTION auto_followup_from_call()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  s_name TEXT;
BEGIN
  IF NEW.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO s_name FROM students WHERE id = NEW.student_id;

  -- 1) Drop a note in the kid's file every time we log a call
  BEGIN
    INSERT INTO student_notes (student_id, title, content, note_type, is_active, created_at)
    VALUES (
      NEW.student_id,
      'Phone call: ' || COALESCE(NEW.contact_person, NEW.phone_number, 'contact'),
      COALESCE(NEW.notes, NEW.purpose, NEW.summary, 'Call logged'),
      'call',
      TRUE,
      COALESCE(NEW.created_at, NOW())
    );
  EXCEPTION WHEN OTHERS THEN
    -- swallow if student_notes schema differs
    NULL;
  END;

  -- 2) If follow-up needed, schedule a reminder
  IF COALESCE(NEW.follow_up_needed, FALSE) = TRUE THEN
    BEGIN
      INSERT INTO reminders (
        title, description, reminder_date,
        related_type, related_id, related_student_id, related_student_name,
        priority, status, is_recurring
      ) VALUES (
        'Follow up call: ' || COALESCE(NEW.contact_person, s_name, 'contact'),
        COALESCE(NEW.notes, NEW.purpose, 'Follow up on previous call'),
        COALESCE(NEW.follow_up_date, (CURRENT_DATE + INTERVAL '7 days')::date),
        'call', NEW.id, NEW.student_id, s_name,
        'normal', 'pending', FALSE
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_followup_from_call ON call_logs;
CREATE TRIGGER trg_auto_followup_from_call
AFTER INSERT ON call_logs
FOR EACH ROW
EXECUTE FUNCTION auto_followup_from_call();

-- ---------- Make sure cascade deletes work for special-ed children ----------
-- Older schemas may have created these as ON DELETE NO ACTION.
DO $$
BEGIN
  -- info_sources
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='special_ed_info_sources' AND constraint_type='FOREIGN KEY'
  ) THEN
    BEGIN
      ALTER TABLE special_ed_info_sources
        DROP CONSTRAINT IF EXISTS special_ed_info_sources_special_ed_student_id_fkey;
      ALTER TABLE special_ed_info_sources
        ADD CONSTRAINT special_ed_info_sources_special_ed_student_id_fkey
        FOREIGN KEY (special_ed_student_id) REFERENCES special_ed_students(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  -- evaluations
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='special_ed_evaluations' AND constraint_type='FOREIGN KEY'
  ) THEN
    BEGIN
      ALTER TABLE special_ed_evaluations
        DROP CONSTRAINT IF EXISTS special_ed_evaluations_special_ed_student_id_fkey;
      ALTER TABLE special_ed_evaluations
        ADD CONSTRAINT special_ed_evaluations_special_ed_student_id_fkey
        FOREIGN KEY (special_ed_student_id) REFERENCES special_ed_students(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  -- tutoring
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='special_ed_tutoring' AND constraint_type='FOREIGN KEY'
  ) THEN
    BEGIN
      ALTER TABLE special_ed_tutoring
        DROP CONSTRAINT IF EXISTS special_ed_tutoring_special_ed_student_id_fkey;
      ALTER TABLE special_ed_tutoring
        ADD CONSTRAINT special_ed_tutoring_special_ed_student_id_fkey
        FOREIGN KEY (special_ed_student_id) REFERENCES special_ed_students(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  -- session logs
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='special_ed_session_logs' AND constraint_type='FOREIGN KEY'
  ) THEN
    BEGIN
      ALTER TABLE special_ed_session_logs
        DROP CONSTRAINT IF EXISTS special_ed_session_logs_special_ed_student_id_fkey;
      ALTER TABLE special_ed_session_logs
        ADD CONSTRAINT special_ed_session_logs_special_ed_student_id_fkey
        FOREIGN KEY (special_ed_student_id) REFERENCES special_ed_students(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;
