-- ============================================
-- School Management Platform
-- Complete Database Schema
-- ============================================
-- Run this script in your Supabase SQL Editor
-- IMPORTANT: Backup your database first!
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & ROLES
-- ============================================

-- Main users table for all staff
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Links to Supabase auth.users
  
  -- Personal Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  name VARCHAR(200), -- Legacy field for compatibility
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  
  -- Role: admin, principal_hebrew, principal_english, teacher_hebrew, teacher_english, tutor
  role VARCHAR(50) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing app_users table
DO $$ 
BEGIN
  -- Add auth_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'auth_id') THEN
    ALTER TABLE app_users ADD COLUMN auth_id UUID UNIQUE;
  END IF;
  
  -- Add first_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'first_name') THEN
    ALTER TABLE app_users ADD COLUMN first_name VARCHAR(100);
  END IF;
  
  -- Add last_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'last_name') THEN
    ALTER TABLE app_users ADD COLUMN last_name VARCHAR(100);
  END IF;
  
  -- Add phone if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'phone') THEN
    ALTER TABLE app_users ADD COLUMN phone VARCHAR(20);
  END IF;
  
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'is_active') THEN
    ALTER TABLE app_users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Migrate name to first_name/last_name for existing records
UPDATE app_users 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), ''))
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON app_users(auth_id);

-- ============================================
-- 2. GRADES & CLASSES
-- ============================================

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50), -- e.g., "1st Grade", "2nd Grade"
  grade_number INTEGER, -- 1, 2, 3, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing grades table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'name') THEN
    ALTER TABLE grades ADD COLUMN name VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'grade_number') THEN
    ALTER TABLE grades ADD COLUMN grade_number INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'description') THEN
    ALTER TABLE grades ADD COLUMN description TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "1A", "1B", "2A"
  
  -- Assigned Teachers
  hebrew_teacher_id UUID REFERENCES app_users(id),
  english_teacher_id UUID REFERENCES app_users(id),
  
  -- Academic Year
  academic_year VARCHAR(10), -- e.g., "2024-2025"
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing classes table
DO $$ 
BEGIN
  -- Add grade_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'grade_id') THEN
    ALTER TABLE classes ADD COLUMN grade_id UUID REFERENCES grades(id) ON DELETE CASCADE;
  END IF;
  
  -- Add hebrew_teacher_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'hebrew_teacher_id') THEN
    ALTER TABLE classes ADD COLUMN hebrew_teacher_id UUID REFERENCES app_users(id);
  END IF;
  
  -- Add english_teacher_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'english_teacher_id') THEN
    ALTER TABLE classes ADD COLUMN english_teacher_id UUID REFERENCES app_users(id);
  END IF;
  
  -- Add academic_year if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'academic_year') THEN
    ALTER TABLE classes ADD COLUMN academic_year VARCHAR(10);
  END IF;
  
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'is_active') THEN
    ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'updated_at') THEN
    ALTER TABLE classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_classes_hebrew_teacher ON classes(hebrew_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_english_teacher ON classes(english_teacher_id);

-- ============================================
-- 3. STUDENTS
-- ============================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  hebrew_name VARCHAR(100),
  name VARCHAR(200), -- Legacy field for compatibility
  date_of_birth DATE,
  
  -- Class Assignment
  class_id UUID REFERENCES classes(id),
  
  -- Parent/Guardian Info
  father_name VARCHAR(100),
  father_phone VARCHAR(20),
  father_email VARCHAR(255),
  mother_name VARCHAR(100),
  mother_phone VARCHAR(20),
  mother_email VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  zip_code VARCHAR(20),
  
  -- Status
  status VARCHAR(30) DEFAULT 'active', -- active, inactive, graduated, transferred
  enrollment_date DATE DEFAULT CURRENT_DATE,
  
  -- Notes
  general_notes TEXT,
  medical_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing students table
DO $$ 
BEGIN
  -- Add first_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'first_name') THEN
    ALTER TABLE students ADD COLUMN first_name VARCHAR(100);
  END IF;
  
  -- Add last_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'last_name') THEN
    ALTER TABLE students ADD COLUMN last_name VARCHAR(100);
  END IF;
  
  -- Add hebrew_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'hebrew_name') THEN
    ALTER TABLE students ADD COLUMN hebrew_name VARCHAR(100);
  END IF;
  
  -- Add class_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_id') THEN
    ALTER TABLE students ADD COLUMN class_id UUID REFERENCES classes(id);
  END IF;
  
  -- Add father fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'father_name') THEN
    ALTER TABLE students ADD COLUMN father_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'father_phone') THEN
    ALTER TABLE students ADD COLUMN father_phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'father_email') THEN
    ALTER TABLE students ADD COLUMN father_email VARCHAR(255);
  END IF;
  
  -- Add mother fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'mother_name') THEN
    ALTER TABLE students ADD COLUMN mother_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'mother_phone') THEN
    ALTER TABLE students ADD COLUMN mother_phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'mother_email') THEN
    ALTER TABLE students ADD COLUMN mother_email VARCHAR(255);
  END IF;
  
  -- Add address fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'address') THEN
    ALTER TABLE students ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'city') THEN
    ALTER TABLE students ADD COLUMN city VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'zip_code') THEN
    ALTER TABLE students ADD COLUMN zip_code VARCHAR(20);
  END IF;
  
  -- Add status/enrollment fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'status') THEN
    ALTER TABLE students ADD COLUMN status VARCHAR(30) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'enrollment_date') THEN
    ALTER TABLE students ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add notes fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'general_notes') THEN
    ALTER TABLE students ADD COLUMN general_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'medical_notes') THEN
    ALTER TABLE students ADD COLUMN medical_notes TEXT;
  END IF;
  
  -- Add date_of_birth if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'date_of_birth') THEN
    ALTER TABLE students ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- Migrate name to first_name/last_name for existing student records
