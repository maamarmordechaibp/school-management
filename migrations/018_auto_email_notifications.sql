-- =====================================================
-- 018: Auto-email notifications on student updates
-- Adds notify_on_updates flag to students table.
-- Creates DB triggers that auto-send email (via send_email RPC)
-- whenever a related record is created or status changes.
-- =====================================================

-- 1. Add notification columns to students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'notify_on_updates'
  ) THEN
    ALTER TABLE students ADD COLUMN notify_on_updates BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'notification_emails'
  ) THEN
    ALTER TABLE students ADD COLUMN notification_emails TEXT[];
  END IF;
END $$;

-- 2. Helper function: sends notification for a student if enabled
CREATE OR REPLACE FUNCTION notify_student_update(
  p_student_id UUID,
  p_event_type TEXT,
  p_details TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student RECORD;
  v_emails TEXT[];
  v_student_name TEXT;
  v_html TEXT;
BEGIN
  -- Look up the student
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF NOT FOUND OR v_student.notify_on_updates IS NOT TRUE THEN
    RETURN; -- Student not found or notifications disabled
  END IF;

  -- Build the student display name
  v_student_name := COALESCE(v_student.hebrew_name, 
    TRIM(COALESCE(v_student.first_name, '') || ' ' || COALESCE(v_student.last_name, '')));

  -- Determine email recipients: use notification_emails if set, else fall back to parent emails
  v_emails := v_student.notification_emails;
  
  IF v_emails IS NULL OR array_length(v_emails, 1) IS NULL THEN
    v_emails := ARRAY[]::TEXT[];
    IF v_student.father_email IS NOT NULL AND v_student.father_email != '' THEN
      v_emails := array_append(v_emails, v_student.father_email);
    END IF;
    IF v_student.mother_email IS NOT NULL AND v_student.mother_email != '' THEN
      v_emails := array_append(v_emails, v_student.mother_email);
    END IF;
  END IF;

  -- No emails to send to
  IF array_length(v_emails, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Build HTML email
  v_html := '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
    || '<div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">'
    || '<h2 style="margin: 0;">Student Update Notification</h2>'
    || '</div>'
    || '<div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">'
    || '<p><strong>Student:</strong> ' || v_student_name || '</p>'
    || '<p><strong>Update:</strong> ' || p_event_type || '</p>'
    || '<p>' || p_details || '</p>'
    || '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">'
    || '<p style="color: #64748b; font-size: 12px;">This is an automated notification from the School Management System.</p>'
    || '</div></div>';

  -- Call send_email (which uses pg_net → Resend API)
  PERFORM send_email(
    p_to := v_emails,
    p_subject := 'Student Update: ' || v_student_name || ' - ' || p_event_type,
    p_html := v_html,
    p_text := 'Student: ' || v_student_name || E'\nUpdate: ' || p_event_type || E'\n' || p_details,
    p_related_type := 'student_update',
    p_related_id := p_student_id
  );
END;
$$;

-- 3. Trigger function for student_issues
CREATE OR REPLACE FUNCTION trigger_notify_student_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'New Issue Created',
      'Category: ' || COALESCE(NEW.category, 'N/A') 
        || '<br>Severity: ' || COALESCE(NEW.severity, 'N/A')
        || '<br>Description: ' || COALESCE(NEW.description, 'No description')
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'Issue Status Changed',
      'Status changed from <strong>' || COALESCE(OLD.status, 'unknown') 
        || '</strong> to <strong>' || COALESCE(NEW.status, 'unknown') || '</strong>'
        || '<br>Category: ' || COALESCE(NEW.category, 'N/A')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_student_issue ON student_issues;
CREATE TRIGGER trg_notify_student_issue
  AFTER INSERT OR UPDATE ON student_issues
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_student_issue();

-- 4. Trigger function for call_logs
CREATE OR REPLACE FUNCTION trigger_notify_call_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.student_id IS NOT NULL THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'New Call Log',
      'Type: ' || COALESCE(NEW.call_type, 'N/A')
        || '<br>Outcome: ' || COALESCE(NEW.outcome, 'N/A')
        || '<br>Notes: ' || COALESCE(NEW.notes, 'No notes')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_call_log ON call_logs;
CREATE TRIGGER trg_notify_call_log
  AFTER INSERT ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_call_log();

-- 5. Trigger function for meetings
CREATE OR REPLACE FUNCTION trigger_notify_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.student_id IS NOT NULL THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'New Meeting Scheduled',
      'Type: ' || COALESCE(NEW.meeting_type, 'N/A')
        || '<br>Date: ' || COALESCE(NEW.meeting_date::TEXT, 'TBD')
        || '<br>Notes: ' || COALESCE(NEW.notes, 'No notes')
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.student_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'Meeting Status Changed',
      'Status changed from <strong>' || COALESCE(OLD.status, 'unknown')
        || '</strong> to <strong>' || COALESCE(NEW.status, 'unknown') || '</strong>'
        || '<br>Type: ' || COALESCE(NEW.meeting_type, 'N/A')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_meeting ON meetings;
CREATE TRIGGER trg_notify_meeting
  AFTER INSERT OR UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_meeting();

-- 6. Trigger function for special_ed_students
CREATE OR REPLACE FUNCTION trigger_notify_special_ed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'Special Education Record Created',
      'Status: ' || COALESCE(NEW.status, 'N/A')
        || '<br>Help Type: ' || COALESCE(NEW.help_type, 'N/A')
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'Special Ed Status Changed',
      'Status changed from <strong>' || COALESCE(OLD.status, 'unknown')
        || '</strong> to <strong>' || COALESCE(NEW.status, 'unknown') || '</strong>'
        || '<br>Help Type: ' || COALESCE(NEW.help_type, 'N/A')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_special_ed ON special_ed_students;
CREATE TRIGGER trg_notify_special_ed
  AFTER INSERT OR UPDATE ON special_ed_students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_special_ed();

-- 7. Trigger function for todos
CREATE OR REPLACE FUNCTION trigger_notify_todo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.student_id IS NOT NULL THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'New Task Created',
      'Title: ' || COALESCE(NEW.title, 'N/A')
        || '<br>Category: ' || COALESCE(NEW.category, 'N/A')
        || '<br>Priority: ' || COALESCE(NEW.priority, 'normal')
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.student_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_student_update(
      NEW.student_id,
      'Task Status Changed',
      'Title: ' || COALESCE(NEW.title, 'N/A')
        || '<br>Status changed from <strong>' || COALESCE(OLD.status, 'unknown')
        || '</strong> to <strong>' || COALESCE(NEW.status, 'unknown') || '</strong>'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_todo ON todos;
CREATE TRIGGER trg_notify_todo
  AFTER INSERT OR UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_todo();

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION notify_student_update TO authenticated;
GRANT EXECUTE ON FUNCTION notify_student_update TO anon;
