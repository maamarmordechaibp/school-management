-- ============================================
-- UPDATED: Grades, Classes, and Students Import
-- ============================================
-- Based on actual student data:
-- - Grades: ג through ט (3rd-9th grade only)
-- - Each grade has 2 parallel classes: א and ב
-- - No Pre-Nursery, Nursery, Kindergarten in student list
-- ============================================

-- ============================================
-- CLEANUP: Remove old data
-- ============================================
DELETE FROM classes;
DELETE FROM grades;

-- Remove staff from lower grades (not in use)
DELETE FROM staff_members WHERE class_assignment LIKE '%פרינ%';
DELETE FROM staff_members WHERE class_assignment LIKE '%נ %' OR class_assignment = 'נ א' OR class_assignment = 'נ ב' OR class_assignment = 'נ ג';
DELETE FROM staff_members WHERE class_assignment LIKE '%קג%';

-- ============================================
-- INSERT GRADE LEVELS (ג through ט only)
-- ============================================

INSERT INTO grades (name, grade_number, description) VALUES
  ('כיתה ג (3rd Grade)', 3, '3rd Grade / כיתה ג'),
  ('כיתה ד (4th Grade)', 4, '4th Grade / כיתה ד'),
  ('כיתה ה (5th Grade)', 5, '5th Grade / כיתה ה'),
  ('כיתה ו (6th Grade)', 6, '6th Grade / כיתה ו'),
  ('כיתה ז (7th Grade)', 7, '7th Grade / כיתה ז'),
  ('כיתה ח (8th Grade)', 8, '8th Grade / כיתה ח'),
  ('כיתה ט (9th Grade)', 9, '9th Grade / כיתה ט');

-- ============================================
-- INSERT CLASSES (2 parallel classes per grade)
-- ============================================

-- 3rd Grade (כיתה ג)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ג - א', id, '2024-2025', true FROM grades WHERE grade_number = 3;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ג - ב', id, '2024-2025', true FROM grades WHERE grade_number = 3;

-- 4th Grade (כיתה ד)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ד - א', id, '2024-2025', true FROM grades WHERE grade_number = 4;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ד - ב', id, '2024-2025', true FROM grades WHERE grade_number = 4;

-- 5th Grade (כיתה ה)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ה - א', id, '2024-2025', true FROM grades WHERE grade_number = 5;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ה - ב', id, '2024-2025', true FROM grades WHERE grade_number = 5;

-- 6th Grade (כיתה ו)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ו - א', id, '2024-2025', true FROM grades WHERE grade_number = 6;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ו - ב', id, '2024-2025', true FROM grades WHERE grade_number = 6;

-- 7th Grade (כיתה ז)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ז - א', id, '2024-2025', true FROM grades WHERE grade_number = 7;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ז - ב', id, '2024-2025', true FROM grades WHERE grade_number = 7;

-- 8th Grade (כיתה ח)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ח - א', id, '2024-2025', true FROM grades WHERE grade_number = 8;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ח - ב', id, '2024-2025', true FROM grades WHERE grade_number = 8;

-- 9th Grade (כיתה ט)
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ט - א', id, '2024-2025', true FROM grades WHERE grade_number = 9;
INSERT INTO classes (name, grade_id, academic_year, is_active)
SELECT 'ט - ב', id, '2024-2025', true FROM grades WHERE grade_number = 9;

-- ============================================
-- UPDATE STAFF CLASS ASSIGNMENTS
-- Map old assignments to new parallel class format
-- ============================================

-- Update Melamdim to be assigned to specific parallel classes
-- Grade ג teachers
UPDATE staff_members SET class_assignment = 'ג - א' WHERE class_assignment = 'ג' AND position = 'Melamed' AND last_name IN ('Felberbaum', 'Bayer');
UPDATE staff_members SET class_assignment = 'ג - ב' WHERE class_assignment = 'ג' AND position = 'Melamed' AND last_name NOT IN ('Felberbaum', 'Bayer');

-- Grade ד teachers  
UPDATE staff_members SET class_assignment = 'ד - א' WHERE class_assignment = 'ד' AND position = 'Melamed' AND last_name = 'Silber';
UPDATE staff_members SET class_assignment = 'ד - ב' WHERE class_assignment = 'ד' AND position = 'Melamed' AND last_name = 'Bayer';