UPDATE students 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), ''))
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);

-- ============================================
-- 4. TUTOR ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS tutor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Subject: hebrew, english, math, etc.
  subject VARCHAR(50),
  
  -- Schedule
  sessions_per_week INTEGER DEFAULT 1,
  session_duration_minutes INTEGER DEFAULT 45,
  
  -- Status
  status VARCHAR(30) DEFAULT 'active', -- active, paused, completed
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tutor_assignments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'tutor_id') THEN
    ALTER TABLE tutor_assignments ADD COLUMN tutor_id UUID REFERENCES app_users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'student_id') THEN
    ALTER TABLE tutor_assignments ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'subject') THEN
    ALTER TABLE tutor_assignments ADD COLUMN subject VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'sessions_per_week') THEN
    ALTER TABLE tutor_assignments ADD COLUMN sessions_per_week INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'session_duration_minutes') THEN
    ALTER TABLE tutor_assignments ADD COLUMN session_duration_minutes INTEGER DEFAULT 45;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'status') THEN
    ALTER TABLE tutor_assignments ADD COLUMN status VARCHAR(30) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'start_date') THEN
    ALTER TABLE tutor_assignments ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'end_date') THEN
    ALTER TABLE tutor_assignments ADD COLUMN end_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'notes') THEN
    ALTER TABLE tutor_assignments ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_assignments' AND column_name = 'updated_at') THEN
    ALTER TABLE tutor_assignments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tutor_assignments_tutor ON tutor_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_student ON tutor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_status ON tutor_assignments(status);

-- ============================================
-- 5. STUDENT ISSUES / CONCERNS
-- ============================================

CREATE TABLE IF NOT EXISTS student_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Issue Details
  title VARCHAR(255),
  description TEXT,
  
  -- Category: academic, behavioral, attendance, social, health, other
  category VARCHAR(50),
  
  -- Severity: low, medium, high, critical
  severity VARCHAR(20) DEFAULT 'medium',
  
  -- Status: open, in_progress, resolved, closed
  status VARCHAR(30) DEFAULT 'open',
  
  -- Who reported it
  reported_by UUID REFERENCES app_users(id),
  
  -- Who is assigned to handle it
  assigned_to UUID REFERENCES app_users(id),
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES app_users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing student_issues table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'student_id') THEN
    ALTER TABLE student_issues ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'title') THEN
    ALTER TABLE student_issues ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'description') THEN
    ALTER TABLE student_issues ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'category') THEN
    ALTER TABLE student_issues ADD COLUMN category VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'severity') THEN
    ALTER TABLE student_issues ADD COLUMN severity VARCHAR(20) DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'status') THEN
    ALTER TABLE student_issues ADD COLUMN status VARCHAR(30) DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'reported_by') THEN
    ALTER TABLE student_issues ADD COLUMN reported_by UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'assigned_to') THEN
    ALTER TABLE student_issues ADD COLUMN assigned_to UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'resolution') THEN
    ALTER TABLE student_issues ADD COLUMN resolution TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'resolved_at') THEN
    ALTER TABLE student_issues ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'resolved_by') THEN
    ALTER TABLE student_issues ADD COLUMN resolved_by UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_issues' AND column_name = 'updated_at') THEN
    ALTER TABLE student_issues ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_issues_student ON student_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_student_issues_status ON student_issues(status);
CREATE INDEX IF NOT EXISTS idx_student_issues_category ON student_issues(category);
CREATE INDEX IF NOT EXISTS idx_student_issues_reported_by ON student_issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_student_issues_assigned_to ON student_issues(assigned_to);

-- Issue Comments (for discussion/updates)
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES student_issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing issue_comments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_comments' AND column_name = 'issue_id') THEN
    ALTER TABLE issue_comments ADD COLUMN issue_id UUID REFERENCES student_issues(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_comments' AND column_name = 'user_id') THEN
    ALTER TABLE issue_comments ADD COLUMN user_id UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_comments' AND column_name = 'comment') THEN
    ALTER TABLE issue_comments ADD COLUMN comment TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);

-- ============================================
-- 6. CALL LOGS (Parent Communication)
-- ============================================

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Call Details
  call_type VARCHAR(30) NOT NULL, -- incoming, outgoing
  contact_person VARCHAR(100) NOT NULL, -- father, mother, guardian, etc.
  phone_number VARCHAR(20),
  
  -- Content
  subject VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  
  -- Outcome
  outcome VARCHAR(50), -- reached, voicemail, no_answer, callback_needed
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Related Issue (optional)
  related_issue_id UUID REFERENCES student_issues(id),
  
  -- Who made/received the call
  logged_by UUID NOT NULL REFERENCES app_users(id),
  
  -- When
  call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing call_logs table
