-- ============================================
-- Grades and Classes Data Import
-- ============================================
-- This migration populates grades and classes
-- based on the school structure
-- ============================================

-- ============================================
-- TO DROP/CLEAR ALL DATA, RUN:
-- ============================================
-- DELETE FROM classes;
-- DELETE FROM grades;
-- ============================================

-- ============================================
-- INSERT GRADE LEVELS
-- ============================================

INSERT INTO grades (name, grade_number, description) VALUES
  ('פרי-נורסערי (Pre-Nursery)', 0, 'Pre-Nursery - Ages 2-3'),
  ('נורסערי (Nursery)', 1, 'Nursery - Ages 3-4'),
  ('קינדערגארטן (Kindergarten)', 2, 'Kindergarten - Ages 4-5'),
  ('כתה א (1st Grade)', 3, '1st Grade'),
  ('כתה ב (2nd Grade)', 4, '2nd Grade'),
  ('כתה ג (3rd Grade)', 5, '3rd Grade'),
  ('כתה ד (4th Grade)', 6, '4th Grade'),
  ('כתה ה (5th Grade)', 7, '5th Grade'),
  ('כתה ו (6th Grade)', 8, '6th Grade'),
  ('כתה ז (7th Grade)', 9, '7th Grade'),
  ('כתה ח (8th Grade)', 10, '8th Grade'),
  ('כתה ט (9th Grade)', 11, '9th Grade')
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT CLASSES
-- ============================================
-- Classes are linked to grades and will have teachers assigned

-- Pre-Nursery Classes
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'פרינ א', id, '2024-2025', true FROM grades WHERE grade_number = 0;

INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'פרינ ב', id, '2024-2025', true FROM grades WHERE grade_number = 0;

-- Nursery Classes
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'נ א', id, '2024-2025', true FROM grades WHERE grade_number = 1;

INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'נ ב', id, '2024-2025', true FROM grades WHERE grade_number = 1;

INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'נ ג', id, '2024-2025', true FROM grades WHERE grade_number = 1;

-- Kindergarten Classes
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'קג א', id, '2024-2025', true FROM grades WHERE grade_number = 2;

INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'קג ב', id, '2024-2025', true FROM grades WHERE grade_number = 2;

INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'קג ג', id, '2024-2025', true FROM grades WHERE grade_number = 2;

-- 1st Grade (כתה א)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'א', id, '2024-2025', true FROM grades WHERE grade_number = 3;

-- 2nd Grade (כתה ב)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ב', id, '2024-2025', true FROM grades WHERE grade_number = 4;

-- 3rd Grade (כתה ג)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ג', id, '2024-2025', true FROM grades WHERE grade_number = 5;

-- 4th Grade (כתה ד)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ד', id, '2024-2025', true FROM grades WHERE grade_number = 6;

-- 5th Grade (כתה ה)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ה', id, '2024-2025', true FROM grades WHERE grade_number = 7;

-- 6th Grade (כתה ו)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ו', id, '2024-2025', true FROM grades WHERE grade_number = 8;

-- 7th Grade (כתה ז)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ז', id, '2024-2025', true FROM grades WHERE grade_number = 9;

-- 8th Grade (כתה ח)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ח', id, '2024-2025', true FROM grades WHERE grade_number = 10;

-- 9th Grade (כתה ט)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ט', id, '2024-2025', true FROM grades WHERE grade_number = 11;

-- ============================================
-- SUMMARY
-- ============================================
-- Total: 12 Grade Levels
-- Total: 17 Classes
--   - 2 Pre-Nursery (פרינ א, פרינ ב)
--   - 3 Nursery (נ א, נ ב, נ ג)
--   - 3 Kindergarten (קג א, קג ב, קג ג)
--   - 9 Elementary (א through ט)
-- ============================================
