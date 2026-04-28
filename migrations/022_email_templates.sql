-- =====================================================
-- 022 — Email Templates
-- Reusable, variable-driven email templates for announcements,
-- late letters, escalations, fee reminders, etc.
-- Variables use {{name}} syntax; resolved client-side via
-- src/lib/emailService.js renderTemplate().
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'yi', -- 'yi' (Yiddish) | 'en' | 'he'
  variables JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, label, sample}]
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(key);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON email_templates(language);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trg_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION trg_email_templates_updated_at();

-- RLS: any authenticated school staff can read/write
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_templates_all' AND tablename = 'email_templates') THEN
    CREATE POLICY email_templates_all ON email_templates FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- Seed templates (idempotent via UPSERT on key)
-- =====================================================

INSERT INTO email_templates (key, name, description, subject, body_html, language, variables, is_system)
VALUES
(
  'late_letter',
  'Late Arrival Letter (Yiddish)',
  'Printed slip handed to the teacher when a student arrives late.',
  'בריוו פון פארשפעטיגונג',
  '<div style="font-family: David, serif; direction: rtl; padding: 24px;">'
    || '<h2 style="text-align:center;">{{school_name}}</h2>'
    || '<p style="text-align:left;">{{date}}</p>'
    || '<p>חשובע מורה,</p>'
    || '<p>דער תלמיד <strong>{{student_name}}</strong> פון כתה <strong>{{class_name}}</strong> איז אנגעקומען שפעט היינט.</p>'
    || '<p>צייט פון אנקומען: <strong>{{arrival_time}}</strong> ({{minutes_late}} מינוט שפעט)</p>'
    || '<p>סיבה: {{reason}}</p>'
    || '<p style="margin-top:32px;">דער עסיסטענט פרינציפעל</p>'
  || '</div>',
  'yi',
  '[{"name":"school_name","label":"School name","sample":"תלמוד תורה ימין מאנסי"},{"name":"date","label":"Date","sample":"01/05/2026"},{"name":"student_name","label":"Student name","sample":"משה כהן"},{"name":"class_name","label":"Class","sample":"א-1"},{"name":"arrival_time","label":"Arrival time","sample":"09:15"},{"name":"minutes_late","label":"Minutes late","sample":"15"},{"name":"reason","label":"Reason","sample":"באס פארשפעטיגט"}]'::jsonb,
  TRUE
),
(
  'late_escalation',
  'Late Arrival Escalation (Parent Email, Yiddish)',
  'Sent to parents when a student crosses the monthly lateness threshold.',
  'התראה: {{student_name}} איז שפעט אנגעקומען ({{count}} מאל דעם חודש)',
  '<div style="font-family: David, serif; direction: rtl; padding: 16px;">'
    || '<p>חשובע עלטערן,</p>'
    || '<p>מיר ווילן אייך אנזאגן אז {{student_name}} איז שפעט אנגעקומען <strong>{{count}}</strong> מאל דעם חודש.</p>'
    || '<p>ביטע זייט אכטונג צו ברענגען די קינד אין צייט.</p>'
    || '<p style="margin-top:24px;">{{school_name}}</p>'
  || '</div>',
  'yi',
  '[{"name":"student_name","label":"Student name","sample":"משה כהן"},{"name":"count","label":"Lateness count this month","sample":"3"},{"name":"school_name","label":"School name","sample":"תלמוד תורה ימין מאנסי"}]'::jsonb,
  TRUE
),
(
  'meeting_confirmation',
  'Meeting Confirmation (Yiddish)',
  'Confirms a meeting time with parents.',
  'באשטעטיגונג: מיטינג מיט {{school_name}}',
  '<div style="font-family: David, serif; direction: rtl; padding: 16px;">'
    || '<p>חשובע {{parent_name}},</p>'
    || '<p>מיר באשטעטיגן א מיטינג וועגן {{student_name}}.</p>'
    || '<p>טאג: <strong>{{meeting_date}}</strong> בײַ <strong>{{meeting_time}}</strong></p>'
    || '<p>פלאץ: {{location}}</p>'
    || '<p style="margin-top:24px;">{{school_name}}</p>'
  || '</div>',
  'yi',
  '[{"name":"parent_name","label":"Parent name","sample":"הר'' כהן"},{"name":"student_name","label":"Student name","sample":"משה כהן"},{"name":"meeting_date","label":"Meeting date","sample":"05/05/2026"},{"name":"meeting_time","label":"Meeting time","sample":"19:00"},{"name":"location","label":"Location","sample":"שולע"},{"name":"school_name","label":"School name","sample":"תלמוד תורה ימין מאנסי"}]'::jsonb,
  TRUE
),
(
  'fee_reminder',
  'Fee Reminder (Yiddish)',
  'Reminds parents of an outstanding balance.',
  'דערמאנונג: באצאלונג פאר {{student_name}}',
  '<div style="font-family: David, serif; direction: rtl; padding: 16px;">'
    || '<p>חשובע עלטערן,</p>'
    || '<p>אונזער רעקארדס ווייזן אז עס בלייבט א באלאנס פון <strong>${{balance}}</strong> פאר {{student_name}}.</p>'
    || '<p>ביטע מאכט די באצאלונג ווען מעגליך.</p>'
    || '<p style="margin-top:24px;">{{school_name}}</p>'
  || '</div>',
  'yi',
  '[{"name":"student_name","label":"Student name","sample":"משה כהן"},{"name":"balance","label":"Outstanding balance","sample":"500"},{"name":"school_name","label":"School name","sample":"תלמוד תורה ימין מאנסי"}]'::jsonb,
  TRUE
),
(
  'general_announcement',
  'General Announcement (Yiddish)',
  'Generic body for class- or grade-wide announcements.',
  '{{subject}}',
  '<div style="font-family: David, serif; direction: rtl; padding: 16px;">'
    || '<p>חשובע עלטערן,</p>'
    || '<div>{{message}}</div>'
    || '<p style="margin-top:24px;">{{school_name}}</p>'
  || '</div>',
  'yi',
  '[{"name":"subject","label":"Subject","sample":"וויכטיגע מעלדונג"},{"name":"message","label":"Message body","sample":"..."},{"name":"school_name","label":"School name","sample":"תלמוד תורה ימין מאנסי"}]'::jsonb,
  TRUE
)
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      subject = EXCLUDED.subject,
      body_html = EXCLUDED.body_html,
      language = EXCLUDED.language,
      variables = EXCLUDED.variables,
      is_system = EXCLUDED.is_system,
      updated_at = NOW();

GRANT SELECT, INSERT, UPDATE, DELETE ON email_templates TO authenticated;
