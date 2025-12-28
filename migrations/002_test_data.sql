-- ============================================
-- TEST DATA - Sample data for testing
-- ============================================
-- Run this AFTER both base schema and workflow migrations
-- ============================================

-- 1. Create sample users
INSERT INTO app_users (email, name, role) VALUES
('admin@school.com', 'School Administrator', 'admin'),
('principal@school.com', 'Principal Cohen', 'principal'),
('teacher1@school.com', 'Rabbi Schwartz', 'teacher'),
('teacher2@school.com', 'Mrs. Goldstein', 'teacher'),
('tutor1@school.com', 'Tutor David', 'tutor'),
('tutor2@school.com', 'Tutor Sarah', 'tutor')
ON CONFLICT (email) DO NOTHING;

-- 2. Create sample classes
INSERT INTO classes (name, teacher_id)
SELECT 'Grade 1', id FROM app_users WHERE email = 'teacher1@school.com'
UNION ALL
SELECT 'Grade 2', id FROM app_users WHERE email = 'teacher2@school.com'
UNION ALL
SELECT 'Grade 3', id FROM app_users WHERE email = 'teacher1@school.com'
UNION ALL
SELECT 'Grade 4', id FROM app_users WHERE email = 'teacher2@school.com';

-- 3. Create sample students
INSERT INTO students (name, class, teacher_id, father_name, mother_name, father_phone, mother_phone, status, workflow_stage)
SELECT 
  'Yaakov Levy', 
  'Grade 1',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com'),
  'Moshe Levy',
  'Rachel Levy',
  '555-0101',
  '555-0102',
  'active',
  'initial_contact'
UNION ALL
SELECT 
  'Sarah Cohen', 
  'Grade 2',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com'),
  'David Cohen',
  'Miriam Cohen',
  '555-0201',
  '555-0202',
  'active',
  'info_gathering'
UNION ALL
SELECT 
  'Moshe Goldberg', 
  'Grade 1',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com'),
  'Chaim Goldberg',
  'Esther Goldberg',
  '555-0301',
  '555-0302',
  'active',
  'assessment'
UNION ALL
SELECT 
  'Chana Stein', 
  'Grade 3',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com'),
  'Yosef Stein',
  'Leah Stein',
  '555-0401',
  '555-0402',
  'active',
  'plan_creation'
UNION ALL
SELECT 
  'David Rosen', 
  'Grade 2',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com'),
  'Aaron Rosen',
  'Rivka Rosen',
  '555-0501',
  '555-0502',
  'active',
  'active_monitoring'
UNION ALL
SELECT 
  'Rivka Klein', 
  'Grade 4',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com'),
  'Shimon Klein',
  'Devorah Klein',
  '555-0601',
  '555-0602',
  'active',
  'active_monitoring'
UNION ALL
SELECT 
  'Yehuda Berg', 
  'Grade 3',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com'),
  'Michael Berg',
  'Shira Berg',
  '555-0701',
  '555-0702',
  'active',
  'initial_contact'
UNION ALL
SELECT 
  'Malka Weiss', 
  'Grade 1',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com'),
  'Benjamin Weiss',
  'Chaya Weiss',
  '555-0801',
  '555-0802',
  'active',
  'info_gathering';

-- 4. Create sample call logs
INSERT INTO call_logs (student_id, caller_name, caller_phone, call_type, notes, logged_by)
SELECT 
  s.id,
  'Rachel Levy',
  '555-0102',
  'Inquiry',
  'Mother called asking about reading support program for Yaakov',
  (SELECT id FROM app_users WHERE email = 'admin@school.com')
FROM students s WHERE s.name = 'Yaakov Levy'
UNION ALL
SELECT 
  s.id,
  'Miriam Cohen',
  '555-0202',
  'Follow-up',
  'Discussed assessment results and next steps',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'Sarah Cohen';

-- 5. Create sample assessments
INSERT INTO assessments (student_id, assessment_date, assessment_type, social_emotional_rating, social_emotional_notes, kriah_rating, kriah_notes, limud_rating, limud_notes, assessed_by)
SELECT 
  s.id,
  CURRENT_DATE - 5,
  'Initial Evaluation',
  'Good',
  'Student shows positive social interaction with peers',
  'Fair',
  'Reading level below grade average, needs support',
  'Good',
  'Math skills are on track',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'Moshe Goldberg'
