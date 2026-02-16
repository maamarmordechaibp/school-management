-- =====================================================
-- 012: Fix missing tables and columns
-- Adds app_settings table, missing reminders columns,
-- and email_log table if not created yet
-- =====================================================

-- 1. app_settings table (for menu visibility etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to reminders table
DO $$
BEGIN
  -- is_active (soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE reminders ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  -- is_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE reminders ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
  END IF;

  -- reminder_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'reminder_type'
  ) THEN
    ALTER TABLE reminders ADD COLUMN reminder_type TEXT DEFAULT 'general';
  END IF;

  -- priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'priority'
  ) THEN
    ALTER TABLE reminders ADD COLUMN priority TEXT DEFAULT 'normal';
  END IF;

  -- related_student_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'related_student_id'
  ) THEN
    ALTER TABLE reminders ADD COLUMN related_student_id UUID;
  END IF;

  -- related_student_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'related_student_name'
  ) THEN
    ALTER TABLE reminders ADD COLUMN related_student_name TEXT;
  END IF;

  -- created_by_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'created_by_name'
  ) THEN
    ALTER TABLE reminders ADD COLUMN created_by_name TEXT;
  END IF;

  -- reminder_time (separate from reminder_date for the form)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE reminders ADD COLUMN reminder_time TIME;
  END IF;
END $$;

-- 3. email_log table (if not created yet)
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipients TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  related_type TEXT,
  related_id UUID,
  sent_by UUID REFERENCES app_users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- 4. Enable RLS but allow all for now (adjust as needed)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write app_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'app_settings_all' AND tablename = 'app_settings'
  ) THEN
    CREATE POLICY app_settings_all ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to use email_log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'email_log_all' AND tablename = 'email_log'
  ) THEN
    CREATE POLICY email_log_all ON email_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
