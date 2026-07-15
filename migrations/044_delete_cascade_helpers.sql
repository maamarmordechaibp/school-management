-- =====================================================
-- 044: Cascade-delete helpers for students and classes
--
--  delete_student_cascade(uuid)  — removes a student and EVERY record
--                                  linked to them (issues, calls, meetings,
--                                  grades, assessments, fees, payments,
--                                  reminders, todos, documents, special-ed,
--                                  etc.), regardless of FK on-delete rules.
--  delete_class_students(uuid)   — removes every student in a class (used
--                                  when a class graduates / leaves school).
--                                  Returns the number of students removed.
--
-- Idempotent and safe to re-run.
-- =====================================================

CREATE OR REPLACE FUNCTION delete_student_cascade(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tables TEXT[][] := ARRAY[
    ARRAY['call_logs','student_id'],
    ARRAY['student_issues','student_id'],
    ARRAY['grades','student_id'],
    ARRAY['assessments','student_id'],
    ARRAY['interventions','student_id'],
    ARRAY['meetings','student_id'],
    ARRAY['student_plans','student_id'],
    ARRAY['progress_reviews','student_id'],
    ARRAY['student_fees','student_id'],
    ARRAY['payments','student_id'],
    ARRAY['todos','student_id'],
    ARRAY['reminders','related_student_id'],
    ARRAY['student_notes','student_id'],
    ARRAY['late_arrivals','student_id'],
    ARRAY['bus_changes','student_id'],
    ARRAY['tutor_assignments','student_id'],
    ARRAY['attendance','student_id'],
    ARRAY['special_ed_evaluation_requests','student_id'],
    ARRAY['special_ed_students','student_id'],
    ARRAY['student_documents','student_id']
  ];
  r TEXT[];
BEGIN
  FOREACH r SLICE 1 IN ARRAY v_tables LOOP
    IF to_regclass('public.' || r[1]) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = r[1] AND column_name = r[2]
       ) THEN
      EXECUTE format('DELETE FROM %I WHERE %I = $1', r[1], r[2]) USING p_student_id;
    END IF;
  END LOOP;

  DELETE FROM students WHERE id = p_student_id;
END $$;

CREATE OR REPLACE FUNCTION delete_class_students(p_class_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_count INT := 0;
BEGIN
  FOR v_id IN SELECT id FROM students WHERE class_id = p_class_id LOOP
    PERFORM delete_student_cascade(v_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION delete_student_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_class_students(UUID)  TO authenticated;
