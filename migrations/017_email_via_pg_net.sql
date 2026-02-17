-- =====================================================
-- 017: Server-side email sending via pg_net
-- Uses Supabase's built-in pg_net extension to call
-- Resend API directly from the database.
-- No separate backend/function server needed.
-- =====================================================

-- 1. Enable pg_net extension (built into Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the send_email RPC function
CREATE OR REPLACE FUNCTION send_email(
  p_to TEXT[],
  p_subject TEXT,
  p_html TEXT,
  p_text TEXT DEFAULT NULL,
  p_from TEXT DEFAULT 'School Management <onboarding@resend.dev>',
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_sent_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id BIGINT;
  v_body JSONB;
BEGIN
  -- Build the request body for Resend API
  v_body := jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'subject', p_subject,
    'html', p_html,
    'text', COALESCE(p_text, '')
  );

  -- Send email via Resend API using pg_net (async HTTP POST)
  SELECT net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer re_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A',
      'Content-Type', 'application/json'
    ),
    body := v_body
  ) INTO v_request_id;

  -- Log to email_log table
  INSERT INTO email_log (recipients, subject, body, related_type, related_id, sent_by, status)
  VALUES (p_to, p_subject, COALESCE(p_text, p_html), p_related_type, p_related_id, p_sent_by, 'sent');

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);

EXCEPTION WHEN OTHERS THEN
  -- Log the failed attempt
  BEGIN
    INSERT INTO email_log (recipients, subject, body, related_type, related_id, sent_by, status)
    VALUES (p_to, p_subject, COALESCE(p_text, p_html), p_related_type, p_related_id, p_sent_by, 'failed');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore logging errors
    NULL;
  END;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_email TO anon;
