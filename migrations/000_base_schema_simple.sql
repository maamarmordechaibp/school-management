-- ============================================
-- BASE SCHEMA - SIMPLIFIED VERSION
-- ============================================
-- Run this FIRST - No RLS policies
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- ============================================
-- 1. Create app_users table
-- ============================================
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned_class VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role);

-- ============================================
-- 2. Create classes table
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  teacher_id UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classes_teacher ON classes(teacher_id);

-- ============================================
-- 3. Create students table
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  class VARCHAR(100),
  teacher_id UUID REFERENCES app_users(id),
  
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  father_phone VARCHAR(20),
  mother_phone VARCHAR(20),
  home_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_teacher ON students(teacher_id);
CREATE INDEX idx_students_status ON students(status);

-- ============================================
-- 4. Create call_logs table
-- ============================================
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  caller_name VARCHAR(255),
  caller_phone VARCHAR(20),
  call_type VARCHAR(50),
  notes TEXT,
  logged_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_logs_student ON call_logs(student_id);
CREATE INDEX idx_call_logs_date ON call_logs(created_at DESC);

-- ============================================
-- 5. Create meetings table
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  attendees TEXT,
  notes TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meetings_student ON meetings(student_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date DESC);

-- ============================================
-- 6. Create assessments table
-- ============================================
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  assessment_type VARCHAR(100),
  
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

CREATE INDEX idx_assessments_student ON assessments(student_id);
CREATE INDEX idx_assessments_date ON assessments(assessment_date DESC);

-- ============================================
-- 7. Create issues table
-- ============================================
CREATE TABLE issues (
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

CREATE INDEX idx_issues_student ON issues(student_id);
CREATE INDEX idx_issues_status ON issues(status);

-- ============================================
-- 8. Create grades table
-- ============================================
CREATE TABLE grades (
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

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_quarter ON grades(quarter);

-- ============================================
-- BASE SCHEMA COMPLETE!
-- ============================================
