-- =====================================================
-- 040 — Make every FK that references app_users ON DELETE SET NULL
--
-- Problem: many tables reference app_users(id) (teacher_id, created_by,
-- reported_by, logged_by, assigned_to, reviewed_by, etc.) using the default
-- NO ACTION rule. That means deleting a user fails with a foreign-key
-- violation the moment they're assigned to a class or have ever logged a
-- call / reported an issue / created a todo — which surfaces in the UI as
-- the generic "Could not delete user."
--
-- Fix: rewrite each of those foreign keys as ON DELETE SET NULL. Historical
-- rows (issues, calls, todos, report cards…) are preserved; only the
-- reference to the removed user becomes NULL, so the delete can proceed.
--
-- This walks pg_constraint dynamically, so it covers every referencing table
-- automatically — including ones added in future migrations that already
-- exist at run time. It only touches single-column, nullable FK columns
-- (all the app_users references are optional metadata columns).
--
-- Safe / idempotent. Additive only.
-- =====================================================

DO $$
DECLARE
  r           RECORD;
  col_notnull BOOLEAN;
BEGIN
  FOR r IN
    SELECT con.conname                     AS conname,
           con.conrelid::regclass::text     AS tbl,
           att.attname                       AS col,
           con.confdeltype                   AS deltype,
           array_length(con.conkey, 1)       AS ncols
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum   = con.conkey[1]
    WHERE con.contype   = 'f'
      AND con.confrelid = 'app_users'::regclass
  LOOP
    -- Skip composite FKs (none reference app_users, but be safe).
    IF r.ncols IS DISTINCT FROM 1 THEN
      CONTINUE;
    END IF;

    -- Skip anything already ON DELETE SET NULL ('n').
    IF r.deltype = 'n' THEN
      CONTINUE;
    END IF;

    -- Only rewrite nullable columns — SET NULL requires the column to accept NULL.
    SELECT att.attnotnull
      INTO col_notnull
    FROM pg_attribute att
    WHERE att.attrelid = r.tbl::regclass
      AND att.attname  = r.col;

    IF col_notnull THEN
      RAISE NOTICE 'Skipping NOT NULL FK %.% (%).', r.tbl, r.col, r.conname;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES app_users(id) ON DELETE SET NULL',
      r.tbl, r.conname, r.col
    );
    RAISE NOTICE 'Rewrote %.% (%) as ON DELETE SET NULL.', r.tbl, r.col, r.conname;
  END LOOP;
END $$;
