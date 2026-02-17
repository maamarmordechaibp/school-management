-- =====================================================
-- 017: Server-side email sending via http extension
-- Uses Supabase's built-in http extension to call
-- Resend API directly from the database (synchronous).
-- No separate backend/function server needed.
-- =====================================================

-- 1. Enable http extension (built into Supabase)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Create the send_email RPC function
CREATE OR REPLACE FUNCTION send_email(
  p_to TEXT[],
  p_subject TEXT,
  p_html TEXT,
  p_text TEXT DEFAULT NULL,
  p_from TEXT DEFAULT 'tyy <send@tyymonsey.com>',
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_sent_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response extensions.http_response;
  v_body TEXT;
  v_result JSONB;
  v_status INT;
BEGIN
  -- Build the JSON request body
  v_body := json_build_object(
    'from', p_from,
    'to', p_to,
    'subject', p_subject,
    'html', p_html,
    'text', COALESCE(p_text, '')
  )::TEXT;

  -- Send email via Resend API using http extension (synchronous)
  SELECT * INTO v_response FROM http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      http_header('Authorization', 'Bearer re_Ugkb4gWj_CEz1KbcZXE7UUYx1oAF2zd7A'),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_body
  )::http_request);

  v_status := v_response.status;

  -- Try to parse the response
  BEGIN
    v_result := v_response.content::JSONB;
  EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object('raw_response', left(v_response.content, 500));
  END;

  -- Log to email_log table
  INSERT INTO email_log (recipients, subject, body, related_type, related_id, sent_by, status)
  VALUES (
    p_to, p_subject, COALESCE(p_text, p_html),
    p_related_type, p_related_id, p_sent_by,
    CASE WHEN v_status >= 200 AND v_status < 300 THEN 'sent' ELSE 'failed' END
  );

  -- Return result with actual API response
  IF v_status >= 200 AND v_status < 300 THEN
    RETURN jsonb_build_object(
      'success', true,
      'id', v_result->>'id',
      'status', v_status
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(v_result->>'message', v_result->>'error', 'Resend API error'),
      'status', v_status,
      'details', v_result
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Log the failed attempt
  BEGIN
    INSERT INTO email_log (recipients, subject, body, related_type, related_id, sent_by, status)
    VALUES (p_to, p_subject, COALESCE(p_text, p_html), p_related_type, p_related_id, p_sent_by, 'failed');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_email TO anon;
