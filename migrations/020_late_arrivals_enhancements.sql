-- =====================================================
-- 020 — Late Arrivals Enhancements
-- - Excused flag (excused lates do not count toward escalation)
-- - Parent notification timestamp
-- - Monthly count view for fast repeat-offender lookups
-- - app_settings rows for escalation threshold + summary recipients
-- =====================================================

-- 1. New columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'late_arrivals' AND column_name = 'excused'
  ) THEN
    ALTER TABLE late_arrivals ADD COLUMN excused BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'late_arrivals' AND column_name = 'parent_notified_at'
  ) THEN
    ALTER TABLE late_arrivals ADD COLUMN parent_notified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'late_arrivals' AND column_name = 'parent_email_log_id'
  ) THEN
    ALTER TABLE late_arrivals ADD COLUMN parent_email_log_id UUID;
  END IF;
END $$;

-- 2. Monthly unexcused count view
CREATE OR REPLACE VIEW v_late_monthly_counts AS
SELECT
  student_id,
  date_trunc('month', date)::date AS month_start,
  COUNT(*) FILTER (WHERE COALESCE(excused, FALSE) = FALSE) AS unexcused_count,
  COUNT(*) AS total_count,
  MAX(date) AS last_late_date
FROM late_arrivals
GROUP BY student_id, date_trunc('month', date);

-- 3. Default settings (only inserted once)
INSERT INTO app_settings (key, value)
VALUES ('late_escalation_threshold', '3')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('late_summary_recipients', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('school_name_yi', 'תלמוד תורה ימין מאנסי')
ON CONFLICT (key) DO NOTHING;
