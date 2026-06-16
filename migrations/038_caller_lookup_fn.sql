-- =====================================================
-- 038 — Robust caller-ID resolution
--
-- Phone numbers in the app are stored in many formats:
--   (845)376-2437 · 845-376-2437 · +18453762437 · 845 376 2437
-- The inbound phone system was matching the caller ID against the RAW stored
-- text with ILIKE, so a caller "+18453762437" failed to match a stored
-- "(845)376-2437" (punctuation between the digits).
--
-- This function normalizes BOTH sides to digits-only and matches on the last
-- 10 digits, then returns the resolved caller as JSON:
--   { type, name, matched_id, student_ids[], students:[{id,name}] }
--
-- Safe / idempotent. Called by the Cloudflare voice Function via PostgREST RPC
-- (service role), so it is SECURITY DEFINER and never exposed to the browser.
-- =====================================================

CREATE OR REPLACE FUNCTION resolve_inbound_caller(p_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tail        TEXT;
  v_ids       UUID[] := '{}';
  v_name      TEXT;
  v_students  JSONB := '[]'::jsonb;
  rec         RECORD;
  v_tutor     RECORD;
  v_staff     RECORD;
BEGIN
  -- Last 10 digits of the caller ID.
  tail := regexp_replace(COALESCE(p_number, ''), '\D', '', 'g');
  IF length(tail) < 10 THEN
    RETURN jsonb_build_object('type','unknown','name',NULL,'matched_id',NULL,
                              'student_ids','[]'::jsonb,'students','[]'::jsonb);
  END IF;
  tail := right(tail, 10);

  -- helper expression: digits-only of a stored column ends with `tail`
  -- ------------------------------------------------------------------
  -- 1) PARENT via students.father_phone / mother_phone
  -- ------------------------------------------------------------------
  FOR rec IN
    SELECT id,
           COALESCE(NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''),
                    name, hebrew_name, 'Student') AS disp,
           father_name, mother_name, father_phone, mother_phone
    FROM students
    WHERE right(regexp_replace(COALESCE(father_phone,''), '\D','','g'),10) = tail
       OR right(regexp_replace(COALESCE(mother_phone,''), '\D','','g'),10) = tail
  LOOP
    v_ids := array_append(v_ids, rec.id);
    v_students := v_students || jsonb_build_object('id', rec.id, 'name', rec.disp);
    IF v_name IS NULL THEN
      IF right(regexp_replace(COALESCE(rec.father_phone,''), '\D','','g'),10) = tail THEN
        v_name := rec.father_name;
      ELSE
        v_name := rec.mother_name;
      END IF;
    END IF;
  END LOOP;

  -- ------------------------------------------------------------------
  -- 2) PARENT via contacts table (extra guardians)
  -- ------------------------------------------------------------------
  FOR rec IN
    SELECT c.name AS cname, c.student_id,
           COALESCE(NULLIF(btrim(concat_ws(' ', s.first_name, s.last_name)), ''),
                    s.name, s.hebrew_name, 'Student') AS disp
    FROM contacts c
    JOIN students s ON s.id = c.student_id
    WHERE right(regexp_replace(COALESCE(c.phone,''), '\D','','g'),10) = tail
  LOOP
    IF NOT (rec.student_id = ANY(v_ids)) THEN
      v_ids := array_append(v_ids, rec.student_id);
      v_students := v_students || jsonb_build_object('id', rec.student_id, 'name', rec.disp);
    END IF;
    IF v_name IS NULL THEN v_name := rec.cname; END IF;
  END LOOP;

  IF array_length(v_ids, 1) > 0 THEN
    RETURN jsonb_build_object(
      'type','parent',
      'name', COALESCE(v_name,'Parent'),
      'matched_id', v_ids[1],
      'student_ids', to_jsonb(v_ids),
      'students', v_students
    );
  END IF;

  -- ------------------------------------------------------------------
  -- 3) STAFF via staff_members.home_phone / cell_phone
  -- ------------------------------------------------------------------
  SELECT id, full_name, hebrew_name, position, app_user_id
    INTO v_staff
    FROM staff_members
   WHERE right(regexp_replace(COALESCE(home_phone,''), '\D','','g'),10) = tail
      OR right(regexp_replace(COALESCE(cell_phone,''), '\D','','g'),10) = tail
   LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'type','staff',
      'name', COALESCE(v_staff.full_name, v_staff.hebrew_name, 'Staff'),
      'matched_id', v_staff.id,
      'student_ids','[]'::jsonb,
      'students','[]'::jsonb
    );
  END IF;

  -- ------------------------------------------------------------------
  -- 4) TUTOR via app_users.phone → their assigned students
  -- ------------------------------------------------------------------
  SELECT id, name, email
    INTO v_tutor
    FROM app_users
   WHERE right(regexp_replace(COALESCE(phone,''), '\D','','g'),10) = tail
   LIMIT 1;
  IF FOUND THEN
    SELECT COALESCE(array_agg(ta.student_id), '{}'),
           COALESCE(jsonb_agg(jsonb_build_object(
             'id', s.id,
             'name', COALESCE(NULLIF(btrim(concat_ws(' ', s.first_name, s.last_name)), ''),
                              s.name, s.hebrew_name, 'Student'))), '[]'::jsonb)
      INTO v_ids, v_students
      FROM tutor_assignments ta
      JOIN students s ON s.id = ta.student_id
     WHERE ta.tutor_id = v_tutor.id AND ta.status = 'active';

    RETURN jsonb_build_object(
      'type','tutor',
      'name', COALESCE(v_tutor.name, v_tutor.email, 'Tutor'),
      'matched_id', v_tutor.id,
      'student_ids', to_jsonb(v_ids),
      'students', v_students
    );
  END IF;

  -- ------------------------------------------------------------------
  -- Nothing matched
  -- ------------------------------------------------------------------
  RETURN jsonb_build_object('type','unknown','name',NULL,'matched_id',NULL,
                            'student_ids','[]'::jsonb,'students','[]'::jsonb);
END;
$$;
