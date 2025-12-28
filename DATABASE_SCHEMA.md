# Database Schema for Workflow Management System

This document outlines the new database tables required to support the student workflow management system.

## New Tables Required

### 1. student_plans

This table stores individualized intervention plans for students.

```sql
CREATE TABLE student_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Plan Details
  goals TEXT NOT NULL, -- Overall goals and objectives
  social_emotional_notes TEXT,
  kriah_notes TEXT, -- Reading assessment notes
  limud_notes TEXT, -- Learning assessment notes
  
  -- Interventions (stored as JSONB array)
  interventions JSONB DEFAULT '[]'::jsonb,
  -- Each intervention object: { type, description, frequency, tutor_id, goals }
  
  -- Review Settings
  review_frequency VARCHAR(20) DEFAULT 'monthly', -- weekly, biweekly, monthly
  
  -- Status & Tracking
  status VARCHAR(30) DEFAULT 'draft', -- draft, pending_review, approved, active, needs_adjustment
  created_by UUID REFERENCES app_users(id),
  reviewed_by UUID REFERENCES app_users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_student_plans_student_id ON student_plans(student_id);
CREATE INDEX idx_student_plans_status ON student_plans(status);
CREATE INDEX idx_student_plans_created_at ON student_plans(created_at DESC);
```

### 2. progress_reviews

This table stores regular progress reviews for students in active monitoring.

```sql
CREATE TABLE progress_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Review Details
  progress_rating VARCHAR(20) NOT NULL, -- excellent, good, fair, poor
  attendance_status VARCHAR(20), -- excellent, good, fair, poor
  notes TEXT,
  concerns TEXT,
  
  -- Action Flags
  action_needed BOOLEAN DEFAULT false,
  escalate_to_mz BOOLEAN DEFAULT false, -- Flag for M.Z. to adjust plan
  
  -- Tracking
  reviewed_by UUID REFERENCES app_users(id),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progress_reviews_student_id ON progress_reviews(student_id);
CREATE INDEX idx_progress_reviews_created_at ON progress_reviews(created_at DESC);
CREATE INDEX idx_progress_reviews_escalate ON progress_reviews(escalate_to_mz) WHERE escalate_to_mz = true;
CREATE INDEX idx_progress_reviews_rating ON progress_reviews(progress_rating);
```

### 3. workflow_tasks (Optional - for detailed task tracking)

This table can be used to track individual tasks within the workflow.

```sql
CREATE TABLE workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Task Details
  task_type VARCHAR(50) NOT NULL, -- 'call_parent', 'gather_info', 'assessment', 'create_plan', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES app_users(id),
  due_date DATE,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_tasks_student_id ON workflow_tasks(student_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_due_date ON workflow_tasks(due_date);
```

## Updates to Existing Tables

### students table

Add these columns to track workflow status:

```sql
-- Add to existing students table
ALTER TABLE students 
  ADD COLUMN workflow_stage VARCHAR(50) DEFAULT 'initial_contact',
  ADD COLUMN assigned_to UUID REFERENCES app_users(id),
  ADD COLUMN intake_date DATE DEFAULT CURRENT_DATE;

-- Create index for workflow queries
CREATE INDEX idx_students_workflow_stage ON students(workflow_stage);
CREATE INDEX idx_students_assigned_to ON students(assigned_to);

-- Workflow stages:
-- - initial_contact
-- - info_gathering
-- - assessment
-- - plan_creation
-- - plan_review
-- - service_setup
-- - active_monitoring
-- - plan_adjustment
-- - completed
```

### contacts table (if not exists)

For managing multiple contacts per student:

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(50), -- father, mother, guardian, etc.
  phone VARCHAR(20),
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_student_id ON contacts(student_id);
```

## Row Level Security (RLS)

Enable RLS on all new tables and create appropriate policies:

```sql
-- Enable RLS
ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth setup)
-- Admins and Principals can see all
CREATE POLICY "Admins can view all plans"
  ON student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'principal')
    )
  );

-- Teachers can see plans for their students
CREATE POLICY "Teachers can view their students' plans"
  ON student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_plans.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Similar policies for progress_reviews and workflow_tasks
```

## Sample Queries

### Get students needing review

```sql
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
  CURRENT_DATE - pr.created_at::date as days_since_review
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
  AND (
    pr.created_at IS NULL 
    OR CURRENT_DATE - pr.created_at::date >= CASE 
      WHEN sp.review_frequency = 'weekly' THEN 7
      WHEN sp.review_frequency = 'biweekly' THEN 14
      ELSE 30
    END
  );
```

### Get students needing plan adjustment

```sql
SELECT DISTINCT
  s.id,
  s.name,
  s.class,
  pr.progress_rating,
  pr.concerns,
  pr.created_at as review_date
FROM students s
JOIN progress_reviews pr ON s.id = pr.student_id
WHERE pr.escalate_to_mz = true
  AND s.workflow_stage != 'plan_adjustment'
ORDER BY pr.created_at DESC;
```

### Get workflow statistics

```sql
SELECT 
  workflow_stage,
  COUNT(*) as student_count,
  AVG(CURRENT_DATE - intake_date) as avg_days_in_workflow
FROM students
WHERE workflow_stage != 'completed'
GROUP BY workflow_stage
ORDER BY 
  CASE workflow_stage
    WHEN 'initial_contact' THEN 1
    WHEN 'info_gathering' THEN 2
    WHEN 'assessment' THEN 3
    WHEN 'plan_creation' THEN 4
    WHEN 'plan_review' THEN 5
    WHEN 'service_setup' THEN 6
    WHEN 'active_monitoring' THEN 7
    WHEN 'plan_adjustment' THEN 8
  END;
```

## Migration Steps

1. **Backup your database** before making any changes
2. Run the CREATE TABLE statements for new tables
3. Run the ALTER TABLE statements for existing tables
4. Set up Row Level Security policies
5. Test with sample data
6. Update the application to use the new schema

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- JSON is used for the `interventions` field to allow flexible structure
- Indexes are created on commonly queried fields
- Foreign keys include `ON DELETE CASCADE` to maintain referential integrity
- RLS policies should be customized based on your authentication setup
