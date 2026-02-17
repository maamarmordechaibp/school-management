-- =====================================================
-- 016: Fix reminders table - add missing columns + RLS
-- Ensures all columns exist and adds permissive RLS
-- =====================================================

-- 1. Add missing columns (idempotent)
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

  -- reminder_time (separate from reminder_date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reminders' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE reminders ADD COLUMN reminder_time TIME;
  END IF;
END $$;

-- 2. Enable RLS on reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS reminders_select_all ON reminders;
DROP POLICY IF EXISTS reminders_all ON reminders;

-- 4. Create permissive policies
CREATE POLICY reminders_select_all ON reminders FOR SELECT USING (true);
CREATE POLICY reminders_all ON reminders FOR ALL USING (true) WITH CHECK (true);