DO $$ 
BEGIN
  -- Add call_type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_type') THEN
    ALTER TABLE call_logs ADD COLUMN call_type VARCHAR(30);
  END IF;
  
  -- Add contact_person if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'contact_person') THEN
    ALTER TABLE call_logs ADD COLUMN contact_person VARCHAR(100);
  END IF;
  
  -- Add phone_number if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'phone_number') THEN
    ALTER TABLE call_logs ADD COLUMN phone_number VARCHAR(20);
  END IF;
  
  -- Add subject if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'subject') THEN
    ALTER TABLE call_logs ADD COLUMN subject VARCHAR(255);
  END IF;
  
  -- Add summary if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'summary') THEN
    ALTER TABLE call_logs ADD COLUMN summary TEXT;
  END IF;
  
  -- Add outcome if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'outcome') THEN
    ALTER TABLE call_logs ADD COLUMN outcome VARCHAR(50);
  END IF;
  
  -- Add follow_up_needed if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'follow_up_needed') THEN
    ALTER TABLE call_logs ADD COLUMN follow_up_needed BOOLEAN DEFAULT false;
  END IF;
  
  -- Add follow_up_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'follow_up_date') THEN
    ALTER TABLE call_logs ADD COLUMN follow_up_date DATE;
  END IF;
  
  -- Add related_issue_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'related_issue_id') THEN
    ALTER TABLE call_logs ADD COLUMN related_issue_id UUID REFERENCES student_issues(id);
  END IF;
  
  -- Add logged_by if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'logged_by') THEN
    ALTER TABLE call_logs ADD COLUMN logged_by UUID REFERENCES app_users(id);
  END IF;
  
  -- Add call_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_date') THEN
    ALTER TABLE call_logs ADD COLUMN call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add duration_minutes if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'duration_minutes') THEN
    ALTER TABLE call_logs ADD COLUMN duration_minutes INTEGER;
  END IF;
  
  -- Add student_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'student_id') THEN
    ALTER TABLE call_logs ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_call_logs_student ON call_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_logged_by ON call_logs(logged_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_follow_up ON call_logs(follow_up_needed, follow_up_date) WHERE follow_up_needed = true;

-- ============================================
-- 7. MEETINGS
-- ============================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Meeting Type: parent_teacher, principal_teacher, tutor_session, staff, other
  meeting_type VARCHAR(50),
  
  title VARCHAR(255),
  description TEXT,
  
  -- Related Student (optional - some meetings are not student-specific)
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Organizer
  organizer_id UUID REFERENCES app_users(id),
  
  -- Schedule
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  
  -- Virtual Meeting
  is_virtual BOOLEAN DEFAULT false,
  meeting_link TEXT,
  
  -- Status: scheduled, confirmed, completed, cancelled, rescheduled
  status VARCHAR(30) DEFAULT 'scheduled',
  
  -- Notes (after meeting)
  notes TEXT,
  action_items TEXT,
  
  -- Related Issue (optional)
  related_issue_id UUID REFERENCES student_issues(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing meetings table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meeting_type') THEN
    ALTER TABLE meetings ADD COLUMN meeting_type VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'title') THEN
    ALTER TABLE meetings ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'description') THEN
    ALTER TABLE meetings ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'student_id') THEN
    ALTER TABLE meetings ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'organizer_id') THEN
    ALTER TABLE meetings ADD COLUMN organizer_id UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'scheduled_date') THEN
    ALTER TABLE meetings ADD COLUMN scheduled_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'start_time') THEN
    ALTER TABLE meetings ADD COLUMN start_time TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'end_time') THEN
    ALTER TABLE meetings ADD COLUMN end_time TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'location') THEN
    ALTER TABLE meetings ADD COLUMN location VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'is_virtual') THEN
    ALTER TABLE meetings ADD COLUMN is_virtual BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meeting_link') THEN
    ALTER TABLE meetings ADD COLUMN meeting_link TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'status') THEN
    ALTER TABLE meetings ADD COLUMN status VARCHAR(30) DEFAULT 'scheduled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'notes') THEN
    ALTER TABLE meetings ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'action_items') THEN
    ALTER TABLE meetings ADD COLUMN action_items TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'related_issue_id') THEN
    ALTER TABLE meetings ADD COLUMN related_issue_id UUID REFERENCES student_issues(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'updated_at') THEN
    ALTER TABLE meetings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meetings_student ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Meeting Participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  
  -- Participant can be a user or external person
  user_id UUID REFERENCES app_users(id),
  external_name VARCHAR(100), -- For parents or external attendees
  external_email VARCHAR(255),
  external_phone VARCHAR(20),
  
  -- Role in meeting: organizer, attendee, optional
  role VARCHAR(30) DEFAULT 'attendee',
  
  -- RSVP: pending, accepted, declined, tentative
  rsvp_status VARCHAR(30) DEFAULT 'pending',
  
  attended BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing meeting_participants table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'meeting_id') THEN
    ALTER TABLE meeting_participants ADD COLUMN meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'user_id') THEN
    ALTER TABLE meeting_participants ADD COLUMN user_id UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'external_name') THEN
    ALTER TABLE meeting_participants ADD COLUMN external_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'external_email') THEN
    ALTER TABLE meeting_participants ADD COLUMN external_email VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'external_phone') THEN
    ALTER TABLE meeting_participants ADD COLUMN external_phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'role') THEN
    ALTER TABLE meeting_participants ADD COLUMN role VARCHAR(30) DEFAULT 'attendee';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'rsvp_status') THEN
    ALTER TABLE meeting_participants ADD COLUMN rsvp_status VARCHAR(30) DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_participants' AND column_name = 'attended') THEN
    ALTER TABLE meeting_participants ADD COLUMN attended BOOLEAN;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);

