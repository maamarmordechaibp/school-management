import React, { useState, useEffect } from 'react';
import { GraduationCap, Save, Trash2, Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExportButton from '@/components/ExportButton';
import { gradeSolidClass, gradeSoftClass, GRADE_SCALE } from '@/lib/gradeColors';

const SUBJECTS = [
  { value: 'gemara', label: 'Gemara', he: 'גמרא' },
  { value: 'chumash', label: 'Chumash', he: 'חומש' },
  { value: 'mishnayos', label: 'Mishnayos', he: 'משניות' },
  { value: 'other', label: 'Other', he: 'אנדערש' },
];
const subjectInfo = (v) => SUBJECTS.find((s) => s.value === v) || { label: v, he: v };
const studentName = (s) => s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim();

const FarhersView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [farhers, setFarhers] = useState([]);
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('gemara');
  const [farherDate, setFarherDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [grades, setGrades] = useState({}); // student_id -> 1-5
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setClasses(data || []);
      if (data && data.length && !classId) setClassId(data[0].id);
    })();
    loadFarhers();
  }, []);

  useEffect(() => {
    if (classId) loadStudents();
  }, [classId]);

  const loadStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, hebrew_name')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('last_name');
    setStudents(data || []);
    setGrades({});
  };

  const loadFarhers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farhers')
        .select('*, student:students(id, first_name, last_name, hebrew_name), class:classes(id, name)')
        .order('farher_date', { ascending: false })
        .limit(300);
      if (error) throw error;
      setFarhers(data || []);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load farhers' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const payloads = students
      .filter((s) => grades[s.id])
      .map((s) => ({
        student_id: s.id,
        class_id: classId,
        subject,
        farher_date: farherDate,
        grade: Number(grades[s.id]),
        examiner_id: currentUser?.id || null,
        examiner_name: currentUser?.name || null,
        created_by: currentUser?.id || null,
      }));
    if (!payloads.length) {
      toast({ title: 'Nothing to save', description: 'Enter a grade for at least one student.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('farhers').insert(payloads);
      if (error) throw error;
      toast({ title: 'Saved', description: `${payloads.length} farher grade(s) recorded.` });
      setGrades({});
      loadFarhers();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('farhers').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    } else {
      toast({ title: 'Deleted' });
      loadFarhers();
    }
  };

  const filteredFarhers = farhers.filter((f) => filterSubject === 'all' || f.subject === filterSubject);

  const EXPORT_COLUMNS = [
    { key: 'date', label: 'Date', accessor: (f) => f.farher_date || '' },
    { key: 'student', label: 'Student', accessor: (f) => studentName(f.student) },
    { key: 'class', label: 'Class', accessor: (f) => f.class?.name || '' },
    { key: 'subject', label: 'Subject', accessor: (f) => subjectInfo(f.subject).label },
    { key: 'grade', label: 'Grade', accessor: (f) => f.grade ?? '' },
    { key: 'examiner', label: 'Examiner', accessor: (f) => f.examiner_name || '' },
  ];

  return (
    <div className="space-y-4">
      {/* Batch entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic size={20} className="text-indigo-600" /> New Farher (Oral Test)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.he} · {s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={farherDate} onChange={(e) => setFarherDate(e.target.value)} className="w-44" />
            <Button className="ms-auto" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
              Save Grades
            </Button>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No active students in this class.</p>
          ) : (
            <div className="divide-y border rounded-lg">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5">
                  <span className="flex-1 font-medium text-slate-800">{studentName(s)}</span>
                  <div className="flex gap-1">
                    {GRADE_SCALE.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGrades((prev) => ({ ...prev, [s.id]: prev[s.id] === g.value ? undefined : g.value }))}
                        className={`h-8 w-8 rounded-md text-sm font-bold border transition ${
                          grades[s.id] === g.value ? gradeSolidClass(g.value) + ' border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={`${g.value} — ${g.label}`}
                      >
                        {g.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap size={20} className="text-slate-600" /> Farher History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {SUBJECTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <ExportButton title="Farhers" filename="farhers" rows={filteredFarhers} columns={EXPORT_COLUMNS} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin inline me-2" />Loading…</div>
          ) : filteredFarhers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No farhers recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-start p-3 font-semibold">Date</th>
                    <th className="text-start p-3 font-semibold">Student</th>
                    <th className="text-start p-3 font-semibold">Class</th>
                    <th className="text-start p-3 font-semibold">Subject</th>
                    <th className="text-start p-3 font-semibold">Grade</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarhers.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">{f.farher_date}</td>
                      <td className="p-3 font-medium text-slate-800">{studentName(f.student)}</td>
                      <td className="p-3">{f.class?.name || ''}</td>
                      <td className="p-3">{subjectInfo(f.subject).he}</td>
                      <td className="p-3">
                        {f.grade != null && <Badge className={gradeSoftClass(f.grade)}>{f.grade}</Badge>}
                      </td>
                      <td className="p-3 text-end">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarhersView;
