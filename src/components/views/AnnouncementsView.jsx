import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendEmail, renderTemplate } from '@/lib/emailService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Megaphone, Send, Eye, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { SCHOOL_NAME_YI } from '@/lib/schoolConfig';

const AnnouncementsView = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [audience, setAudience] = useState('all'); // all | grade | class
  const [audienceId, setAudienceId] = useState('');
  const [contactType, setContactType] = useState('both'); // father | mother | both
  const [templateKey, setTemplateKey] = useState('general_announcement');
  const [subjectOverride, setSubjectOverride] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [g, c, t] = await Promise.all([
        supabase.from('grades').select('id, name').order('name'),
        supabase.from('classes').select('id, name, grade_id').order('name'),
        supabase.from('email_templates').select('*').order('name'),
      ]);
      setGrades(g.data || []);
      setClasses(c.data || []);
      setTemplates(t.data || []);
      setLoading(false);
    })();
  }, []);

  const template = useMemo(() => templates.find(t => t.key === templateKey), [templates, templateKey]);

  // Build recipient list based on audience selection
  const computeRecipients = async () => {
    let query = supabase
      .from('students')
      .select('id, first_name, last_name, hebrew_name, father_name, father_email, mother_name, mother_email, class_id, class:classes(id, name, grade_id)');

    if (audience === 'class' && audienceId) {
      query = query.eq('class_id', audienceId);
    }
    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to load students', description: error.message });
      return [];
    }
    let students = data || [];
    if (audience === 'grade' && audienceId) {
      students = students.filter(s => s.class?.grade_id === audienceId);
    }

    const list = [];
    students.forEach(s => {
      const baseName = s.hebrew_name || `${s.first_name || ''} ${s.last_name || ''}`.trim();
      if ((contactType === 'father' || contactType === 'both') && s.father_email) {
        list.push({
          email: s.father_email,
          parent_name: s.father_name || '',
          student_name: baseName,
          class_name: s.class?.name || '',
          student_id: s.id,
        });
      }
      if ((contactType === 'mother' || contactType === 'both') && s.mother_email) {
        list.push({
          email: s.mother_email,
          parent_name: s.mother_name || '',
          student_name: baseName,
          class_name: s.class?.name || '',
          student_id: s.id,
        });
      }
    });
    return list;
  };

  const refreshRecipients = async () => {
    const list = await computeRecipients();
    setRecipients(list);
    toast({ title: `Found ${list.length} recipient(s)` });
  };

  // Sample preview using the first recipient
  const preview = useMemo(() => {
    const sample = recipients[0] || {
      parent_name: '[parent]',
      student_name: '[student]',
      class_name: '[class]',
    };
    const vars = {
      ...sample,
      subject: subjectOverride || 'מעלדונג',
      message: messageBody || '(your message here)',
      school_name: SCHOOL_NAME_YI,
    };
    if (!template) return { subject: '', body_html: '', missing: [] };
    return renderTemplate(template, vars);
  }, [template, recipients, subjectOverride, messageBody]);

  const send = async () => {
    if (!template) {
      toast({ variant: 'destructive', title: 'Pick a template' });
      return;
    }
    const list = recipients.length ? recipients : await computeRecipients();
    if (!list.length) {
      toast({ variant: 'destructive', title: 'No recipients', description: 'Refresh recipients first.' });
      return;
    }
    if (!confirm(`Send "${template.name}" to ${list.length} recipient(s)?`)) return;

    setSending(true);
    let ok = 0, fail = 0;
    const errors = [];

    for (const r of list) {
      try {
        const vars = {
          parent_name: r.parent_name,
          student_name: r.student_name,
          class_name: r.class_name,
          subject: subjectOverride || 'מעלדונג',
          message: messageBody || '',
          school_name: SCHOOL_NAME_YI,
        };
        const rendered = renderTemplate(template, vars);
        await sendEmail({
          to: r.email,
          subject: rendered.subject,
          body: rendered.body_html,
          relatedType: 'announcement',
          relatedId: r.student_id,
          sentBy: user?.id,
        });
        ok++;
      } catch (err) {
        console.error('Announcement send failed:', err);
        fail++;
        errors.push(`${r.email}: ${err.message || err}`);
      }
    }
    setSending(false);
    setSentSummary({ ok, fail, errors });
    toast({
      title: 'Announcement sent',
      description: `${ok} delivered, ${fail} failed`,
      variant: fail > 0 ? 'destructive' : 'default',
    });
  };

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="text-blue-600" /> Mass Announcements
        </h1>
        <p className="text-sm text-slate-500">Pick an audience, a template, and review recipients before sending.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Configuration */}
        <Card className="col-span-7">
          <CardHeader><CardTitle className="text-base">Configure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audience</Label>
              <div className="flex gap-2 mt-1">
                {['all', 'grade', 'class'].map(opt => (
                  <Button
                    key={opt}
                    size="sm"
                    variant={audience === opt ? 'default' : 'outline'}
                    onClick={() => { setAudience(opt); setAudienceId(''); setRecipients([]); }}
                  >
                    {opt === 'all' ? 'All Students' : opt === 'grade' ? 'By Grade' : 'By Class'}
                  </Button>
                ))}
              </div>
            </div>

            {audience === 'grade' && (
              <div>
                <Label>Grade</Label>
                <select className="w-full border rounded px-2 py-2 text-sm" value={audienceId} onChange={(e) => { setAudienceId(e.target.value); setRecipients([]); }}>
                  <option value="">-- pick a grade --</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            {audience === 'class' && (
              <div>
                <Label>Class</Label>
                <select className="w-full border rounded px-2 py-2 text-sm" value={audienceId} onChange={(e) => { setAudienceId(e.target.value); setRecipients([]); }}>
                  <option value="">-- pick a class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <Label>Send to</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { v: 'father', label: 'Fathers' },
                  { v: 'mother', label: 'Mothers' },
                  { v: 'both', label: 'Both parents' },
                ].map(opt => (
                  <Button key={opt.v} size="sm" variant={contactType === opt.v ? 'default' : 'outline'} onClick={() => { setContactType(opt.v); setRecipients([]); }}>
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Template</Label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                {templates.map(t => <option key={t.id} value={t.key}>{t.name}</option>)}
              </select>
              {template?.description && <p className="text-xs text-slate-500 mt-1">{template.description}</p>}
            </div>

            {template?.key === 'general_announcement' && (
              <>
                <div>
                  <Label>Subject (overrides template <code>{'{{subject}}'}</code>)</Label>
                  <Input value={subjectOverride} onChange={(e) => setSubjectOverride(e.target.value)} placeholder="e.g. וויכטיגע מעלדונג" />
                </div>
                <div>
                  <Label>Message body (HTML allowed)</Label>
                  <Textarea rows={6} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Your announcement…" />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={refreshRecipients}>
                <RefreshCw size={14} className="mr-1" /> Refresh recipients
              </Button>
              <Button onClick={send} disabled={sending || !recipients.length}>
                <Send size={14} className="mr-1" /> {sending ? 'Sending…' : `Send to ${recipients.length}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview + recipients */}
        <Card className="col-span-5 max-h-[85vh] overflow-y-auto">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye size={16} /> Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Subject</div>
              <div className="font-medium text-sm">{preview.subject || <span className="text-slate-400">(empty)</span>}</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Body (rendered for first recipient)</div>
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: preview.body_html || '<em class="text-slate-400">(empty)</em>' }} />
            </div>
            {preview.missing.length > 0 && (
              <div className="flex items-start gap-2 border border-amber-300 bg-amber-50 rounded p-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="mt-0.5" />
                <div><strong>Unresolved:</strong> {preview.missing.join(', ')}</div>
              </div>
            )}

            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Users size={12} /> Recipients ({recipients.length})
              </div>
              {recipients.length === 0 ? (
                <p className="text-xs text-slate-500">Click “Refresh recipients” to load.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                  {recipients.slice(0, 50).map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0">
                      <span className="truncate"><strong>{r.parent_name || '—'}</strong> · {r.student_name}</span>
                      <span className="text-slate-500 truncate">{r.email}</span>
                    </div>
                  ))}
                  {recipients.length > 50 && <p className="text-slate-400 text-center pt-1">…and {recipients.length - 50} more</p>}
                </div>
              )}
            </div>

            {sentSummary && (
              <div className={`border rounded p-2 text-xs ${sentSummary.fail ? 'border-red-300 bg-red-50 text-red-900' : 'border-green-300 bg-green-50 text-green-900'}`}>
                <strong>Last send:</strong> {sentSummary.ok} ok, {sentSummary.fail} failed
                {sentSummary.errors.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer">View errors</summary>
                    <ul className="list-disc pl-4 mt-1">
                      {sentSummary.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnouncementsView;
