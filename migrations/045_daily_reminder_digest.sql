-- =====================================================
-- 045: Daily reminder digest email (9:00 AM)
--
-- Each morning, email every staff member the reminders they
-- created that are due today or overdue (and not completed).
-- Complements the to-do digest (043). Uses send_email() + pg_cron.
--
-- TIME ZONE: 13:00 UTC ~= 9:00 AM Eastern (see note in 043).
--
-- Idempotent and safe to re-run.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION send_daily_reminder_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user  RECORD;
  v_today DATE := (now() AT TIME ZONE 'America/New_York')::date;
  v_items TEXT;
  v_count INT;
BEGIN
  FOR v_user IN
    SELECT u.id, u.name, u.email
    FROM app_users u
    WHERE u.email IS NOT NULL AND u.email <> ''
      AND EXISTS (
        SELECT 1 FROM reminders r
        WHERE r.created_by = u.id
          AND COALESCE(r.is_completed, false) = false
          AND COALESCE(r.is_active, true) = true
          AND r.reminder_date IS NOT NULL
          AND r.reminder_date <= v_today
      )
  LOOP
    SELECT
      count(*),
      string_agg(
        '<li style="margin-bottom:6px;"><strong>' || COALESCE(r.title, '(untitled)') || '</strong>'
          || CASE WHEN r.related_student_name IS NOT NULL AND r.related_student_name <> ''
                  THEN ' &mdash; ' || r.related_student_name ELSE '' END
          || CASE WHEN r.reminder_date < v_today
                  THEN ' <span style="color:#dc2626;">(overdue since ' || to_char(r.reminder_date, 'Mon DD') || ')</span>'
                  ELSE ' <span style="color:#059669;">(due today)</span>' END
          || CASE WHEN r.description IS NOT NULL AND r.description <> ''
                  THEN '<br><span style="color:#64748b;font-size:13px;">' || r.description || '</span>' ELSE '' END
          || '</li>',
        '' ORDER BY r.reminder_date
      )
    INTO v_count, v_items
    FROM reminders r
    WHERE r.created_by = v_user.id
      AND COALESCE(r.is_completed, false) = false
      AND COALESCE(r.is_active, true) = true
      AND r.reminder_date IS NOT NULL
      AND r.reminder_date <= v_today;

    IF v_count > 0 THEN
      PERFORM send_email(
        ARRAY[v_user.email],
        'Your reminders for ' || to_char(v_today, 'FMMonth DD, YYYY') || ' (' || v_count || ')',
        '<p>Hi ' || COALESCE(v_user.name, '') || ',</p>'
          || '<p>You have <strong>' || v_count || '</strong> reminder(s) due today or overdue:</p>'
          || '<ul style="padding-left:18px;">' || COALESCE(v_items, '') || '</ul>'
          || '<p>Log in to TYY Monsey to review them.</p>',
        NULL,
        'TYY Monsey <send@tyymonsey.com>',
        'info@tyymonsey.com',
        'reminder_digest',
        NULL,
        NULL
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reminder-digest') THEN
    PERFORM cron.unschedule('daily-reminder-digest');
  END IF;
  PERFORM cron.schedule('daily-reminder-digest', '5 13 * * *', 'SELECT send_daily_reminder_digest();');
END $$;
