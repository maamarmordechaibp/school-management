import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStudentNotify } from '@/hooks/useStudentNotify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GRADE_SCALE, gradeSolidClass, gradeSoftClass } from '@/lib/gradeColors';

const GRADE_CATEGORIES = [
  { value: 'learning', label: 'Learning', he: 'לימוד' },
  { value: 'davening', label: 'Davening', he: 'דאווענען' },
  { value: 'test', label: 'Test', he: 'טעסט' },
  { value: 'farher', label: 'Farher', he: 'פארהער' },
  { value: 'behavior', label: 'Behavior', he: 'התנהגות' },
  { value: 'review', label: 'Review', he: 'חזרה' },
  { value: 'midos', label: 'Midos', he: 'מידות' },
];
const categoryLabel = (v) => {
  const c = GRADE_CATEGORIES.find((x) => x.value === v);
  return c ? `${c.he} · ${c.label}` : v;
};

const GradesModal = ({ isOpen, onClose, student }) => {
  const { toast } = useToast();
  const { profile: currentUser } = useAuth();
  const { notify, notifyElement } = useStudentNotify(currentUser);
  const [grades, setGrades] = useState([]);
  const [newGrade, setNewGrade] = useState({
    category: 'learning',
    subject: '',
    score: null,
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (student && isOpen) {
      loadGrades();
    }
  }, [student, isOpen]);

  const loadGrades = async () => {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', student.id)
      .order('date', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load grades',
      });
    } else {
      setGrades(data || []);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();

    if (!newGrade.category || !newGrade.score) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please choose a category and a score (1-5)',
      });
      return;
    }

    const payload = {
      student_id: student.id,
      category: newGrade.category,
      subject: newGrade.subject || categoryLabel(newGrade.category),
      score: Number(newGrade.score),
      grade: String(newGrade.score),
      notes: newGrade.note || null,
      date: newGrade.date,
      entered_by: currentUser?.id || null,
    };

    const { error } = await supabase.from('grades').insert([payload]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add grade',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Grade added successfully',
      });
      const added = { ...newGrade };
      setNewGrade({
        category: 'learning',
        subject: '',
        score: null,
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadGrades();
      notify({
        studentId: student.id,
        studentName: student.hebrew_name || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        action: 'created',
        recordType: 'Grade',
        title: `${categoryLabel(added.category)}: ${added.score}`,
        details: `Category: ${categoryLabel(added.category)}\nScore: ${added.score}\nDate: ${added.date}`,
        relatedType: 'grade',
      });
    }
  };

  const handleDeleteGrade = async (id) => {
    const { error } = await supabase.from('grades').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete grade',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Grade deleted successfully',
      });
      loadGrades();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grades for {student.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddGrade} className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-slate-800">Add New Grade</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newGrade.category} onValueChange={(v) => setNewGrade({ ...newGrade, category: v })}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.he} · {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                value={newGrade.date}
                onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <Label>Score</Label>
            <div className="flex gap-2 mt-1">
              {GRADE_SCALE.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setNewGrade({ ...newGrade, score: newGrade.score === g.value ? null : g.value })}
                  className={`h-10 w-12 rounded-lg text-base font-bold border transition ${
                    newGrade.score === g.value ? gradeSolidClass(g.value) + ' border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={`${g.value} — ${g.label} (${g.he})`}
                >
                  {g.value}
                </button>
              ))}
              <span className="self-center text-xs text-slate-400 ms-2">5 = Excellent · 1 = Weak</span>
            </div>
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              rows={2}
              value={newGrade.note}
              onChange={(e) => setNewGrade({ ...newGrade, note: e.target.value })}
              placeholder="Optional note about this grade…"
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600">
            <Plus size={16} className="mr-2" />
            Add Grade
          </Button>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800">Grade History</h3>
          {grades.length === 0 ? (
            <p className="text-slate-600 text-sm">No grades recorded yet</p>
          ) : (
            <div className="space-y-2">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{grade.category ? categoryLabel(grade.category) : (grade.subject || 'Grade')}</p>
                      {(grade.score ?? grade.grade) != null && (
                        <Badge className={gradeSoftClass(grade.score ?? grade.grade)}>{grade.score ?? grade.grade}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {grade.date ? new Date(grade.date).toLocaleDateString() : ''}
                    </p>
                    {grade.notes && <p className="text-xs text-slate-500 mt-0.5">{grade.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGrade(grade.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      {notifyElement}
    </Dialog>
  );
};

export default GradesModal;