-- =====================================================
-- Migration 011: Comprehensive Features
-- Adds tables for: Special Education, Attendance/Late Tracking,
-- Bus Changes, Student Communication Notes, Reminders, Class Notes
-- =====================================================

-- =====================================================
-- 1. STUDENT COMMUNICATION NOTES (מנהל ה, ו, ז)
-- Every conversation about/with a student is logged with date
-- Supports EDIT mode (replaces) and UPDATE mode (appends)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'call', 'meeting', 'observation', 'parent_contact', 'teacher_report'
  title TEXT,
  content TEXT NOT NULL,
  previous_content TEXT, -- Stores old content when using EDIT mode (for audit trail)
  edit_mode TEXT DEFAULT 'update', -- 'edit' = replaces, 'update' = appends
  created_by UUID REFERENCES app_users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_type ON student_notes(note_type);

-- =====================================================
-- 2. CLASS NOTES (מנהל ד)
-- Notes per class, e.g. from sitting with a melamed
-- =====================================================
CREATE TABLE IF NOT EXISTS class_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  previous_content TEXT,
  edit_mode TEXT DEFAULT 'update',
  created_by UUID REFERENCES app_users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_class_notes_class ON class_notes(class_id);

-- =====================================================
-- 3. LATE ARRIVALS TRACKING (סגן מנהל א)
-- Track students who come late, can print slips
-- =====================================================
CREATE TABLE IF NOT EXISTS late_arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIME,
  minutes_late INTEGER,
  reason TEXT,
  slip_printed BOOLEAN DEFAULT FALSE,
  slip_given_to_teacher BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_late_arrivals_student ON late_arrivals(student_id);
CREATE INDEX IF NOT EXISTS idx_late_arrivals_date ON late_arrivals(date);

-- =====================================================
-- 4. BUS CHANGES (סגן מנהל ב)
-- Track bus route changes, printable
-- =====================================================
CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name TEXT NOT NULL,
  route_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_bus_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bus_route_id UUID REFERENCES bus_routes(id),
  pickup_address TEXT,
  pickup_time TIME,
  dropoff_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  original_bus_id UUID REFERENCES bus_routes(id),
  new_bus_id UUID REFERENCES bus_routes(id),
  change_type TEXT NOT NULL DEFAULT 'temporary', -- 'temporary', 'permanent', 'one_time'
  reason TEXT,
  pickup_address TEXT, -- Override address for this change
  parent_notified BOOLEAN DEFAULT FALSE,
  driver_notified BOOLEAN DEFAULT FALSE,
  printed BOOLEAN DEFAULT FALSE,
  effective_from DATE,
  effective_until DATE,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bus_changes_date ON bus_changes(change_date);
CREATE INDEX IF NOT EXISTS idx_bus_changes_student ON bus_changes(student_id);

-- =====================================================
-- 5. SPECIAL EDUCATION (חינוך מיוחד) - COMPLETE
-- =====================================================