-- Grade ה teachers
UPDATE staff_members SET class_assignment = 'ה - א' WHERE class_assignment = 'ה' AND position = 'Melamed' AND last_name = 'Fischer';
UPDATE staff_members SET class_assignment = 'ה - ב' WHERE class_assignment = 'ה' AND position = 'Melamed' AND last_name = 'Feder';

-- Grade ו teachers
UPDATE staff_members SET class_assignment = 'ו - א' WHERE class_assignment = 'ו' AND position = 'Melamed' AND last_name = 'Rosenfeld';
UPDATE staff_members SET class_assignment = 'ו - ב' WHERE class_assignment = 'ו' AND position = 'Melamed' AND last_name = 'Goldstein';

-- Grade ז teachers
UPDATE staff_members SET class_assignment = 'ז - א' WHERE class_assignment = 'ז' AND position = 'Melamed' AND last_name = 'Simonowitz';
UPDATE staff_members SET class_assignment = 'ז - ב' WHERE class_assignment = 'ז' AND position = 'Melamed' AND last_name = 'Friedman';

-- Grade ח teachers
UPDATE staff_members SET class_assignment = 'ח - א' WHERE class_assignment = 'ח' AND position = 'Melamed' AND last_name = 'Wulliger';
UPDATE staff_members SET class_assignment = 'ח - ב' WHERE class_assignment = 'ח' AND position = 'Melamed' AND last_name IN ('Green', 'Weingarten');

-- Grade ט teachers
UPDATE staff_members SET class_assignment = 'ט - א' WHERE class_assignment = 'ט' AND position = 'Melamed' AND last_name = 'Biston';
UPDATE staff_members SET class_assignment = 'ט - ב' WHERE class_assignment = 'ט' AND position = 'Melamed' AND last_name IN ('Green', 'Silberman');

-- Update English teachers
UPDATE staff_members SET class_assignment = 'ג - א' WHERE class_assignment LIKE '%ג%1st%' AND position = 'English Teacher' AND last_name = 'Klein';
UPDATE staff_members SET class_assignment = 'ג - ב' WHERE class_assignment LIKE '%ג%1st%' AND position = 'English Teacher' AND last_name = 'Gold';
UPDATE staff_members SET class_assignment = 'ד - א' WHERE class_assignment LIKE '%ד%2nd%' AND position = 'English Teacher' AND last_name = 'Silber';
UPDATE staff_members SET class_assignment = 'ד - ב' WHERE class_assignment LIKE '%ד%2nd%' AND position = 'English Teacher' AND last_name = 'Bayer';
UPDATE staff_members SET class_assignment = 'ה - א' WHERE class_assignment LIKE '%ה%3rd%' AND position = 'English Teacher' AND last_name = 'Bluming';
UPDATE staff_members SET class_assignment = 'ה - ב' WHERE class_assignment LIKE '%ה%3rd%' AND position = 'English Teacher' AND last_name = 'Feig';
UPDATE staff_members SET class_assignment = 'ו - א' WHERE class_assignment LIKE '%ו%4th%' AND position = 'English Teacher' AND last_name = 'Kalisch';
UPDATE staff_members SET class_assignment = 'ו - ב' WHERE class_assignment LIKE '%ו%4th%' AND position = 'English Teacher' AND last_name = 'Gefner';
UPDATE staff_members SET class_assignment = 'ז - א' WHERE class_assignment LIKE '%ז%5th%' AND position = 'English Teacher' AND last_name = 'Feketa';
UPDATE staff_members SET class_assignment = 'ז - ב' WHERE class_assignment LIKE '%ז%5th%' AND position = 'English Teacher' AND last_name = 'Simonowitz';
UPDATE staff_members SET class_assignment = 'ח - א' WHERE class_assignment LIKE '%ח%6th%' AND position = 'English Teacher' AND last_name = 'Feder';
UPDATE staff_members SET class_assignment = 'ח - ב' WHERE class_assignment LIKE '%ח%6th%' AND position = 'English Teacher' AND last_name = 'Green';

-- ============================================
-- SUMMARY
-- ============================================
-- 7 Grade Levels: ג through ט
-- 14 Classes: 2 per grade (א and ב)
-- Staff assignments updated to specific classes
-- ============================================