-- ============================================
-- 8. BOOKS & INVENTORY
-- ============================================

-- Book Catalog
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  author VARCHAR(255),
  isbn VARCHAR(20),
  publisher VARCHAR(255),
  
  -- Category: textbook, workbook, hebrew, english, math, science, etc.
  category VARCHAR(50),
  
  -- Subject: hebrew, english, math, science, history, etc.
  subject VARCHAR(50),
  
  -- Price
  price DECIMAL(10, 2),
  
  -- Inventory
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 10,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing books table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'title') THEN
    ALTER TABLE books ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'subtitle') THEN
    ALTER TABLE books ADD COLUMN subtitle VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'author') THEN
    ALTER TABLE books ADD COLUMN author VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'isbn') THEN
    ALTER TABLE books ADD COLUMN isbn VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'publisher') THEN
    ALTER TABLE books ADD COLUMN publisher VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'category') THEN
    ALTER TABLE books ADD COLUMN category VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'subject') THEN
    ALTER TABLE books ADD COLUMN subject VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'price') THEN
    ALTER TABLE books ADD COLUMN price DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'quantity_in_stock') THEN
    ALTER TABLE books ADD COLUMN quantity_in_stock INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'reorder_threshold') THEN
    ALTER TABLE books ADD COLUMN reorder_threshold INTEGER DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'is_active') THEN
    ALTER TABLE books ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'updated_at') THEN
    ALTER TABLE books ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);

-- Grade Book Requirements (which books each grade needs)
CREATE TABLE IF NOT EXISTS grade_book_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  
  -- Is this book required or optional?
  is_required BOOLEAN DEFAULT true,
  
  -- For which academic year
  academic_year VARCHAR(10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing grade_book_requirements table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grade_book_requirements' AND column_name = 'grade_id') THEN
    ALTER TABLE grade_book_requirements ADD COLUMN grade_id UUID REFERENCES grades(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grade_book_requirements' AND column_name = 'book_id') THEN
    ALTER TABLE grade_book_requirements ADD COLUMN book_id UUID REFERENCES books(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grade_book_requirements' AND column_name = 'is_required') THEN
    ALTER TABLE grade_book_requirements ADD COLUMN is_required BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grade_book_requirements' AND column_name = 'academic_year') THEN
    ALTER TABLE grade_book_requirements ADD COLUMN academic_year VARCHAR(10);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grade_book_requirements_grade ON grade_book_requirements(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_book_requirements_book ON grade_book_requirements(book_id);

-- Student Books (what books each student has/needs)
CREATE TABLE IF NOT EXISTS student_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  
  -- Status: needed, has_own, purchased, received
  status VARCHAR(30) DEFAULT 'needed',
  
  -- If they have their own (used book)
  has_own_copy BOOLEAN DEFAULT false,
  
  -- If purchased through school
  purchase_date DATE,
  amount_charged DECIMAL(10, 2),
  
  -- Academic Year
  academic_year VARCHAR(10),
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing student_books table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'student_id') THEN
    ALTER TABLE student_books ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'book_id') THEN
    ALTER TABLE student_books ADD COLUMN book_id UUID REFERENCES books(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'status') THEN
    ALTER TABLE student_books ADD COLUMN status VARCHAR(30) DEFAULT 'needed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'has_own_copy') THEN
    ALTER TABLE student_books ADD COLUMN has_own_copy BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'purchase_date') THEN
    ALTER TABLE student_books ADD COLUMN purchase_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'amount_charged') THEN
    ALTER TABLE student_books ADD COLUMN amount_charged DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'academic_year') THEN
    ALTER TABLE student_books ADD COLUMN academic_year VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'notes') THEN
    ALTER TABLE student_books ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_books' AND column_name = 'updated_at') THEN
    ALTER TABLE student_books ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_books_student ON student_books(student_id);
CREATE INDEX IF NOT EXISTS idx_student_books_book ON student_books(book_id);
CREATE INDEX IF NOT EXISTS idx_student_books_status ON student_books(status);

-- ============================================
-- 9. FEES & PAYMENTS
-- ============================================

