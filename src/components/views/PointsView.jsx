import React, { useState, useEffect, useMemo } from 'react';
import { Star, Plus, Trash2, Loader2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentPicker from '@/components/ui/student-picker';
import ExportButton from '@/components/ExportButton';

const REASONS = [
  { value: 'good_deed', label: 'Good Deed', he: 'גוטע מעשה' },
  { value: 'diligence', label: 'Diligence', he: 'התמדה' },
  { value: 'midos', label: 'Midos', he: 'מידות טובות' },
  { value: 'davening', label: 'Davening', he: 'דאווענען' },
  { value: 'learning', label: 'Learning', he: 'לימוד' },
  { value: 'other', label: 'Other', he: 'אנדערש' },
];
const reasonInfo = (v) => REASONS.find((r) => r.value === v) || { label: v, he: v };
const studentName = (s) => s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim();

const PointsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', points: 1, reason: 'good_deed' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class:classes!class_id(name)')
        .eq('status', 'active')
        .order('last_name');
      setStudents(data || []);
    })();
    loadPoints();
  }, []);

  const loadPoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('points')
        .select('*, student:students(id, first_name, last_name, hebrew_name, class:classes!class_id(name))')
        .order('awarded_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setPoints(data || []);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load points' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.student_id) {
      toast({ variant: 'destructive', title: 'Select a student' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('points').insert([{
        student_id: form.student_id,
        points: Number(form.points) || 1,
        reason: form.reason,
        awarded_at: new Date().toISOString().split('T')[0],
        awarded_by: currentUser?.id || null,
        awarded_by_name: currentUser?.name || null,
      }]);
      if (error) throw error;
      toast({ title: 'Points awarded' });
      setForm({ student_id: '', points: 1, reason: 'good_deed' });
      loadPoints();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('points').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    else { toast({ title: 'Deleted' }); loadPoints(); }
  };

  // Totals by student (sorted)
  const totals = useMemo(() => {
    const map = new Map();
    points.forEach((p) => {
      const key = p.student_id;
      const cur = map.get(key) || { student: p.student, total: 0, count: 0 };
      cur.total += p.points || 0;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [points]);

  const EXPORT_COLUMNS = [
    { key: 'date', label: 'Date', accessor: (p) => p.awarded_at || '' },
    { key: 'student', label: 'Student', accessor: (p) => studentName(p.student) },
    { key: 'class', label: 'Class', accessor: (p) => p.student?.class?.name || '' },
    { key: 'points', label: 'Points', accessor: (p) => p.points ?? '' },
    { key: 'reason', label: 'Reason', accessor: (p) => reasonInfo(p.reason).label },
    { key: 'awarded_by', label: 'Awarded By', accessor: (p) => p.awarded_by_name || '' },
  ];

  return (
    <div className="space-y-4">
      {/* Award form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star size={20} className="text-amber-500" /> Award Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <StudentPicker
                students={students}
                value={form.student_id}
                onChange={(id) => setForm((f) => ({ ...f, student_id: id }))}
                label="Student"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Points</label>
              <Input type="number" min="1" className="w-24"
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Reason</label>
              <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.he} · {r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Plus className="me-2 h-4 w-4" />}
              Award
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaderboard / totals by student */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Totals by Student
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[520px] overflow-y-auto">
            {totals.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No points yet.</p>
            ) : (
              <ul className="divide-y">
                {totals.map((t, i) => (
                  <li key={t.student?.id || i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-slate-400 text-sm w-5">{i + 1}</span>
                    <span className="flex-1 font-medium text-slate-800">{studentName(t.student)}</span>
                    <Badge className="bg-amber-100 text-amber-800">{t.total} pts</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent awards */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Awards</CardTitle>
            <ExportButton title="Points" filename="points" rows={points} columns={EXPORT_COLUMNS} />
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 text-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin inline me-2" />Loading…</div>
            ) : points.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No points recorded yet.</div>
            ) : (
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="text-start p-3 font-semibold">Date</th>
                      <th className="text-start p-3 font-semibold">Student</th>
                      <th className="text-start p-3 font-semibold">Points</th>
                      <th className="text-start p-3 font-semibold">Reason</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3 whitespace-nowrap">{p.awarded_at}</td>
                        <td className="p-3 font-medium text-slate-800">{studentName(p.student)}</td>
                        <td className="p-3"><Badge className="bg-amber-100 text-amber-800">+{p.points}</Badge></td>
                        <td className="p-3">{reasonInfo(p.reason).he}</td>
                        <td className="p-3 text-end">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
    </div>
  );
};

export default PointsView;
