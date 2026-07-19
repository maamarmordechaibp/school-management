import React, { useState, useEffect, useMemo } from 'react';
import { CalendarRange, ChevronRight, ChevronLeft, Save, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExportButton from '@/components/ExportButton';
import {
  PARSHIYOS,
  parshaLabel,
  getCurrentParshaKey,
  getWeekStart,
  DEFAULT_PARSHA_ANCHOR,
} from '@/lib/parshaCalendar';
import { SCHOOL_NAME_YI, SCHOOL_SUBTITLE_YI, SCHOOL_LOGO_URL } from '@/lib/schoolConfig';

const STATUS_OPTIONS = [
  { value: 'succeeded', label: 'Succeeded', he: 'הצליח', cls: 'bg-green-100 text-green-800' },
  { value: 'needs_to', label: 'Needs to', he: 'דארף', cls: 'bg-amber-100 text-amber-800' },
  { value: 'personal_contact', label: 'Personal Contact', he: 'פערזענליכע פארבינדונג', cls: 'bg-red-100 text-red-800' },
];
const statusInfo = (v) => STATUS_OPTIONS.find((s) => s.value === v) || null;

const studentName = (s) => s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim();

const WeeklyReportView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState({}); // student_id -> { status, grade, description, id }
  const [classId, setClassId] = useState('');
  const [parsha, setParsha] = useState(() => getCurrentParshaKey(DEFAULT_PARSHA_ANCHOR));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentParshaKey = useMemo(() => getCurrentParshaKey(DEFAULT_PARSHA_ANCHOR), []);
  const parshaIdx = PARSHIYOS.findIndex((p) => p.key === parsha);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name, hebrew_teacher_id, english_teacher_id')
        .eq('is_active', true)
        .order('name');
      setClasses(data || []);
      if (data && data.length && !classId) setClassId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (classId) loadStudentsAndReports();
  }, [classId, parsha]);

  const loadStudentsAndReports = async () => {
    setLoading(true);
    try {
      const { data: studs } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class_id, class:classes!class_id(id, name)')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('last_name');
      setStudents(studs || []);

      const ids = (studs || []).map((s) => s.id);
      const map = {};
      if (ids.length) {
        const { data: reports } = await supabase
          .from('weekly_reports')
          .select('*')
          .eq('parsha', parsha)
          .in('student_id', ids);
        (reports || []).forEach((r) => {
          map[r.student_id] = {
            id: r.id,
            status: r.status || '',
            grade: r.grade ?? '',
            description: r.description || '',
          };
        });
      }
      setRows(map);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load weekly report' });
    } finally {
      setLoading(false);
    }
  };

  const setRow = (studentId, patch) => {
    setRows((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), ...patch } }));
  };

  const gotoParsha = (delta) => {
    const next = (parshaIdx + delta + PARSHIYOS.length) % PARSHIYOS.length;
    setParsha(PARSHIYOS[next].key);
  };

  const selectedClass = classes.find((c) => c.id === classId);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const weekStart = getWeekStart();
      const teacherId = selectedClass?.hebrew_teacher_id || null;
      const payloads = students
        .map((s) => {
          const r = rows[s.id];
          if (!r || (!r.status && !r.grade && !r.description)) return null;
          return {
            id: r.id || undefined,
            student_id: s.id,
            class_id: classId,
            teacher_id: teacherId,
            teacher_name: currentUser?.name || null,
            parsha,
            week_start: weekStart,
            status: r.status || null,
            grade: r.grade === '' || r.grade == null ? null : Number(r.grade),
            description: r.description || null,
            created_by: currentUser?.id || null,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (!payloads.length) {
        toast({ title: 'Nothing to save', description: 'Fill in at least one student.' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('weekly_reports')
        .upsert(payloads, { onConflict: 'student_id,parsha' });
      if (error) throw error;
      toast({ title: 'Saved', description: `Weekly report saved for ${parshaLabel(parsha)}.` });
      loadStudentsAndReports();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const teacherName = currentUser?.name || '';
    const bodyRows = students
      .map((s) => {
        const r = rows[s.id] || {};
        const st = statusInfo(r.status);
        return `<tr>
          <td>${studentName(s)}</td>
          <td>${st ? st.he : ''}</td>
          <td style="text-align:center">${r.grade ?? ''}</td>
          <td>${(r.description || '').replace(/</g, '&lt;')}</td>
        </tr>`;
      })
      .join('');
    const doc = `<!DOCTYPE html><html lang="yi" dir="rtl"><head><meta charset="UTF-8">
      <title>וואכעדיגע באריכט — ${parshaLabel(parsha)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&display=swap');
        @page { size: A4; margin: 12mm; }
        body { font-family: 'Frank Ruhl Libre','David',serif; color:#111; }
        .head { text-align:center; margin-bottom:6mm; }
        .head img { max-height:20mm; }
        .school { font-size:15pt; font-weight:700; }
        .sub { font-size:10pt; color:#555; }
        .meta { display:flex; justify-content:space-between; font-size:11pt; margin:4mm 0; }
        table { width:100%; border-collapse:collapse; font-size:11pt; }
        th,td { border:1px solid #333; padding:2mm 3mm; text-align:right; }
        th { background:#f1f5f9; }
      </style></head>
      <body onload="window.focus();window.print();setTimeout(function(){try{window.close()}catch(e){}},500);">
        <div class="head">
          <img src="${SCHOOL_LOGO_URL}" onerror="this.style.display='none'"/>
          <div class="school">${SCHOOL_NAME_YI}</div>
          <div class="sub">${SCHOOL_SUBTITLE_YI}</div>
        </div>
        <div class="meta">
          <div><strong>פרשה:</strong> ${parshaLabel(parsha)}</div>
          <div><strong>כיתה:</strong> ${selectedClass?.name || ''}</div>
          <div><strong>מלמד:</strong> ${teacherName}</div>
        </div>
        <table>
          <thead><tr><th>תלמיד</th><th>סטאטוס</th><th>ציון</th><th>באשרייבונג</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(doc); w.document.close(); }
  };

  const exportRows = students.map((s) => ({ student: s, r: rows[s.id] || {} }));
  const EXPORT_COLUMNS = [
    { key: 'student', label: 'Student', accessor: (x) => studentName(x.student) },
    { key: 'class', label: 'Class', accessor: () => selectedClass?.name || '' },
    { key: 'parsha', label: 'Parsha', accessor: () => parshaLabel(parsha, 'en') },
    { key: 'status', label: 'Status', accessor: (x) => statusInfo(x.r.status)?.label || '' },
    { key: 'grade', label: 'Grade', accessor: (x) => x.r.grade ?? '' },
    { key: 'description', label: 'Description', accessor: (x) => x.r.description || '' },
  ];

  return (
    <div className="space-y-4">
      {/* Header / Parsha navigator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarRange size={20} className="text-indigo-600" /> Weekly Report by Parsha
            </CardTitle>
            <div className="flex items-center gap-2">
              <ExportButton
                title="Weekly Report"
                filename={`weekly-report-${parsha}`}
                rows={exportRows}
                columns={EXPORT_COLUMNS}
              />
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="me-2 h-4 w-4" /> Print
              </Button>
              <Button onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Parsha stepper */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => gotoParsha(-1)}><ChevronRight className="h-4 w-4" /></Button>
              <Select value={parsha} onValueChange={setParsha}>
                <SelectTrigger className="w-56 text-base font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARSHIYOS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.he} · {p.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => gotoParsha(1)}><ChevronLeft className="h-4 w-4" /></Button>
            </div>
            {parsha !== currentParshaKey && (
              <Button variant="ghost" size="sm" onClick={() => setParsha(currentParshaKey)}>
                Jump to this week ({parshaLabel(currentParshaKey)})
              </Button>
            )}
            {parsha === currentParshaKey && <Badge className="bg-indigo-100 text-indigo-700">This week</Badge>}

            {/* Class selector */}
            <div className="ms-auto">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student grid */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin inline me-2" />Loading…</div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No active students in this class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-start p-3 font-semibold">Student</th>
                    <th className="text-start p-3 font-semibold w-52">Status</th>
                    <th className="text-start p-3 font-semibold w-24">Grade</th>
                    <th className="text-start p-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const r = rows[s.id] || {};
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{studentName(s)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setRow(s.id, { status: r.status === opt.value ? '' : opt.value })}
                                className={`px-2 py-1 rounded-md text-xs font-medium border transition ${
                                  r.status === opt.value ? opt.cls + ' border-transparent ring-2 ring-offset-1 ring-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                                title={opt.label}
                              >
                                {opt.he}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number" min="1" max="5"
                            value={r.grade ?? ''}
                            onChange={(e) => setRow(s.id, { grade: e.target.value })}
                            className="w-16"
                          />
                        </td>
                        <td className="p-3">
                          <Textarea
                            rows={1}
                            value={r.description || ''}
                            onChange={(e) => setRow(s.id, { description: e.target.value })}
                            placeholder="Notes…"
                            className="min-h-[38px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyReportView;