-- Fee Types (trips, events, supplies, etc.)
CREATE TABLE IF NOT EXISTS fee_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255),
  description TEXT,
  
  -- Category: trip, event, supplies, books, other
  category VARCHAR(50),
  
  -- Default amount (can be overridden per fee)
  default_amount DECIMAL(10, 2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing fee_types table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'name') THEN
    ALTER TABLE fee_types ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'description') THEN
    ALTER TABLE fee_types ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'category') THEN
    ALTER TABLE fee_types ADD COLUMN category VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'default_amount') THEN
    ALTER TABLE fee_types ADD COLUMN default_amount DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'is_active') THEN
    ALTER TABLE fee_types ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Fees (specific fee instances)
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_type_id UUID REFERENCES fee_types(id),
  
  name VARCHAR(255),
  description TEXT,
  amount DECIMAL(10, 2),
  
  -- Scope: school_wide, grade_specific, class_specific, student_specific
  scope VARCHAR(30),
  
  -- If grade or class specific
  grade_id UUID REFERENCES grades(id),
  class_id UUID REFERENCES classes(id),
  
  -- Due date
  due_date DATE,
  
  -- Status: active, cancelled, completed
  status VARCHAR(30) DEFAULT 'active',
  
  -- Academic Year
  academic_year VARCHAR(10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing fees table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'fee_type_id') THEN
    ALTER TABLE fees ADD COLUMN fee_type_id UUID REFERENCES fee_types(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'name') THEN
    ALTER TABLE fees ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'description') THEN
    ALTER TABLE fees ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'amount') THEN
    ALTER TABLE fees ADD COLUMN amount DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'scope') THEN
    ALTER TABLE fees ADD COLUMN scope VARCHAR(30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'grade_id') THEN
    ALTER TABLE fees ADD COLUMN grade_id UUID REFERENCES grades(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'class_id') THEN
    ALTER TABLE fees ADD COLUMN class_id UUID REFERENCES classes(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'due_date') THEN
    ALTER TABLE fees ADD COLUMN due_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'status') THEN
    ALTER TABLE fees ADD COLUMN status VARCHAR(30) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'academic_year') THEN
    ALTER TABLE fees ADD COLUMN academic_year VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'updated_at') THEN
    ALTER TABLE fees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fees_fee_type ON fees(fee_type_id);
CREATE INDEX IF NOT EXISTS idx_fees_scope ON fees(scope);
CREATE INDEX IF NOT EXISTS idx_fees_grade ON fees(grade_id);
CREATE INDEX IF NOT EXISTS idx_fees_class ON fees(class_id);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees(due_date);

-- Student Fees (which fees apply to which students)
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
  
  -- Amount for this student (may differ if partial/discount)
  amount DECIMAL(10, 2),
  
  -- Amount paid so far
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  
  -- Status: pending, partial, paid, waived, overdue
  status VARCHAR(30) DEFAULT 'pending',
  
  -- If waived
  waived_by UUID REFERENCES app_users(id),
  waived_reason TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, fee_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee ON student_fees(fee_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);

-- Add missing columns to existing student_fees table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'student_id') THEN
    ALTER TABLE student_fees ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'fee_id') THEN
    ALTER TABLE student_fees ADD COLUMN fee_id UUID REFERENCES fees(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'amount') THEN
    ALTER TABLE student_fees ADD COLUMN amount DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'amount_paid') THEN
    ALTER TABLE student_fees ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'status') THEN
    ALTER TABLE student_fees ADD COLUMN status VARCHAR(30) DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'waived_by') THEN
    ALTER TABLE student_fees ADD COLUMN waived_by UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'waived_reason') THEN
    ALTER TABLE student_fees ADD COLUMN waived_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'notes') THEN
    ALTER TABLE student_fees ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fees' AND column_name = 'updated_at') THEN
    ALTER TABLE student_fees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- What this payment is for
  student_fee_id UUID REFERENCES student_fees(id), -- For fee payments
  description VARCHAR(255), -- For general payments
  
  -- Amount
  amount DECIMAL(10, 2),
  
  -- Payment method: cash, check, credit_card, bank_transfer, other
  payment_method VARCHAR(30),
  
  -- Reference number (check number, transaction ID, etc.)
  reference_number VARCHAR(100),
  
  -- Payment date
  payment_date DATE DEFAULT CURRENT_DATE,
  
  -- Received by
  received_by UUID REFERENCES app_users(id),
  
  -- Receipt
  receipt_number VARCHAR(50),
  receipt_sent BOOLEAN DEFAULT false,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing payments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'student_id') THEN
    ALTER TABLE payments ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'student_fee_id') THEN
    ALTER TABLE payments ADD COLUMN student_fee_id UUID REFERENCES student_fees(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'description') THEN
    ALTER TABLE payments ADD COLUMN description VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'amount') THEN
    ALTER TABLE payments ADD COLUMN amount DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
    ALTER TABLE payments ADD COLUMN payment_method VARCHAR(30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reference_number') THEN
    ALTER TABLE payments ADD COLUMN reference_number VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
    ALTER TABLE payments ADD COLUMN payment_date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'received_by') THEN
    ALTER TABLE payments ADD COLUMN received_by UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'receipt_number') THEN
    ALTER TABLE payments ADD COLUMN receipt_number VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'receipt_sent') THEN
    ALTER TABLE payments ADD COLUMN receipt_sent BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'notes') THEN
    ALTER TABLE payments ADD COLUMN notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_fee ON payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);

