-- =====================================================
-- 017: Server-side email sending via http extension
-- Uses Supabase's built-in http extension to call
-- Resend API directly from the database (synchronous).
-- No separate backend/function server needed.
-- =====================================================

-- 1. Enable http extension (built into Supabase)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Drop old signature(s) to avoid ambiguous overloads, then recreate
DROP FUNCTION IF EXISTS send_email(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS send_email(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION send_email(
  p_to TEXT[],
  p_subject TEXT,
  p_html TEXT,
  p_text TEXT DEFAULT NULL,
  p_from TEXT DEFAULT 'TYY Monsey <send@tyymonsey.com>',
  p_reply_to TEXT DEFAULT 'info@tyymonsey.com',
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
  v_api_key TEXT;
  v_full_html TEXT;
  v_unsubscribe_url TEXT;
BEGIN
  -- API key stored in function body (SECURITY DEFINER prevents exposure)
  v_api_key := 're_8zTvwjXu_A1pbsP7gtfTa73uLCRCPaiE1';

  -- Unsubscribe URL (update to your actual unsubscribe endpoint)
  v_unsubscribe_url := 'https://tyymonsey.com/unsubscribe';

  -- Wrap HTML in proper email document structure with anti-spam best practices
  v_full_html := '<!DOCTYPE html>'
    || '<html lang="he" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">'
    || '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
    || '<title>' || p_subject || '</title></head>'
    || '<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">'
    || '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;">'
    || '<tr><td align="center" style="padding:20px 0;">'
    || '<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">'
    || '<tr><td style="padding:20px 30px;">'
    || p_html
    || '</td></tr>'
    || '<tr><td style="padding:15px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">'
    || '<p style="margin:0 0 8px 0;">TYY Monsey &middot; Monsey, NY</p>'
    || '<p style="margin:0;"><a href="' || v_unsubscribe_url || '" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>'
    || '</td></tr>'
    || '</table>'
    || '</td></tr></table>'
    || '</body></html>';

  -- Build the JSON request body with headers for deliverability
  v_body := json_build_object(
    'from', p_from,
    'to', p_to,
    'reply_to', p_reply_to,
    'subject', p_subject,
    'html', v_full_html,
    'text', COALESCE(p_text, ''),
    'headers', json_build_object(
      'List-Unsubscribe', '<' || v_unsubscribe_url || '>',
      'List-Unsubscribe-Post', 'List-Unsubscribe=One-Click'
    )
  )::TEXT;

  -- Send email via Resend API using http extension (synchronous)
  SELECT * INTO v_response FROM http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_api_key),
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
GRANT EXECUTE ON FUNCTION send_email(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_email(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO anon;
