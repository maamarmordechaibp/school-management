-- ============================================
-- Student Workflow Management System
-- Database Migration Script
-- ============================================
-- Run this script in your Supabase SQL Editor
-- IMPORTANT: Backup your database first!
-- ============================================

-- 1. Update students table to support workflow tracking
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'initial_contact',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES app_users(id),
  ADD COLUMN IF NOT EXISTS intake_date DATE DEFAULT CURRENT_DATE;

-- Create indexes for workflow queries
CREATE INDEX IF NOT EXISTS idx_students_workflow_stage ON students(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_students_assigned_to ON students(assigned_to);

-- Update existing students to have initial workflow stage
UPDATE students 
SET workflow_stage = 'initial_contact' 
WHERE workflow_stage IS NULL;

-- ============================================
-- 2. Create student_plans table
-- ============================================
CREATE TABLE IF NOT EXISTS student_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Plan Details
  goals TEXT NOT NULL,
  social_emotional_notes TEXT,
  kriah_notes TEXT,
  limud_notes TEXT,
  
  -- Interventions (stored as JSONB array)
  interventions JSONB DEFAULT '[]'::jsonb,
  
  -- Review Settings
  review_frequency VARCHAR(20) DEFAULT 'monthly',
  
  -- Status & Tracking
  status VARCHAR(30) DEFAULT 'draft',
  created_by UUID REFERENCES app_users(id),
  reviewed_by UUID REFERENCES app_users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for student_plans
CREATE INDEX IF NOT EXISTS idx_student_plans_student_id ON student_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_student_plans_status ON student_plans(status);
CREATE INDEX IF NOT EXISTS idx_student_plans_created_at ON student_plans(created_at DESC);

-- ============================================
-- 3. Create progress_reviews table
-- ============================================
CREATE TABLE IF NOT EXISTS progress_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Review Details
  progress_rating VARCHAR(20) NOT NULL,
  attendance_status VARCHAR(20),
  notes TEXT,
  concerns TEXT,
  
  -- Action Flags
  action_needed BOOLEAN DEFAULT false,
  escalate_to_mz BOOLEAN DEFAULT false,
  
  -- Tracking
  reviewed_by UUID REFERENCES app_users(id),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for progress_reviews
CREATE INDEX IF NOT EXISTS idx_progress_reviews_student_id ON progress_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_reviews_created_at ON progress_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_reviews_escalate ON progress_reviews(escalate_to_mz) WHERE escalate_to_mz = true;
CREATE INDEX IF NOT EXISTS idx_progress_reviews_rating ON progress_reviews(progress_rating);

-- ============================================
-- 4. Create contacts table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_student_id ON contacts(student_id);

-- ============================================
-- 5. Create workflow_tasks table (optional)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Task Details
  task_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES app_users(id),
  due_date DATE,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workflow_tasks
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_student_id ON workflow_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due_date ON workflow_tasks(due_date);

-- ============================================
-- 6. Enable Row Level Security
-- ============================================
ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create RLS Policies
-- ============================================

-- Policies for student_plans
DROP POLICY IF EXISTS "Admins can view all plans" ON student_plans;
CREATE POLICY "Admins can view all plans"
  ON student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

DROP POLICY IF EXISTS "Teachers can view their students plans" ON student_plans;
CREATE POLICY "Teachers can view their students plans"
  ON student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_plans.student_id
      AND students.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert plans" ON student_plans;
CREATE POLICY "Admins can insert plans"
  ON student_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

DROP POLICY IF EXISTS "Admins can update plans" ON student_plans;
CREATE POLICY "Admins can update plans"
  ON student_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

-- Policies for progress_reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON progress_reviews;
CREATE POLICY "Admins can view all reviews"
  ON progress_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

DROP POLICY IF EXISTS "Teachers can view their students reviews" ON progress_reviews;
CREATE POLICY "Teachers can view their students reviews"
  ON progress_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = progress_reviews.student_id
      AND students.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert reviews" ON progress_reviews;
CREATE POLICY "Admins can insert reviews"
  ON progress_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

-- Policies for workflow_tasks
DROP POLICY IF EXISTS "Users can view assigned tasks" ON workflow_tasks;
CREATE POLICY "Users can view assigned tasks"
  ON workflow_tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

DROP POLICY IF EXISTS "Admins can manage tasks" ON workflow_tasks;
CREATE POLICY "Admins can manage tasks"
  ON workflow_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

-- Policies for contacts
DROP POLICY IF EXISTS "Users can view contacts" ON contacts;
CREATE POLICY "Users can view contacts"
  ON contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      LEFT JOIN app_users ON app_users.id = auth.uid()
      WHERE contacts.student_id = students.id
      AND (
        app_users.role IN ('admin', 'principal')
        OR students.teacher_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage contacts" ON contacts;
CREATE POLICY "Admins can manage contacts"
  ON contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

-- ============================================
-- 8. Create helpful views
-- ============================================

-- View for students needing review
CREATE OR REPLACE VIEW students_needing_review AS
SELECT 
  s.id,
  s.name,
  s.class,
  sp.review_frequency,
  pr.created_at as last_review_date,
  CASE 
    WHEN sp.review_frequency = 'weekly' THEN 7
    WHEN sp.review_frequency = 'biweekly' THEN 14
    ELSE 30
  END as review_interval_days,
  CURRENT_DATE - pr.created_at::date as days_since_review,
  CASE
    WHEN pr.created_at IS NULL THEN true
    WHEN CURRENT_DATE - pr.created_at::date >= CASE 
      WHEN sp.review_frequency = 'weekly' THEN 7
      WHEN sp.review_frequency = 'biweekly' THEN 14
      ELSE 30
    END THEN true
    ELSE false
  END as review_overdue
FROM students s
JOIN student_plans sp ON s.id = sp.student_id
LEFT JOIN LATERAL (
  SELECT created_at
  FROM progress_reviews
  WHERE student_id = s.id
  ORDER BY created_at DESC
  LIMIT 1
) pr ON true
WHERE s.workflow_stage = 'active_monitoring'
  AND sp.status = 'active';

-- ============================================
-- 9. Insert sample workflow stages reference
-- ============================================
-- This is just documentation, not actual data

-- Workflow Stages:
-- 1. initial_contact - First call from parent
-- 2. info_gathering - Collecting information from school
-- 3. assessment - Full evaluation (social/emotional/kriah/limud)
-- 4. plan_creation - Creating intervention plan
-- 5. plan_review - Reviewing plan with Menahel
-- 6. service_setup - Assigning tutors/therapists
-- 7. active_monitoring - Ongoing progress tracking
-- 8. plan_adjustment - Modifying plan if needed
-- 9. completed - Services successfully concluded

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Verify all tables were created
-- 2. Test with sample data
-- 3. Start using the workflow system
-- ============================================