-- ============================================
-- 10. ACTIVITY LOG (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who performed the action
  user_id UUID REFERENCES app_users(id),
  
  -- What action: create, update, delete, view, login, etc.
  action VARCHAR(50),
  
  -- What entity: student, issue, call_log, meeting, payment, etc.
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Related student (for easy filtering)
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Details (JSON for flexibility)
  details JSONB,
  
  -- IP Address
  ip_address INET,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing activity_log table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'user_id') THEN
    ALTER TABLE activity_log ADD COLUMN user_id UUID REFERENCES app_users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'action') THEN
    ALTER TABLE activity_log ADD COLUMN action VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'entity_type') THEN
    ALTER TABLE activity_log ADD COLUMN entity_type VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'entity_id') THEN
    ALTER TABLE activity_log ADD COLUMN entity_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'student_id') THEN
    ALTER TABLE activity_log ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'details') THEN
    ALTER TABLE activity_log ADD COLUMN details JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'ip_address') THEN
    ALTER TABLE activity_log ADD COLUMN ip_address INET;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_student ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_book_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  -- Try to get role by auth_id first
  SELECT role INTO v_role FROM app_users WHERE auth_id = auth.uid();
  
  -- If not found, try by id (for edge function created users)
  IF v_role IS NULL THEN
    SELECT role INTO v_role FROM app_users WHERE id = auth.uid();
  END IF;
  
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin/principal
CREATE OR REPLACE FUNCTION is_admin_or_principal()
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  v_role := get_current_user_role();
  RETURN v_role IN ('admin', 'principal_hebrew', 'principal_english', 'principal', 'principal_curriculum');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's app_users id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get id by auth_id first
  SELECT id INTO v_user_id FROM app_users WHERE auth_id = auth.uid();
  
  -- If not found, try by id (for edge function created users)
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM app_users WHERE id = auth.uid();
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STUDENTS POLICIES
-- ============================================

-- Admins/Principals can see all students
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (is_admin_or_principal());

-- Teachers can see students in their classes
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = students.class_id
      AND (c.hebrew_teacher_id = get_current_user_id() OR c.english_teacher_id = get_current_user_id())
    )
  );

-- Tutors can see their assigned students
DROP POLICY IF EXISTS "Tutors can view assigned students" ON students;
CREATE POLICY "Tutors can view assigned students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_assignments ta
      WHERE ta.student_id = students.id
      AND ta.tutor_id = get_current_user_id()
      AND ta.status = 'active'
    )
  );

-- Admins can manage students
DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  USING (is_admin_or_principal());

-- ============================================
-- STUDENT ISSUES POLICIES
-- ============================================

-- Admins can see all issues
DROP POLICY IF EXISTS "Admins can view all issues" ON student_issues;
CREATE POLICY "Admins can view all issues"
  ON student_issues FOR SELECT
  USING (is_admin_or_principal());

-- Teachers can see issues for their students
DROP POLICY IF EXISTS "Teachers can view their students issues" ON student_issues;
CREATE POLICY "Teachers can view their students issues"
  ON student_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = student_issues.student_id
      AND (c.hebrew_teacher_id = get_current_user_id() OR c.english_teacher_id = get_current_user_id())
    )
  );

-- Tutors can see issues for their students (limited visibility)
DROP POLICY IF EXISTS "Tutors can view assigned students issues" ON student_issues;
CREATE POLICY "Tutors can view assigned students issues"
  ON student_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_assignments ta
      WHERE ta.student_id = student_issues.student_id
      AND ta.tutor_id = get_current_user_id()
      AND ta.status = 'active'
    )
    -- Tutors can only see academic issues related to their subject
    AND category = 'academic'
  );

-- Users can see issues they reported or are assigned to
DROP POLICY IF EXISTS "Users can view their issues" ON student_issues;
CREATE POLICY "Users can view their issues"
  ON student_issues FOR SELECT
  USING (
    student_issues.reported_by = get_current_user_id() 
    OR student_issues.assigned_to = get_current_user_id()
  );

-- Anyone can create issues
DROP POLICY IF EXISTS "Users can create issues" ON student_issues;
CREATE POLICY "Users can create issues"
  ON student_issues FOR INSERT
  WITH CHECK (get_current_user_id() IS NOT NULL);

-- Admins can update issues
DROP POLICY IF EXISTS "Admins can update issues" ON student_issues;
CREATE POLICY "Admins can update issues"
  ON student_issues FOR UPDATE
  USING (is_admin_or_principal());

-- ============================================
-- CALL LOGS POLICIES
-- ============================================

-- Admins can see all call logs
DROP POLICY IF EXISTS "Admins can view all call logs" ON call_logs;
CREATE POLICY "Admins can view all call logs"
  ON call_logs FOR SELECT
  USING (is_admin_or_principal());

-- Teachers can see call logs for their students
DROP POLICY IF EXISTS "Teachers can view their students call logs" ON call_logs;
CREATE POLICY "Teachers can view their students call logs"
  ON call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = call_logs.student_id
      AND (c.hebrew_teacher_id = get_current_user_id() OR c.english_teacher_id = get_current_user_id())
    )
  );

-- Users can see their own call logs
DROP POLICY IF EXISTS "Users can view own call logs" ON call_logs;
CREATE POLICY "Users can view own call logs"
  ON call_logs FOR SELECT
  USING (call_logs.logged_by = get_current_user_id());

-- Users can create call logs
DROP POLICY IF EXISTS "Users can create call logs" ON call_logs;
CREATE POLICY "Users can create call logs"
  ON call_logs FOR INSERT
  WITH CHECK (get_current_user_id() IS NOT NULL);

-- ============================================
-- MEETINGS POLICIES
-- ============================================

-- Admins can see all meetings
DROP POLICY IF EXISTS "Admins can view all meetings" ON meetings;
CREATE POLICY "Admins can view all meetings"
  ON meetings FOR SELECT
  USING (is_admin_or_principal());

