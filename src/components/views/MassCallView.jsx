import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendCall } from '@/lib/callService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PhoneCall, Send, Eye, RefreshCw, Users, AlertTriangle, Volume2 } from 'lucide-react';

// Voices SignalWire / Amazon Polly supports for our use cases
const VOICE_OPTIONS = [
  { id: 'Polly.Joanna',    label: 'Joanna (English, female)',         language: 'en-US' },
  { id: 'Polly.Matthew',   label: 'Matthew (English, male)',          language: 'en-US' },
  { id: 'Polly.Carmen',    label: 'Carmen (Hebrew, female)',          language: 'he-IL' },
  { id: 'Polly.Tatyana',   label: 'Tatyana (Russian, female)',        language: 'ru-RU' },
  // Polly does not have a Yiddish voice. Hebrew/English are the closest.
];

const TEST_MESSAGE_DEFAULT =
  'Hello, this is a test call from the Talmud Torah Toldos Yaakov Yosef d\'Skvere office. Please disregard.';

const MassCallView = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [audience, setAudience] = useState('all'); // all | grade | class | custom
  const [audienceId, setAudienceId] = useState('');
  const [contactType, setContactType] = useState('father'); // father | mother | both | home
  const [voiceId, setVoiceId] = useState('Polly.Joanna');
  const [message, setMessage] = useState('');
  const [customNumbers, setCustomNumbers] = useState(''); // newline / comma separated
  const [recipients, setRecipients] = useState([]); // [{ phone, parent_name, student_name, ... }]
  const [sending, setSending] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  // Test-call (single) field
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [g, c] = await Promise.all([
        supabase.from('grades').select('id, name').order('name'),
        supabase.from('classes').select('id, name, grade_id').order('name'),
      ]);
      setGrades(g.data || []);
      setClasses(c.data || []);
      setLoading(false);
    })();
  }, []);

  const voice = useMemo(() => VOICE_OPTIONS.find(v => v.id === voiceId) || VOICE_OPTIONS[0], [voiceId]);

  // Build recipient list based on audience selection
  const computeRecipients = async () => {
    if (audience === 'custom') {
      const parts = customNumbers.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      return parts.map(p => ({ phone: p, parent_name: '', student_name: '', class_name: '', student_id: null }));
    }

    let query = supabase
      .from('students')
      .select('id, first_name, last_name, hebrew_name, father_name, father_phone, mother_name, mother_phone, home_phone, class_id, class:classes(id, name, grade_id)');

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
      const className = s.class?.name || '';

      const pushIf = (phone, parent_name, kind) => {
        if (!phone) return;
        list.push({ phone, parent_name, student_name: baseName, class_name: className, student_id: s.id, kind });
      };

      if (contactType === 'home') {
        pushIf(s.home_phone, '', 'home');
      } else {
        if ((contactType === 'father' || contactType === 'both')) pushIf(s.father_phone, s.father_name || '', 'father');
        if ((contactType === 'mother' || contactType === 'both')) pushIf(s.mother_phone, s.mother_name || '', 'mother');
      }
    });
    return list;
  };

  const refreshRecipients = async () => {
    const list = await computeRecipients();
    setRecipients(list);
    toast({ title: `Found ${list.length} phone number(s)` });
  };

  const sendTest = async () => {
    if (!testNumber.trim()) {
      toast({ variant: 'destructive', title: 'Enter a phone number' });
      return;
    }
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Enter a message first' });
      return;
    }
    setTesting(true);
    try {
      const res = await sendCall({
        to: testNumber.trim(),
        message,
        voice: voice.id,
        language: voice.language,
        relatedType: 'test',
        sentBy: user?.id,
      });
      const r = res.results?.[0];
      if (r?.status === 'queued') {
        toast({ title: 'Test call placed', description: `${r.to} — ringing now` });
      } else {
        toast({ variant: 'destructive', title: 'Test failed', description: r?.error || 'unknown error' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Test failed', description: err.message });
    }
    setTesting(false);
  };

  const send = async () => {
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Enter a message' });
      return;
    }
    const list = recipients.length ? recipients : await computeRecipients();
    if (!list.length) {
      toast({ variant: 'destructive', title: 'No recipients', description: 'Refresh recipients first.' });
      return;
    }
    if (!confirm(`Place ${list.length} call(s)? Each call will cost ~1¢ on SignalWire.`)) return;

    setSending(true);
    setSentSummary(null);
    let ok = 0, fail = 0;
    const errors = [];

    // Send in chunks of 50 (server cap is 250 per request)
    const CHUNK = 50;
    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK);
      try {
        const res = await sendCall({
          to: chunk.map(r => r.phone),
          message,
          voice: voice.id,
          language: voice.language,
          relatedType: 'mass_call',
          sentBy: user?.id,
        });
        ok += res.ok || 0;
        fail += res.failed || 0;
        (res.results || []).forEach((r) => {
          if (r.status !== 'queued') errors.push(`${r.to}: ${r.error || r.status}`);
        });
      } catch (err) {
        fail += chunk.length;
        errors.push(`Batch error: ${err.message}`);
      }
    }
    setSending(false);
    setSentSummary({ ok, fail, errors });
    toast({
      title: 'Mass call complete',
      description: `${ok} placed, ${fail} failed`,
      variant: fail > 0 ? 'destructive' : 'default',
    });
  };

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PhoneCall className="text-emerald-600" /> Mass Phone Call
        </h1>
        <p className="text-sm text-slate-500">
          Type a short message and we'll robocall the selected parents. Powered by SignalWire.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5" />
        <div>
          <strong>Heads up:</strong> Each call costs roughly 1¢ on your SignalWire account.
          Always send a <em>test call</em> to your own phone first to make sure the message sounds right.
          Yiddish text-to-speech is not available — Hebrew (Carmen) is the closest voice for Hebrew text;
          for Yiddish, write the script phonetically in English letters and use an English voice.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Configuration */}
        <Card className="col-span-7">
          <CardHeader><CardTitle className="text-base">Configure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audience</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {[
                  { v: 'all',    label: 'All students' },
                  { v: 'grade',  label: 'By grade' },
                  { v: 'class',  label: 'By class' },
                  { v: 'custom', label: 'Custom numbers' },
                ].map(opt => (
                  <Button
                    key={opt.v}
                    size="sm"
                    variant={audience === opt.v ? 'default' : 'outline'}
                    onClick={() => { setAudience(opt.v); setAudienceId(''); setRecipients([]); }}
                  >
                    {opt.label}
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
            {audience === 'custom' && (
              <div>
                <Label>Phone numbers (one per line)</Label>
                <Textarea
                  rows={4}
                  value={customNumbers}
                  onChange={(e) => { setCustomNumbers(e.target.value); setRecipients([]); }}
                  placeholder={'+18455551234\n+18455559876'}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {audience !== 'custom' && (
              <div>
                <Label>Call which phone</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[
                    { v: 'father', label: "Father's phone" },
                    { v: 'mother', label: "Mother's phone" },
                    { v: 'both',   label: 'Both parents' },
                    { v: 'home',   label: 'Home phone' },
                  ].map(opt => (
                    <Button key={opt.v} size="sm" variant={contactType === opt.v ? 'default' : 'outline'} onClick={() => { setContactType(opt.v); setRecipients([]); }}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="flex items-center gap-1"><Volume2 size={14} /> Voice</Label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                {VOICE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <Label>Spoken message</Label>
              <Textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={TEST_MESSAGE_DEFAULT}
                dir={voice.language === 'he-IL' ? 'rtl' : 'ltr'}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: keep it under 30 seconds. The message is repeated twice automatically (in case the parent missed the start).
                Character count: {message.length}
              </p>
            </div>

            {/* Test call */}
            <div className="border rounded p-3 bg-slate-50">
              <Label className="text-sm">Send a test call to one number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  placeholder="+18455551234 or 8455551234"
                  className="flex-1 font-mono text-sm"
                />
                <Button variant="outline" onClick={sendTest} disabled={testing}>
                  <PhoneCall size={14} className="mr-1" /> {testing ? 'Calling…' : 'Test call'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={refreshRecipients}>
                <RefreshCw size={14} className="mr-1" /> Refresh recipients
              </Button>
              <Button onClick={send} disabled={sending || !recipients.length} className="bg-emerald-600 hover:bg-emerald-700">
                <Send size={14} className="mr-1" /> {sending ? 'Calling…' : `Place ${recipients.length} call${recipients.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview + recipients */}
        <Card className="col-span-5 max-h-[85vh] overflow-y-auto">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye size={16} /> Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Voice</div>
              <div className="text-sm">{voice.label}</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Message that will be spoken</div>
              <div
                className="text-sm whitespace-pre-wrap"
                dir={voice.language === 'he-IL' ? 'rtl' : 'ltr'}
              >
                {message || <em className="text-slate-400">(empty)</em>}
              </div>
            </div>

            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Users size={12} /> Recipients ({recipients.length})
              </div>
              {recipients.length === 0 ? (
                <p className="text-xs text-slate-500">Click “Refresh recipients” to load.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                  {recipients.slice(0, 80).map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0">
                      <span className="truncate">
                        {r.student_name && <strong>{r.student_name}</strong>}
                        {r.parent_name && <span className="text-slate-500"> · {r.parent_name}</span>}
                        {r.kind && <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{r.kind}</Badge>}
                      </span>
                      <span className="text-slate-500 truncate font-mono">{r.phone}</span>
                    </div>
                  ))}
                  {recipients.length > 80 && <p className="text-slate-400 text-center pt-1">…and {recipients.length - 80} more</p>}
                </div>
              )}
            </div>

            {sentSummary && (
              <div className="border rounded p-2 bg-emerald-50 border-emerald-200">
                <div className="text-xs">
                  <strong className="text-emerald-700">{sentSummary.ok}</strong> placed,{' '}
                  <strong className="text-red-700">{sentSummary.fail}</strong> failed
                </div>
                {sentSummary.errors.length > 0 && (
                  <details className="mt-2 text-[11px]">
                    <summary className="cursor-pointer text-red-700">View errors</summary>
                    <ul className="mt-1 space-y-0.5">
                      {sentSummary.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
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

export default MassCallView;