UNION ALL
SELECT 
  s.id,
  CURRENT_DATE - 3,
  'Mid-Year Review',
  'Excellent',
  'Very engaged and cooperative',
  'Excellent',
  'Reading at grade level',
  'Excellent',
  'Excelling in all subjects',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'Sarah Cohen';

-- 6. Create sample student plans
INSERT INTO student_plans (student_id, goals, social_emotional_notes, kriah_notes, limud_notes, review_frequency, status, created_by)
SELECT 
  s.id,
  'Improve reading fluency and comprehension. Build confidence in reading aloud.',
  'Encourage participation in group reading activities',
  'Weekly one-on-one tutoring sessions focusing on phonics and fluency',
  'Continue regular classroom instruction',
  'weekly',
  'active',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'David Rosen'
UNION ALL
SELECT 
  s.id,
  'Maintain current level and challenge with advanced materials',
  'Leadership opportunities in classroom',
  'Advanced reading assignments',
  'Enrichment activities in math',
  'monthly',
  'active',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'Rivka Klein';

-- 7. Create sample progress reviews
INSERT INTO progress_reviews (student_id, progress_rating, attendance_status, notes, reviewed_by)
SELECT 
  s.id,
  'good',
  'excellent',
  'Student showing improvement in reading. Continue current intervention.',
  (SELECT id FROM app_users WHERE email = 'tutor1@school.com')
FROM students s WHERE s.name = 'David Rosen'
UNION ALL
SELECT 
  s.id,
  'excellent',
  'excellent',
  'Student excelling. Consider advanced placement.',
  (SELECT id FROM app_users WHERE email = 'tutor2@school.com')
FROM students s WHERE s.name = 'Rivka Klein';

-- 8. Create sample meetings
INSERT INTO meetings (student_id, meeting_date, meeting_time, attendees, notes, created_by)
SELECT 
  s.id,
  CURRENT_DATE + 3,
  '10:00:00',
  'Parents, Principal Cohen, Rabbi Schwartz',
  'Quarterly review meeting to discuss progress',
  (SELECT id FROM app_users WHERE email = 'principal@school.com')
FROM students s WHERE s.name = 'Yaakov Levy'
UNION ALL
SELECT 
  s.id,
  CURRENT_DATE + 7,
  '14:00:00',
  'Parents, Mrs. Goldstein, Tutor Sarah',
  'Plan review and adjustment meeting',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com')
FROM students s WHERE s.name = 'Sarah Cohen';

-- 9. Create sample issues
INSERT INTO issues (student_id, issue_type, description, severity, status, reported_by)
SELECT 
  s.id,
  'Academic',
  'Student struggling with reading comprehension',
  'medium',
  'open',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com')
FROM students s WHERE s.name = 'Moshe Goldberg'
UNION ALL
SELECT 
  s.id,
  'Behavioral',
  'Occasional difficulty focusing during lessons',
  'low',
  'resolved',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com')
FROM students s WHERE s.name = 'Sarah Cohen';

-- 10. Create sample grades
INSERT INTO grades (student_id, subject, grade, quarter, school_year, entered_by)
SELECT 
  s.id,
  'Reading',
  'B',
  'Q1',
  '2024-2025',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com')
FROM students s WHERE s.name = 'Yaakov Levy'
UNION ALL
SELECT 
  s.id,
  'Math',
  'A',
  'Q1',
  '2024-2025',
  (SELECT id FROM app_users WHERE email = 'teacher1@school.com')
FROM students s WHERE s.name = 'Yaakov Levy'
UNION ALL
SELECT 
  s.id,
  'Reading',
  'A',
  'Q1',
  '2024-2025',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com')
FROM students s WHERE s.name = 'Sarah Cohen'
UNION ALL
SELECT 
  s.id,
  'Math',
  'A',
  'Q1',
  '2024-2025',
  (SELECT id FROM app_users WHERE email = 'teacher2@school.com')
FROM students s WHERE s.name = 'Sarah Cohen';

-- ============================================
-- TEST DATA COMPLETE!
-- ============================================
-- You now have:
-- - 6 users (admin, principal, 2 teachers, 2 tutors)
-- - 4 classes
-- - 8 students in different workflow stages
-- - Sample call logs, assessments, plans, reviews, meetings, issues, and grades
-- ============================================