-- Users can see meetings they organize or participate in
DROP POLICY IF EXISTS "Users can view their meetings" ON meetings;
CREATE POLICY "Users can view their meetings"
  ON meetings FOR SELECT
  USING (
    meetings.organizer_id = get_current_user_id()
    OR EXISTS (
      SELECT 1 FROM meeting_participants mp
      WHERE mp.meeting_id = meetings.id
      AND mp.user_id = get_current_user_id()
    )
  );

-- Users can create meetings
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (get_current_user_id() IS NOT NULL);

-- Organizers and admins can update meetings
DROP POLICY IF EXISTS "Organizers can update meetings" ON meetings;
CREATE POLICY "Organizers can update meetings"
  ON meetings FOR UPDATE
  USING (
    is_admin_or_principal()
    OR meetings.organizer_id = get_current_user_id()
  );

-- ============================================
-- BOOKS & PAYMENTS POLICIES (Admin Only for Management)
-- ============================================

-- Everyone can view books
DROP POLICY IF EXISTS "Everyone can view books" ON books;
CREATE POLICY "Everyone can view books"
  ON books FOR SELECT
  USING (get_current_user_id() IS NOT NULL);

-- Admins can manage books
DROP POLICY IF EXISTS "Admins can manage books" ON books;
CREATE POLICY "Admins can manage books"
  ON books FOR ALL
  USING (is_admin_or_principal());

-- Everyone can view grade book requirements
DROP POLICY IF EXISTS "Everyone can view grade book requirements" ON grade_book_requirements;
CREATE POLICY "Everyone can view grade book requirements"
  ON grade_book_requirements FOR SELECT
  USING (get_current_user_id() IS NOT NULL);

-- Admins can manage grade book requirements
DROP POLICY IF EXISTS "Admins can manage grade book requirements" ON grade_book_requirements;
CREATE POLICY "Admins can manage grade book requirements"
  ON grade_book_requirements FOR ALL
  USING (is_admin_or_principal());

-- Admins can view/manage all student books
DROP POLICY IF EXISTS "Admins can manage student books" ON student_books;
CREATE POLICY "Admins can manage student books"
  ON student_books FOR ALL
  USING (is_admin_or_principal());

-- Admins can manage fees
DROP POLICY IF EXISTS "Admins can manage fee types" ON fee_types;
CREATE POLICY "Admins can manage fee types"
  ON fee_types FOR ALL
  USING (is_admin_or_principal());

DROP POLICY IF EXISTS "Admins can manage fees" ON fees;
CREATE POLICY "Admins can manage fees"
  ON fees FOR ALL
  USING (is_admin_or_principal());

DROP POLICY IF EXISTS "Admins can manage student fees" ON student_fees;
CREATE POLICY "Admins can manage student fees"
  ON student_fees FOR ALL
  USING (is_admin_or_principal());

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (is_admin_or_principal());

-- ============================================
-- 13. USEFUL VIEWS
-- ============================================

-- View: Students with outstanding book fees
CREATE OR REPLACE VIEW student_book_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  c.name as class_name,
  g.name as grade_name,
  COUNT(sb.id) as total_books_needed,
  COUNT(CASE WHEN sb.has_own_copy THEN 1 END) as books_owned,
  COUNT(CASE WHEN sb.status = 'purchased' THEN 1 END) as books_purchased,
  COALESCE(SUM(CASE WHEN NOT sb.has_own_copy AND sb.status = 'needed' THEN b.price ELSE 0 END), 0) as amount_owed_for_books
FROM students s
JOIN classes c ON c.id = s.class_id
JOIN grades g ON g.id = c.grade_id
LEFT JOIN student_books sb ON sb.student_id = s.id
LEFT JOIN books b ON b.id = sb.book_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, c.name, g.name;

-- View: Outstanding fees summary per student
CREATE OR REPLACE VIEW student_fees_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  c.name as class_name,
  COUNT(sf.id) as total_fees,
  COUNT(CASE WHEN sf.status = 'pending' OR sf.status = 'partial' THEN 1 END) as unpaid_fees,
  COALESCE(SUM(sf.amount), 0) as total_amount,
  COALESCE(SUM(sf.amount_paid), 0) as total_paid,
  COALESCE(SUM(sf.amount - sf.amount_paid), 0) as total_outstanding
FROM students s
JOIN classes c ON c.id = s.class_id
LEFT JOIN student_fees sf ON sf.student_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, c.name;

-- View: Books to order (low stock or needed)
CREATE OR REPLACE VIEW books_to_order AS
SELECT 
  b.id as book_id,
  b.title,
  b.category,
  b.quantity_in_stock,
  b.reorder_threshold,
  COUNT(sb.id) as students_needing,
  GREATEST(COUNT(sb.id) - b.quantity_in_stock, 0) as quantity_to_order,
  b.price,
  GREATEST(COUNT(sb.id) - b.quantity_in_stock, 0) * b.price as total_cost
FROM books b
LEFT JOIN student_books sb ON sb.book_id = b.id 
  AND sb.status = 'needed' 
  AND NOT sb.has_own_copy
WHERE b.is_active = true
GROUP BY b.id, b.title, b.category, b.quantity_in_stock, b.reorder_threshold, b.price
HAVING b.quantity_in_stock < b.reorder_threshold 
   OR COUNT(sb.id) > b.quantity_in_stock;

