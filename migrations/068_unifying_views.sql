-- =====================================================
-- 068: Unifying read-model views (Phase 22 — NON-destructive)
--
-- The DB-cleanup audit found overlapping concepts (todos/reminders,
-- tutor_assignments/special_ed_tutoring). Rather than merge/drop tables
-- (risky, historical data), we expose UNIFIED READ VIEWS so dashboards and
-- reports can read one coherent list while the underlying tables stay
-- exactly as they are.
--
--   v_action_items — todos + reminders as one "things to do" feed
--   v_all_tutoring — tutor_assignments + special_ed_tutoring as one list
--
-- security_invoker = true so the views honour the caller's RLS (PG15+).
-- Purely ADDITIVE. Idempotent and safe to re-run. No table is modified.
-- =====================================================

CREATE OR REPLACE VIEW v_action_items
WITH (security_invoker = true) AS
  SELECT
    'todo'::text        AS source,
    t.id               AS id,
    t.title            AS title,
    t.student_id       AS student_id,
    t.student_name     AS student_name,
    t.assigned_to      AS owner_id,
    t.due_date         AS due_date,
    t.status           AS status,
    t.priority         AS priority,
    t.created_at       AS created_at
  FROM todos t
  UNION ALL
  SELECT
    'reminder'::text   AS source,
    r.id               AS id,
    r.title            AS title,
    r.related_student_id   AS student_id,
    r.related_student_name AS student_name,
    r.created_by       AS owner_id,
    r.reminder_date    AS due_date,
    r.status           AS status,
    r.priority         AS priority,
    r.created_at       AS created_at
  FROM reminders r;

CREATE OR REPLACE VIEW v_all_tutoring
WITH (security_invoker = true) AS
  SELECT
    'general'::text    AS source,
    ta.id              AS id,
    ta.student_id      AS student_id,
    ta.tutor_id        AS tutor_id,
    NULL::text         AS tutor_name,
    ta.subject         AS subject,
    ta.status          AS status,
    ta.start_date      AS start_date,
    ta.end_date        AS end_date,
    ta.is_active       AS is_active
  FROM tutor_assignments ta
  UNION ALL
  SELECT
    'special_ed'::text AS source,
    st.id              AS id,
    ses.student_id     AS student_id,
    NULL::uuid         AS tutor_id,
    st.tutor_name      AS tutor_name,
    st.subject         AS subject,
    NULL::text         AS status,
    st.start_date      AS start_date,
    st.end_date        AS end_date,
    TRUE               AS is_active
  FROM special_ed_tutoring st
  JOIN special_ed_students ses ON ses.id = st.special_ed_student_id;

REVOKE ALL ON v_action_items FROM anon;
REVOKE ALL ON v_all_tutoring FROM anon;
GRANT SELECT ON v_action_items TO authenticated;
GRANT SELECT ON v_all_tutoring TO authenticated;

-- =====================================================
-- 068 COMPLETE
-- Rollback: DROP VIEW v_all_tutoring; DROP VIEW v_action_items;
-- =====================================================
