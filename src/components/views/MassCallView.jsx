import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendCall, recordByPhone, listRecordings, deleteRecording, uploadRecording } from '@/lib/callService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PhoneCall, Send, Eye, RefreshCw, Users, AlertTriangle, Upload, Mic, Trash2 } from 'lucide-react';

const MassCallView = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [audience, setAudience] = useState('all'); // all | grade | class | staff_all | staff_position | custom
  const [audienceId, setAudienceId] = useState('');
  const [contactType, setContactType] = useState('father'); // father | mother | both | home | all_phones
  const [customNumbers, setCustomNumbers] = useState(''); // newline / comma separated
  const [recipients, setRecipients] = useState([]); // [{ phone, parent_name, student_name, ... }]
  const [recipientStats, setRecipientStats] = useState(null); // { totalLoaded, afterFilter, withPhones }
  const [excluded, setExcluded] = useState(() => new Set()); // phone strings excluded from send
  const [sending, setSending] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  const [recordings, setRecordings] = useState([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const fileInputRef = useRef(null);

  // Record-by-phone
  const [recordPhone, setRecordPhone] = useState('');
  const [recordLabel, setRecordLabel] = useState('');
  const [triggeringRecord, setTriggeringRecord] = useState(false);

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
      // distinct staff positions (active only)
      const { data: staffRows } = await supabase
        .from('staff_members')
        .select('position')
        .eq('is_active', true);
      const distinct = Array.from(new Set((staffRows || []).map(r => r.position).filter(Boolean))).sort();
      setPositions(distinct);
      setLoading(false);
    })();
    refreshRecordings();
  }, []);

  const refreshRecordings = async () => {
    try {
      const list = await listRecordings();
      setRecordings(list);
    } catch (err) {
      console.warn('listRecordings failed:', err);
    }
  };

  const selectedRecording = useMemo(
    () => recordings.find(r => r.id === selectedRecordingId) || null,
    [recordings, selectedRecordingId]
  );

  const onUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 10 MB. Trim or compress the audio.' });
      return;
    }
    setUploadingFile(true);
    try {
      const row = await uploadRecording({ file, label: uploadLabel || file.name, userId: user?.id });
      toast({ title: 'Uploaded', description: row.label });
      setUploadLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshRecordings();
      setSelectedRecordingId(row.id);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    }
    setUploadingFile(false);
  };

  const triggerRecordByPhone = async () => {
    if (!recordPhone.trim()) {
      toast({ variant: 'destructive', title: 'Enter your phone number first' });
      return;
    }
    setTriggeringRecord(true);
    try {
      const res = await recordByPhone({ to: recordPhone.trim(), label: recordLabel || `Recording ${new Date().toLocaleString()}` });
      toast({
        title: 'Calling you now',
        description: 'Pick up, listen for the beep, record, then press # when done. The recording will appear in the library shortly.',
      });
      // Poll for the new recording for up to 5 minutes
      const sid = res.sid;
      const deadline = Date.now() + 5 * 60 * 1000;
      const poll = async () => {
        if (Date.now() > deadline) return;
        await refreshRecordings();
        const list = await listRecordings();
        const fresh = list.find(r => r.source === 'phone' && new Date(r.created_at).getTime() > Date.now() - 6 * 60 * 1000);
        if (fresh) {
          setRecordings(list);
          setSelectedRecordingId(fresh.id);
          toast({ title: 'Recording saved!', description: fresh.label });
          return;
        }
        setTimeout(poll, 5000);
      };
      setTimeout(poll, 8000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not start recording call', description: err.message });
    }
    setTriggeringRecord(false);
  };

  const onDeleteRecording = async (rec) => {
    if (!confirm(`Delete recording "${rec.label}"?`)) return;
    try {
      await deleteRecording(rec);
      if (selectedRecordingId === rec.id) setSelectedRecordingId('');
      await refreshRecordings();
      toast({ title: 'Deleted' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
    }
  };

  // Build recipient list based on audience selection
  const computeRecipients = async () => {
    if (audience === 'custom') {
      const parts = customNumbers.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      return parts.map(p => ({ phone: p, parent_name: '', student_name: '', class_name: '', student_id: null }));
    }

    // Staff audiences (all staff or filtered by position)
    if (audience === 'staff_all' || audience === 'staff_position') {
      let q = supabase
        .from('staff_members')
        .select('id, full_name, hebrew_name, position, cell_phone, home_phone, is_active')
        .eq('is_active', true);
      if (audience === 'staff_position' && audienceId) {
        q = q.eq('position', audienceId);
      }
      const { data, error } = await q;
      if (error) {
        toast({ variant: 'destructive', title: 'Failed to load staff', description: error.message });
        return [];
      }
      const list = [];
      let totalStaff = 0;
      (data || []).forEach(s => {
        totalStaff++;
        const name = s.hebrew_name || s.full_name || '';
        const phone = s.cell_phone || s.home_phone;
        if (!phone) return;
        list.push({
          phone,
          parent_name: '',
          student_name: name,
          class_name: s.position || '',
          student_id: null,
          kind: 'staff',
        });
      });
      console.log(`[MassCall] staff: ${totalStaff} loaded, ${list.length} with phones`);
      setRecipientStats({ totalLoaded: totalStaff, afterFilter: totalStaff, withPhones: list.length, kind: 'staff' });
      return list;
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
    const totalStudents = students.length;
    if (audience === 'grade' && audienceId) {
      students = students.filter(s => s.class?.grade_id === audienceId);
    }
    const filteredStudents = students.length;

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
      } else if (contactType === 'all_phones') {
        pushIf(s.father_phone, s.father_name || '', 'father');
        pushIf(s.mother_phone, s.mother_name || '', 'mother');
        pushIf(s.home_phone,   '',                  'home');
      } else {
        if ((contactType === 'father' || contactType === 'both')) pushIf(s.father_phone, s.father_name || '', 'father');
        if ((contactType === 'mother' || contactType === 'both')) pushIf(s.mother_phone, s.mother_name || '', 'mother');
      }
    });
    console.log(`[MassCall] students: ${totalStudents} total, ${filteredStudents} after filter, ${list.length} with phones in '${contactType}' field(s)`);
    setRecipientStats({ totalLoaded: totalStudents, afterFilter: filteredStudents, withPhones: list.length, kind: 'students', contactType });
    return list;
  };

  const refreshRecipients = async () => {
    const list = await computeRecipients();
    setRecipients(list);
    setExcluded(new Set()); // reset exclusions on refresh
    if (list.length === 0) {
      const isStaff = audience === 'staff_all' || audience === 'staff_position';
      const detail = isStaff
        ? 'No active staff have a cell or home phone in this group.'
        : `No students in this group have a phone in the "${contactType}" field. Try "All phones" to include father, mother, and home.`;
      toast({ variant: 'destructive', title: 'No phone numbers found', description: detail });
    } else {
      toast({ title: `Found ${list.length} phone number(s)` });
    }
  };

  const toggleExcluded = (phone) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      return next;
    });
  };

  const activeRecipients = useMemo(
    () => recipients.filter(r => !excluded.has(r.phone)),
    [recipients, excluded]
  );

  const sendTest = async () => {
    if (!testNumber.trim()) {
      toast({ variant: 'destructive', title: 'Enter a phone number' });
      return;
    }
    if (!selectedRecording) {
      toast({ variant: 'destructive', title: 'Pick a recording first' });
      return;
    }
    setTesting(true);
    try {
      const res = await sendCall({
        to: testNumber.trim(),
        audioUrl: selectedRecording.audio_url,
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
    if (!selectedRecording) {
      toast({ variant: 'destructive', title: 'Pick a recording first' });
      return;
    }
    const list = activeRecipients.length ? activeRecipients : (await computeRecipients()).filter(r => !excluded.has(r.phone));
    if (!list.length) {
      toast({ variant: 'destructive', title: 'No recipients', description: 'Refresh recipients first, or un-exclude some.' });
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
          audioUrl: selectedRecording.audio_url,
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
          Upload an audio file or record one by phone, then we'll robocall the selected parents. Powered by SignalWire.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5" />
        <div>
          <strong>Heads up:</strong> Each call costs roughly 1¢ on your SignalWire account.
          Always send a <em>test call</em> to your own phone first to make sure the recording sounds right.
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
                  { v: 'all',             label: 'All students' },
                  { v: 'grade',           label: 'By grade' },
                  { v: 'class',           label: 'By class' },
                  { v: 'staff_all',       label: 'All staff' },
                  { v: 'staff_position',  label: 'By position' },
                  { v: 'custom',          label: 'Custom numbers' },
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
            {audience === 'staff_position' && (
              <div>
                <Label>Position</Label>
                <select className="w-full border rounded px-2 py-2 text-sm" value={audienceId} onChange={(e) => { setAudienceId(e.target.value); setRecipients([]); }}>
                  <option value="">-- pick a position --</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
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

            {audience !== 'custom' && audience !== 'staff_all' && audience !== 'staff_position' && (
              <div>
                <Label>Call which phone</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[
                    { v: 'father',     label: "Father's phone" },
                    { v: 'mother',     label: "Mother's phone" },
                    { v: 'both',       label: 'Father & Mother' },
                    { v: 'all_phones', label: 'All (Father + Mother + Home)' },
                    { v: 'home',       label: 'Home phone only' },
                  ].map(opt => (
                    <Button key={opt.v} size="sm" variant={contactType === opt.v ? 'default' : 'outline'} onClick={() => { setContactType(opt.v); setRecipients([]); }}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">What should the parents hear?</Label>
              <p className="text-[11px] text-slate-500">Pick a recording from the library, upload one, or call yourself to record.</p>
            </div>

            <div className="space-y-3">
                {/* Library */}
                <div className="border rounded p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Recording library</Label>
                    <Button size="sm" variant="ghost" onClick={refreshRecordings}>
                      <RefreshCw size={12} className="mr-1" /> Refresh
                    </Button>
                  </div>
                  {recordings.length === 0 ? (
                    <p className="text-xs text-slate-500">No recordings yet. Upload a file or call yourself to record one.</p>
                  ) : (
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {recordings.map(r => (
                        <div
                          key={r.id}
                          className={`flex items-center gap-2 p-2 rounded border-2 transition cursor-pointer ${
                            selectedRecordingId === r.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-transparent bg-white hover:border-slate-200'
                          }`}
                          onClick={() => setSelectedRecordingId(r.id)}
                        >
                          <input
                            type="radio"
                            checked={selectedRecordingId === r.id}
                            onChange={() => setSelectedRecordingId(r.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{r.label}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] py-0 px-1">{r.source}</Badge>
                              {r.duration_sec ? <span>{r.duration_sec}s</span> : null}
                              <span>{new Date(r.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <audio controls preload="none" className="h-7" style={{ maxWidth: 180 }}>
                            <source src={r.audio_url} />
                          </audio>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onDeleteRecording(r); }}
                            className="text-red-600"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload file */}
                <div className="border rounded p-3">
                  <Label className="text-sm font-semibold flex items-center gap-1"><Upload size={14} /> Upload audio file</Label>
                  <p className="text-[11px] text-slate-500 mb-2">MP3, WAV, M4A or OGG. Max 10 MB.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Label (optional, e.g. 'Snow day')"
                      value={uploadLabel}
                      onChange={(e) => setUploadLabel(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={onUploadFile}
                      ref={fileInputRef}
                      disabled={uploadingFile}
                      className="text-xs"
                    />
                  </div>
                  {uploadingFile && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
                </div>

                {/* Record by phone */}
                <div className="border rounded p-3 bg-blue-50/40">
                  <Label className="text-sm font-semibold flex items-center gap-1"><Mic size={14} /> Record by phone</Label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    We'll call your phone — pick up, speak after the beep, press <strong>#</strong> when done.
                    The recording will appear in the library above.
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Your phone (e.g. 8455551234)"
                      value={recordPhone}
                      onChange={(e) => setRecordPhone(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Input
                      placeholder="Label (optional)"
                      value={recordLabel}
                      onChange={(e) => setRecordLabel(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={triggerRecordByPhone}
                      disabled={triggeringRecord}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <PhoneCall size={14} className="mr-1" />
                      {triggeringRecord ? 'Calling…' : 'Call me to record'}
                    </Button>
                  </div>
                </div>
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
              <Button onClick={send} disabled={sending || !activeRecipients.length} className="bg-emerald-600 hover:bg-emerald-700">
                <Send size={14} className="mr-1" /> {sending ? 'Calling…' : `Place ${activeRecipients.length} call${activeRecipients.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview + recipients */}
        <Card className="col-span-5 max-h-[85vh] overflow-y-auto">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye size={16} /> Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Recording</div>
              <div className="text-sm">
                {selectedRecording?.label || <em className="text-slate-400">no recording selected</em>}
              </div>
            </div>
            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Recording that will be played</div>
              {selectedRecording ? (
                <audio controls className="w-full">
                  <source src={selectedRecording.audio_url} />
                </audio>
              ) : (
                <em className="text-slate-400 text-sm">Pick a recording from the library on the left</em>
              )}
            </div>

            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1"><Users size={12} /> Recipients ({activeRecipients.length}{excluded.size > 0 ? ` of ${recipients.length}` : ''})</span>
                {excluded.size > 0 && (
                  <button onClick={() => setExcluded(new Set())} className="text-blue-600 hover:underline normal-case text-[10px]">
                    Restore {excluded.size} excluded
                  </button>
                )}
              </div>
              {recipientStats && (
                <div className="text-[11px] text-slate-600 bg-slate-50 border rounded p-2 mb-2 space-y-0.5">
                  {recipientStats.kind === 'students' ? (
                    <>
                      <div>• Students loaded: <strong>{recipientStats.totalLoaded}</strong></div>
                      <div>• After grade/class filter: <strong>{recipientStats.afterFilter}</strong></div>
                      <div>• With phones in <em>{recipientStats.contactType}</em> field(s): <strong>{recipientStats.withPhones}</strong></div>
                      {recipientStats.totalLoaded === 0 && (
                        <div className="text-red-600 mt-1">⚠️ No students loaded — check Supabase RLS or login.</div>
                      )}
                      {recipientStats.totalLoaded > 0 && recipientStats.afterFilter === 0 && (
                        <div className="text-amber-700 mt-1">⚠️ Filter removed all students — selected grade/class has no linked students.</div>
                      )}
                      {recipientStats.afterFilter > 0 && recipientStats.withPhones === 0 && (
                        <div className="text-amber-700 mt-1">⚠️ Students found but none have phones in the chosen field.</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>• Active staff loaded: <strong>{recipientStats.totalLoaded}</strong></div>
                      <div>• With cell or home phone: <strong>{recipientStats.withPhones}</strong></div>
                    </>
                  )}
                </div>
              )}
              {recipients.length === 0 ? (
                <p className="text-xs text-slate-500">Click “Refresh recipients” to load.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                  {recipients.slice(0, 200).map((r, i) => {
                    const isExcluded = excluded.has(r.phone);
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0 ${
                          isExcluded ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        <span className="truncate flex-1">
                          {r.student_name && <strong>{r.student_name}</strong>}
                          {r.parent_name && <span className="text-slate-500"> · {r.parent_name}</span>}
                          {r.kind && <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">{r.kind}</Badge>}
                        </span>
                        <span className="text-slate-500 truncate font-mono">{r.phone}</span>
                        <button
                          onClick={() => toggleExcluded(r.phone)}
                          className={`text-[10px] px-1 rounded ${isExcluded ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'}`}
                          title={isExcluded ? 'Include' : 'Exclude'}
                        >
                          {isExcluded ? '↶' : '✕'}
                        </button>
                      </div>
                    );
                  })}
                  {recipients.length > 200 && <p className="text-slate-400 text-center pt-1">…and {recipients.length - 200} more</p>}
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