-- View: Fee collection status for a fee
CREATE OR REPLACE VIEW fee_collection_status AS
SELECT 
  f.id as fee_id,
  f.name as fee_name,
  f.amount as fee_amount,
  f.scope,
  f.due_date,
  COUNT(sf.id) as total_students,
  COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partial_count,
  COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN sf.status = 'waived' THEN 1 END) as waived_count,
  COALESCE(SUM(sf.amount), 0) as total_expected,
  COALESCE(SUM(sf.amount_paid), 0) as total_collected,
  COALESCE(SUM(sf.amount - sf.amount_paid), 0) as total_outstanding
FROM fees f
LEFT JOIN student_fees sf ON sf.fee_id = f.id
GROUP BY f.id, f.name, f.amount, f.scope, f.due_date;

-- ============================================
-- 14. HELPER FUNCTIONS
-- ============================================

-- Function to auto-assign books to students based on grade requirements
CREATE OR REPLACE FUNCTION assign_books_to_student(
  p_student_id UUID,
  p_academic_year VARCHAR(10)
)
RETURNS INTEGER AS $$
DECLARE
  v_grade_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Get student's grade
  SELECT g.id INTO v_grade_id
  FROM students s
  JOIN classes c ON c.id = s.class_id
  JOIN grades g ON g.id = c.grade_id
  WHERE s.id = p_student_id;
  
  IF v_grade_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Insert book requirements for the student
  INSERT INTO student_books (student_id, book_id, status, academic_year)
  SELECT p_student_id, gbr.book_id, 'needed', p_academic_year
  FROM grade_book_requirements gbr
  WHERE gbr.grade_id = v_grade_id
  AND gbr.academic_year = p_academic_year
  ON CONFLICT (student_id, book_id, academic_year) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign a fee to all applicable students
CREATE OR REPLACE FUNCTION assign_fee_to_students(p_fee_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_fee RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_fee FROM fees WHERE id = p_fee_id;
  
  IF v_fee IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Assign based on scope
  IF v_fee.scope = 'school_wide' THEN
    INSERT INTO student_fees (student_id, fee_id, amount)
    SELECT s.id, p_fee_id, v_fee.amount
    FROM students s
    WHERE s.status = 'active'
    ON CONFLICT (student_id, fee_id) DO NOTHING;
    
  ELSIF v_fee.scope = 'grade_specific' AND v_fee.grade_id IS NOT NULL THEN
    INSERT INTO student_fees (student_id, fee_id, amount)
    SELECT s.id, p_fee_id, v_fee.amount
    FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE c.grade_id = v_fee.grade_id
    AND s.status = 'active'
    ON CONFLICT (student_id, fee_id) DO NOTHING;
    
  ELSIF v_fee.scope = 'class_specific' AND v_fee.class_id IS NOT NULL THEN
    INSERT INTO student_fees (student_id, fee_id, amount)
    SELECT s.id, p_fee_id, v_fee.amount
    FROM students s
    WHERE s.class_id = v_fee.class_id
    AND s.status = 'active'
    ON CONFLICT (student_id, fee_id) DO NOTHING;
  END IF;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate student's book cost
CREATE OR REPLACE FUNCTION calculate_student_book_cost(
  p_student_id UUID,
  p_academic_year VARCHAR(10)
)
RETURNS DECIMAL AS $$
DECLARE
  v_total DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(b.price), 0) INTO v_total
  FROM student_books sb
  JOIN books b ON b.id = sb.book_id
  WHERE sb.student_id = p_student_id
  AND sb.academic_year = p_academic_year
  AND sb.status = 'needed'
  AND sb.has_own_copy = false;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 15. TRIGGERS
-- ============================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_student_issues_updated_at ON student_issues;
CREATE TRIGGER update_student_issues_updated_at
  BEFORE UPDATE ON student_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_student_fees_updated_at ON student_fees;
CREATE TRIGGER update_student_fees_updated_at
  BEFORE UPDATE ON student_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to update student_fees status based on payment
CREATE OR REPLACE FUNCTION update_student_fee_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the student_fee amount_paid and status
  UPDATE student_fees
  SET 
    amount_paid = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payments 
      WHERE student_fee_id = NEW.student_fee_id
    ),
    status = CASE
      WHEN amount <= (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_fee_id = NEW.student_fee_id) THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_fee_id = NEW.student_fee_id) > 0 THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.student_fee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fee_on_payment ON payments;
CREATE TRIGGER update_fee_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.student_fee_id IS NOT NULL)
  EXECUTE FUNCTION update_student_fee_status();

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- 
-- Summary of tables created:
-- - app_users: All staff (admins, principals, teachers, tutors)
-- - grades: Grade levels
-- - classes: Class sections with assigned teachers
-- - students: Student information
-- - tutor_assignments: Tutor-student relationships
-- - student_issues: Issue tracking
-- - issue_comments: Discussion on issues
-- - call_logs: Parent communication logs
-- - meetings: Meeting scheduling
-- - meeting_participants: Meeting attendees
-- - books: Book catalog
-- - grade_book_requirements: Books per grade
-- - student_books: Student book tracking
-- - fee_types: Fee categories
-- - fees: Specific fees
-- - student_fees: Student fee assignments
-- - payments: Payment records
-- - activity_log: Audit trail
--
-- Views created:
-- - student_book_summary
-- - student_fees_summary
-- - books_to_order
-- - fee_collection_status
--
-- ============================================
