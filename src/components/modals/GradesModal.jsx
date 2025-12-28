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

const GradesModal = ({ isOpen, onClose, student }) => {
  const { toast } = useToast();
  const [grades, setGrades] = useState([]);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: '',
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

    if (!newGrade.subject || !newGrade.grade) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    const { error } = await supabase.from('grades').insert([{
      student_id: student.id,
      ...newGrade,
    }]);

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
      setNewGrade({
        subject: '',
        grade: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadGrades();
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <input
                id="subject"
                type="text"
                value={newGrade.subject}
                onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <input
                id="grade"
                type="text"
                value={newGrade.grade}
                onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                    <p className="font-medium text-slate-800">{grade.subject}</p>
                    <p className="text-sm text-slate-600">
                      Grade: {grade.grade} - {new Date(grade.date).toLocaleDateString()}
                    </p>
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
    </Dialog>
  );
};

export default GradesModal;