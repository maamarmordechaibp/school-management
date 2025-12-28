-- ============================================
-- BASE SCHEMA - Run this FIRST
-- ============================================
-- This creates the foundational tables
-- Run this BEFORE 001_workflow_system.sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create app_users table
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, principal, teacher, tutor, secretary
  assigned_class VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for app_users
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users
DROP POLICY IF EXISTS "Users can view all app_users" ON app_users;
CREATE POLICY "Users can view all app_users"
  ON app_users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage app_users" ON app_users;
CREATE POLICY "Admins can manage app_users"
  ON app_users FOR ALL
  USING (true);

-- ============================================
-- 2. Create classes table
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  teacher_id UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view classes" ON classes;
CREATE POLICY "Users can view classes"
  ON classes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (true);

-- ============================================
-- 3. Create students table
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  class VARCHAR(100),
  teacher_id UUID REFERENCES app_users(id),
  
  -- Contact information
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  father_phone VARCHAR(20),
  mother_phone VARCHAR(20),
  home_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  -- Academic tracking
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for students
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  USING (true);

-- ============================================
-- 4. Create call_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  caller_name VARCHAR(255),
  caller_phone VARCHAR(20),
  call_type VARCHAR(50),
  notes TEXT,
  logged_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_student ON call_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(created_at DESC);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view call logs" ON call_logs;
CREATE POLICY "Users can view call logs"
  ON call_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create call logs" ON call_logs;
CREATE POLICY "Users can create call logs"
  ON call_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. Create meetings table
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  attendees TEXT,
  notes TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_student ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meetings" ON meetings;
CREATE POLICY "Users can view meetings"
  ON meetings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
CREATE POLICY "Users can create meetings"
  ON meetings FOR ALL
  WITH CHECK (true);

-- ============================================
-- 6. Create assessments table
-- ============================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  assessment_type VARCHAR(100),
  
  -- Assessment fields
  social_emotional_rating VARCHAR(20),
  social_emotional_notes TEXT,
  kriah_rating VARCHAR(20),
  kriah_notes TEXT,
  limud_rating VARCHAR(20),
  limud_notes TEXT,
  
  overall_notes TEXT,
  assessed_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_student ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date DESC);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view assessments" ON assessments;
CREATE POLICY "Admins can view assessments"
  ON assessments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage assessments" ON assessments;
CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  WITH CHECK (true);

-- ============================================
-- 7. Create issues table
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issue_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(20),
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  reported_by UUID REFERENCES app_users(id),
  resolved_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_issues_student ON issues(student_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view issues" ON issues;
CREATE POLICY "Users can view issues"
  ON issues FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create issues" ON issues;
CREATE POLICY "Users can create issues"
  ON issues FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage issues" ON issues;
CREATE POLICY "Admins can manage issues"
  ON issues FOR ALL
  USING (true);

-- ============================================
-- 8. Create grades table
-- ============================================
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  grade VARCHAR(10),
  quarter VARCHAR(20),
  school_year VARCHAR(20),
  notes TEXT,
  entered_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_quarter ON grades(quarter);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view grades" ON grades;
CREATE POLICY "Users can view grades"
  ON grades FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage grades" ON grades;
CREATE POLICY "Teachers can manage grades"
  ON grades FOR ALL
  WITH CHECK (true);

-- ============================================
-- BASE SCHEMA COMPLETE!
-- ============================================
-- Next: Run 001_workflow_system.sql
-- ============================================
