-- =====================================================
-- 014: To-Do System and Custom User Permissions
-- Adds todos table for per-user task tracking,
-- and custom_permissions JSONB column on app_users 
-- for fine-grained per-user access control
-- =====================================================

-- 1. Add custom_permissions column to app_users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'custom_permissions') THEN
    ALTER TABLE app_users ADD COLUMN custom_permissions JSONB DEFAULT NULL;
  END IF;
END $$;

-- 2. Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who owns this todo
  assigned_to UUID REFERENCES app_users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  
  -- What is it about
  title TEXT NOT NULL,
  description TEXT,
  
  -- Optional student link
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT,  -- Denormalized for quick display
  
  -- Categorization
  category TEXT DEFAULT 'general',  -- general, academic, behavioral, special_ed, administrative, communication
  priority TEXT DEFAULT 'normal',   -- low, normal, high, urgent
  
  -- Status
  status TEXT DEFAULT 'pending',    -- pending, in_progress, completed, cancelled
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  
  -- Optional due date
  due_date DATE,
  
  -- Related entity (optional link to issues, meetings, etc.)
  related_type TEXT,  -- issue, meeting, call, special_ed, etc.
  related_id UUID,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_todos_student_id ON todos(student_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);

-- RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (true);  -- All authenticated users can see todos (filtered in app)

DROP POLICY IF EXISTS "Users can manage todos" ON todos;
CREATE POLICY "Users can manage todos"
  ON todos FOR ALL
  USING (true)
  WITH CHECK (true);
