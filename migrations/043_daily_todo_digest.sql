-- =====================================================
-- 043: Daily to-do digest email (9:00 AM)
--
-- Every morning, email each staff member the list of their
-- to-dos that are due today or overdue (and not yet completed).
-- Uses the existing send_email() SQL function (Resend via http
-- extension) and pg_cron for scheduling.
--
-- NOTE ON TIME ZONE: pg_cron schedules in UTC and does not follow
-- daylight-saving. 13:00 UTC = 9:00 AM Eastern Daylight Time
-- (summer) / 8:00 AM Eastern Standard Time (winter). Adjust the
-- cron expression below if you need an exact wall-clock time.
--
-- Idempotent and safe to re-run.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION send_daily_todo_digest()
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
        SELECT 1 FROM todos t
        WHERE t.assigned_to = u.id
          AND COALESCE(t.status, 'pending') <> 'completed'
          AND t.due_date IS NOT NULL
          AND t.due_date <= v_today
      )
  LOOP
    SELECT
      count(*),
      string_agg(
        '<li style="margin-bottom:6px;"><strong>' || COALESCE(t.title, '(untitled)') || '</strong>'
          || CASE WHEN t.student_name IS NOT NULL AND t.student_name <> ''
                  THEN ' &mdash; ' || t.student_name ELSE '' END
          || CASE WHEN t.priority IN ('urgent', 'high')
                  THEN ' <span style="color:#b45309;font-weight:600;">[' || upper(t.priority) || ']</span>' ELSE '' END
          || CASE WHEN t.due_date < v_today
                  THEN ' <span style="color:#dc2626;">(overdue since ' || to_char(t.due_date, 'Mon DD') || ')</span>'
                  ELSE ' <span style="color:#059669;">(due today)</span>' END
          || '</li>',
        '' ORDER BY t.due_date, t.priority
      )
    INTO v_count, v_items
    FROM todos t
    WHERE t.assigned_to = v_user.id
      AND COALESCE(t.status, 'pending') <> 'completed'
      AND t.due_date IS NOT NULL
      AND t.due_date <= v_today;

    IF v_count > 0 THEN
      PERFORM send_email(
        ARRAY[v_user.email],
        'Your tasks for ' || to_char(v_today, 'FMMonth DD, YYYY') || ' (' || v_count || ')',
        '<p>Hi ' || COALESCE(v_user.name, '') || ',</p>'
          || '<p>You have <strong>' || v_count || '</strong> task(s) due today or overdue:</p>'
          || '<ul style="padding-left:18px;">' || COALESCE(v_items, '') || '</ul>'
          || '<p>Please log in to TYY Monsey to review and complete them.</p>',
        NULL,
        'TYY Monsey <send@tyymonsey.com>',
        'info@tyymonsey.com',
        'todo_digest',
        NULL,
        NULL
      );
    END IF;
  END LOOP;
END $$;

-- (Re)schedule the daily job at 13:00 UTC (~9:00 AM Eastern).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-todo-digest') THEN
    PERFORM cron.unschedule('daily-todo-digest');
  END IF;
  PERFORM cron.schedule('daily-todo-digest', '0 13 * * *', 'SELECT send_daily_todo_digest();');
END $$;