-- 5a. Special Ed Student Status - which kids have help
CREATE TABLE IF NOT EXISTS special_ed_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'monitoring', -- 'monitoring', 'referral_pending', 'being_evaluated', 'has_plan', 'receiving_services', 'discharged'
  referral_reason TEXT, -- סיבה/זארג (reason/concern for referral)
  referral_date DATE,
  help_type TEXT, -- Type of help: 'speech', 'OT', 'PT', 'behavioral', 'academic', 'social_skills', 'other'
  help_description TEXT,
  current_plan TEXT,
  iep_start_date DATE,
  iep_end_date DATE,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_special_ed_student ON special_ed_students(student_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_status ON special_ed_students(status);

-- 5b. Evaluation Info Gathering (from principal, teacher, parents, tutor)
CREATE TABLE IF NOT EXISTS special_ed_info_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_student_id UUID NOT NULL REFERENCES special_ed_students(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'principal', 'teacher', 'parent', 'private_tutor', 'therapist', 'other'
  source_name TEXT,
  content TEXT NOT NULL,
  date_gathered DATE DEFAULT CURRENT_DATE,
  gathered_by UUID REFERENCES app_users(id),
  gathered_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_ed_info_student ON special_ed_info_sources(special_ed_student_id);

-- 5c. Evaluation Results
CREATE TABLE IF NOT EXISTS special_ed_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_student_id UUID NOT NULL REFERENCES special_ed_students(id) ON DELETE CASCADE,
  evaluation_type TEXT, -- 'psychoeducational', 'speech', 'OT', 'behavioral', 'academic', 'other'
  evaluator_name TEXT,
  evaluation_date DATE,
  results TEXT, -- תוצאה
  recommendations TEXT, -- הצעה
  plan TEXT, -- פלאן
  actual_actions TEXT, -- וואס מ'גייט פאקטיש טון
  attachments_info TEXT, -- Description of any attachments
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_ed_eval_student ON special_ed_evaluations(special_ed_student_id);

-- 5d. Private Tutor Assignments for Special Ed
CREATE TABLE IF NOT EXISTS special_ed_tutoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_student_id UUID NOT NULL REFERENCES special_ed_students(id) ON DELETE CASCADE,
  tutor_name TEXT NOT NULL, -- Who the child learns with
  tutor_phone TEXT,
  tutor_type TEXT, -- 'private_teacher', 'the', 'speech', 'OT', 'reading_specialist', 'other'
  subject TEXT, -- What they learn
  schedule_days TEXT, -- e.g., 'Mon,Wed,Fri'
  schedule_time TEXT, -- e.g., '2:00-3:00 PM'
  location TEXT, -- Where sessions happen
  start_date DATE,
  end_date DATE,
  frequency TEXT, -- 'daily', 'weekly', 'bi-weekly', 'monthly'
  session_duration_minutes INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_ed_tutoring_student ON special_ed_tutoring(special_ed_student_id);

-- 5e. Special Ed Staff Info and Schedules
CREATE TABLE IF NOT EXISTS special_ed_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id), -- Link to main staff if applicable
  name TEXT NOT NULL,
  hebrew_name TEXT,
  role TEXT NOT NULL, -- 'coordinator', 'psychologist', 'speech_therapist', 'OT', 'PT', 'resource_teacher', 'aide', 'other'
  phone TEXT,
  email TEXT,
  specialization TEXT,
  certification TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 5f. Special Ed Staff Schedule / Availability
CREATE TABLE IF NOT EXISTS special_ed_staff_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_staff_id UUID NOT NULL REFERENCES special_ed_staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sun, 1=Mon, ...6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT, -- Which room/building
  status TEXT DEFAULT 'available', -- 'available', 'busy', 'in_school', 'unavailable'
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_special_ed_schedule_staff ON special_ed_staff_schedule(special_ed_staff_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_schedule_day ON special_ed_staff_schedule(day_of_week);

-- 5g. Special Ed Session Logs
CREATE TABLE IF NOT EXISTS special_ed_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_ed_student_id UUID NOT NULL REFERENCES special_ed_students(id) ON DELETE CASCADE,
  special_ed_staff_id UUID REFERENCES special_ed_staff(id),
  tutor_name TEXT, -- For external tutors not in staff
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME,
  duration_minutes INTEGER,
  subject TEXT,
  content TEXT,
  progress_notes TEXT,
  goals_worked_on TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_ed_sessions_student ON special_ed_session_logs(special_ed_student_id);
CREATE INDEX IF NOT EXISTS idx_special_ed_sessions_date ON special_ed_session_logs(session_date);

-- =====================================================
-- 6. REMINDERS SYSTEM (כללי 1)
-- Schedule reminders with email notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  related_type TEXT, -- 'student', 'class', 'staff', 'general', 'special_ed', 'bus_change'
  related_id UUID, -- ID of related entity
  send_email BOOLEAN DEFAULT FALSE,
  email_recipients TEXT[], -- Array of email addresses
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'cancelled'
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT -- 'daily', 'weekly', 'monthly'
);

CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- =====================================================
-- 7. EMAIL LOG (מנהל ח, כללי)
-- Track all emails sent from the system
-- =====================================================
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipients TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  related_type TEXT, -- What triggered the email
  related_id UUID,
  sent_by UUID REFERENCES app_users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- =====================================================
-- 8. CALL LOG ENHANCEMENTS (כללי 2)
-- Add direction field to existing call_logs if missing
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'direction'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN direction TEXT DEFAULT 'outgoing'; -- 'incoming', 'outgoing'
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'reminder_date'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN reminder_date DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'reminder_email'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN reminder_email TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- =====================================================
-- 9. BOOK ACCOUNTING ENHANCEMENTS (סגן מנהל ג)
-- =====================================================
CREATE TABLE IF NOT EXISTS book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  book_id UUID REFERENCES books(id),
  book_name TEXT,
  quantity_ordered INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  quantity_distributed INTEGER DEFAULT 0,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  supplier TEXT,
  order_date DATE,
  received_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'ordered', 'received', 'distributed'
  notes TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_orders_year ON book_orders(academic_year);
