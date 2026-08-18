import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, GraduationCap,
  Plus, Trash2, Clock, MapPin, AlertTriangle, RefreshCw, Printer,
} from 'lucide-react';

// ---------- config ----------
const DAY_START = 8 * 60;   // 8:00 AM
const DAY_END = 20 * 60;    // 8:00 PM
const SLOT_MIN = 30;        // grid granularity
const ROW_H = 30;           // px per 30-min slot
const DAYS = [
  { idx: 0, he: 'זונטאג', label: 'Sun' },
  { idx: 1, he: 'מאנטאג', label: 'Mon' },
  { idx: 2, he: 'דינסטאג', label: 'Tue' },
  { idx: 3, he: 'מיטוואך', label: 'Wed' },
  { idx: 4, he: 'דאנערשטאג', label: 'Thu' },
  { idx: 5, he: 'פרייטאג', label: 'Fri' },
];
const DURATIONS = [15, 20, 30, 45, 60, 90, 120];
const BLOCK_COLORS = [
  'bg-purple-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
];

// ---------- time helpers ----------
const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};
const toTimeStr = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fmtTime = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
};
const isoDate = (d) => d.toISOString().slice(0, 10);
const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  return x;
};
const studentName = (s) =>
  s ? (s.hebrew_name || s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Student') : 'Student';
const staffName = (s) => (s ? (s.hebrew_name || s.name || 'Staff') : '');

const ROWS = Array.from({ length: (DAY_END - DAY_START) / SLOT_MIN }, (_, i) => DAY_START + i * SLOT_MIN);

const ScheduleView = ({ currentUser }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const me = currentUser || profile;

  const [mode, setMode] = useState('student'); // 'student' | 'staff'
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] = useState(null); // { editing, form }
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(
    () => DAYS.map((d) => { const x = new Date(weekStart); x.setDate(weekStart.getDate() + d.idx); return x; }),
    [weekStart]
  );

  // ---------- load pickers ----------
  useEffect(() => {
    (async () => {
      const [st, sf] = await Promise.all([
        supabase.from('students').select('id, name, hebrew_name, first_name, last_name, class').order('name'),
        supabase.from('special_ed_staff').select('id, name, hebrew_name, role').eq('is_active', true).order('name'),
      ]);
      setStudents(st.data || []);
      setStaff(sf.data || []);
    })();
  }, []);

  // ---------- load appointments for the current selection ----------
  const load = useCallback(async () => {
    const filterId = mode === 'student' ? selectedStudent : selectedStaff;
    if (!filterId) { setAppts([]); return; }
    setLoading(true);
    try {
      let q = supabase
        .from('tutoring_schedule')
        .select('*, student:students(id, name, hebrew_name, first_name, last_name, class), staff:special_ed_staff(id, name, hebrew_name, role)')
        .eq('is_active', true);
      q = mode === 'student' ? q.eq('student_id', filterId) : q.eq('staff_id', filterId);
      const { data, error } = await q;
      if (error) throw error;
      setAppts(data || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not load schedule.' });
    }
    setLoading(false);
  }, [mode, selectedStudent, selectedStaff, toast]);

  useEffect(() => { load(); }, [load]);

  // ---------- appointments that fall on a given date ----------
  const apptsForDate = useCallback((date) => {
    const iso = isoDate(date);
    const dow = date.getDay();
    return appts.filter((a) =>
      a.appointment_date ? a.appointment_date.slice(0, 10) === iso : (a.is_recurring !== false && a.day_of_week === dow)
    );
  }, [appts]);

  // overlap flag within a column (mainly meaningful in staff mode)
  const withOverlapFlags = (list) => {
    const sorted = [...list].sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
    return sorted.map((a, i) => {
      const aStart = toMin(a.start_time);
      const aEnd = aStart + (a.duration_minutes || 30);
      const conflict = sorted.some((b, j) => {
        if (i === j) return false;
        const bStart = toMin(b.start_time);
        const bEnd = bStart + (b.duration_minutes || 30);
        return aStart < bEnd && bStart < aEnd;
      });
      return { ...a, _conflict: conflict };
    });
  };

  // ---------- dialog helpers ----------
  const openAdd = (date, startMin) => {
    if (mode === 'student' && !selectedStudent) { toast({ title: 'Pick a student first' }); return; }
    if (mode === 'staff' && !selectedStaff) { toast({ title: 'Pick a staff member first' }); return; }
    setDialog({
      editing: null,
      form: {
        student_id: mode === 'student' ? selectedStudent : '',
        staff_id: mode === 'staff' ? selectedStaff : '',
        tutor_name: '',
        subject: '',
        location: '',
        day_of_week: date.getDay(),
        start_time: toTimeStr(startMin),
        duration_minutes: 30,
        recurrence: 'weekly', // 'weekly' | 'once'
        appointment_date: isoDate(date),
        notes: '',
      },
    });
  };

  const openEdit = (a) => {
    setDialog({
      editing: a,
      form: {
        student_id: a.student_id || '',
        staff_id: a.staff_id || '',
        tutor_name: a.tutor_name || '',
        subject: a.subject || '',
        location: a.location || '',
        day_of_week: a.day_of_week ?? new Date().getDay(),
        start_time: (a.start_time || '08:00').slice(0, 5),
        duration_minutes: a.duration_minutes || 30,
        recurrence: a.appointment_date ? 'once' : 'weekly',
        appointment_date: a.appointment_date ? a.appointment_date.slice(0, 10) : isoDate(new Date()),
        notes: a.notes || '',
      },
    });
  };

  const setForm = (patch) => setDialog((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const save = async () => {
    const f = dialog.form;
    if (!f.student_id) { toast({ variant: 'destructive', title: 'A student is required' }); return; }
    if (!f.start_time) { toast({ variant: 'destructive', title: 'A start time is required' }); return; }
    setSaving(true);
    const once = f.recurrence === 'once';
    const payload = {
      student_id: f.student_id,
      staff_id: f.staff_id || null,
      tutor_name: f.tutor_name || null,
      subject: f.subject || null,
      location: f.location || null,
      start_time: f.start_time.length === 5 ? `${f.start_time}:00` : f.start_time,
      duration_minutes: Number(f.duration_minutes) || 30,
      is_recurring: !once,
      day_of_week: once ? null : Number(f.day_of_week),
      appointment_date: once ? f.appointment_date : null,
      notes: f.notes || null,
      is_active: true,
    };
    try {
      let error;
      if (dialog.editing) {
        ({ error } = await supabase.from('tutoring_schedule').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', dialog.editing.id));
      } else {
        ({ error } = await supabase.from('tutoring_schedule').insert({ ...payload, created_by: me?.id || null }));
      }
      if (error) throw error;
      toast({ title: 'Saved', description: 'Appointment saved.' });
      setDialog(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not save.' });
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!dialog?.editing) return;
    if (!window.confirm('Delete this appointment?')) return;
    const { error } = await supabase.from('tutoring_schedule').delete().eq('id', dialog.editing.id);
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    setDialog(null);
    load();
  };

  const colorFor = (a) => {
    // color by the "other" party so the same tutor/student keeps one color
    const keySource = mode === 'student' ? (a.staff_id || a.tutor_name || 'x') : a.student_id;
    let h = 0;
    for (const c of String(keySource)) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return BLOCK_COLORS[h % BLOCK_COLORS.length];
  };

  const selectionLabel = mode === 'student'
    ? studentName(students.find((s) => s.id === selectedStudent))
    : staffName(staff.find((s) => s.id === selectedStaff));

  const hasSelection = mode === 'student' ? !!selectedStudent : !!selectedStaff;

  const printSchedule = () => {
    if (!hasSelection) return;
    const win = window.open('', '_blank');
    if (!win) { toast({ variant: 'destructive', title: 'Popup blocked' }); return; }
    const rowsHtml = weekDates.map((date, di) => {
      const list = withOverlapFlags(apptsForDate(date)).sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
      if (!list.length) return '';
      const items = list.map((a) => {
        const other = mode === 'student' ? (staffName(a.staff) || a.tutor_name || '—') : studentName(a.student);
        const s = toMin(a.start_time);
        return `<tr><td>${fmtTime(s)}–${fmtTime(s + (a.duration_minutes || 30))}</td><td>${other}</td><td>${a.subject || ''}</td><td>${a.location || ''}</td></tr>`;
      }).join('');
      return `<h3>${DAYS[di].label} · ${date.toLocaleDateString()}</h3><table><thead><tr><th>Time</th><th>${mode === 'student' ? 'Tutor' : 'Student'}</th><th>Subject</th><th>Location</th></tr></thead><tbody>${items}</tbody></table>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Schedule</title>
      <style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1e293b}h1{font-size:20px;margin:0 0 4px}h3{margin:16px 0 4px;color:#4f46e5}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left}th{background:#f1f5f9}</style>
      </head><body><h1>${selectionLabel} — Weekly Schedule</h1><div>${rowsHtml || '<p>No appointments.</p>'}</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="text-indigo-600" /> Appointment Schedule
        </h2>
        <div className="inline-flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setMode('student')}
            className={`px-4 py-1.5 text-sm flex items-center gap-1 ${mode === 'student' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
          >
            <GraduationCap size={15} /> By Student
          </button>
          <button
            onClick={() => setMode('staff')}
            className={`px-4 py-1.5 text-sm flex items-center gap-1 ${mode === 'staff' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
          >
            <User size={15} /> By Tutor / Staff
          </button>
        </div>

        {mode === 'student' ? (
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select a student…" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{studentName(s)}{s.class ? ` · ${s.class}` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select a tutor / staff…" /></SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{staffName(s)}{s.role ? ` · ${s.role.replace(/_/g, ' ')}` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}>
            <ChevronLeft size={16} />
          </Button>
          <button className="text-sm font-medium min-w-[150px] text-center hover:underline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {weekDates[5].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={!hasSelection}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={printSchedule} disabled={!hasSelection}><Printer size={14} className="mr-1" /> Print</Button>
        </div>
      </div>

      {!hasSelection ? (
        <Card><CardContent className="py-16 text-center text-slate-400">
          Choose a {mode === 'student' ? 'student' : 'tutor / staff member'} to view and edit their appointment schedule.
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {mode === 'student' ? <GraduationCap size={18} /> : <User size={18} />} {selectionLabel}
              {loading && <span className="text-xs text-slate-400 font-normal">· loading…</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* day headers */}
                <div className="grid" style={{ gridTemplateColumns: `64px repeat(6, 1fr)` }}>
                  <div />
                  {weekDates.map((date, i) => {
                    const isToday = isoDate(date) === isoDate(new Date());
                    return (
                      <div key={i} className={`text-center py-1 border-b ${isToday ? 'bg-indigo-50' : ''}`}>
                        <div className="text-[11px] font-semibold text-slate-700">{DAYS[i].he}</div>
                        <div className="text-[10px] text-slate-400">{date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
                      </div>
                    );
                  })}
                </div>

                {/* grid body */}
                <div className="grid" style={{ gridTemplateColumns: `64px repeat(6, 1fr)` }}>
                  {/* time gutter */}
                  <div>
                    {ROWS.map((min) => (
                      <div key={min} className="text-[10px] text-slate-400 text-right pr-2 border-b border-slate-100" style={{ height: ROW_H }}>
                        {min % 60 === 0 ? fmtTime(min) : ''}
                      </div>
                    ))}
                  </div>

                  {/* day columns */}
                  {weekDates.map((date, di) => {
                    const list = withOverlapFlags(apptsForDate(date));
                    return (
                      <div key={di} className="relative border-l">
                        {ROWS.map((min) => (
                          <div
                            key={min}
                            className="border-b border-slate-100 hover:bg-indigo-50/40 cursor-pointer"
                            style={{ height: ROW_H }}
                            onClick={() => openAdd(date, min)}
                            title={`Add at ${fmtTime(min)}`}
                          />
                        ))}
                        {list.map((a) => {
                          const s = toMin(a.start_time);
                          const top = ((s - DAY_START) / SLOT_MIN) * ROW_H;
                          const height = Math.max(((a.duration_minutes || 30) / SLOT_MIN) * ROW_H - 2, 16);
                          const other = mode === 'student' ? (staffName(a.staff) || a.tutor_name || 'Tutor') : studentName(a.student);
                          return (
                            <div
                              key={a.id}
                              onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                              className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-white text-[10px] overflow-hidden cursor-pointer shadow-sm ${colorFor(a)} ${a._conflict ? 'ring-2 ring-red-500' : ''}`}
                              style={{ top, height }}
                              title={`${other} · ${fmtTime(s)}–${fmtTime(s + (a.duration_minutes || 30))}${a.subject ? ` · ${a.subject}` : ''}`}
                            >
                              <div className="font-semibold truncate flex items-center gap-0.5">
                                {a._conflict && <AlertTriangle size={9} />}{other}
                              </div>
                              <div className="opacity-90 truncate">{fmtTime(s)}{a.subject ? ` · ${a.subject}` : ''}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1"><Plus size={12} /> Click an empty slot to add</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} /> Click a block to edit / move / squeeze in</span>
              <span className="inline-flex items-center gap-1"><AlertTriangle size={12} className="text-red-500" /> Red ring = overlapping appointment</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add / edit dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog?.editing ? 'Edit appointment' : 'New appointment'}</DialogTitle></DialogHeader>
          {dialog && (
            <div className="space-y-3 py-1">
              {/* counterpart */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Student</Label>
                  <Select value={dialog.form.student_id} onValueChange={(v) => setForm({ student_id: v })} disabled={mode === 'student'}>
                    <SelectTrigger><SelectValue placeholder="Student…" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => <SelectItem key={s.id} value={s.id}>{studentName(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tutor / Staff</Label>
                  <Select value={dialog.form.staff_id || 'none'} onValueChange={(v) => setForm({ staff_id: v === 'none' ? '' : v })} disabled={mode === 'staff'}>
                    <SelectTrigger><SelectValue placeholder="Staff…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— none / free text —</SelectItem>
                      {staff.map((s) => <SelectItem key={s.id} value={s.id}>{staffName(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!dialog.form.staff_id && (
                <div>
                  <Label>Tutor name (free text)</Label>
                  <Input value={dialog.form.tutor_name} onChange={(e) => setForm({ tutor_name: e.target.value })} placeholder="e.g. Rabbi Klein" />
                </div>
              )}

              {/* recurrence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Repeat</Label>
                  <Select value={dialog.form.recurrence} onValueChange={(v) => setForm({ recurrence: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Every week</SelectItem>
                      <SelectItem value="once">Just this day (squeeze-in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dialog.form.recurrence === 'weekly' ? (
                  <div>
                    <Label>Day</Label>
                    <Select value={String(dialog.form.day_of_week)} onValueChange={(v) => setForm({ day_of_week: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => <SelectItem key={d.idx} value={String(d.idx)}>{d.he} · {d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={dialog.form.appointment_date} onChange={(e) => setForm({ appointment_date: e.target.value })} />
                  </div>
                )}
              </div>

              {/* time + duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={dialog.form.start_time} onChange={(e) => setForm({ start_time: e.target.value })} />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Select value={String(dialog.form.duration_minutes)} onValueChange={(v) => setForm({ duration_minutes: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* subject + location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Subject</Label>
                  <Input value={dialog.form.subject} onChange={(e) => setForm({ subject: e.target.value })} placeholder="e.g. Kriah, Speech" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={dialog.form.location} onChange={(e) => setForm({ location: e.target.value })} placeholder="Room / building" />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={dialog.form.notes} onChange={(e) => setForm({ notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {dialog?.editing && (
              <Button variant="outline" className="text-red-600 border-red-200 mr-auto" onClick={remove}>
                <Trash2 size={15} className="mr-1" /> Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleView;
