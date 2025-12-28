import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layers, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GradesView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_number: '',
    description: ''
  });

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          classes:classes(id),
          grade_book_requirements:grade_book_requirements(id)
        `)
        .order('grade_number', { ascending: true });

      if (error) throw error;
      
      // Add counts
      const gradesWithCounts = (data || []).map(grade => ({
        ...grade,
        class_count: grade.classes?.length || 0,
        book_count: grade.grade_book_requirements?.length || 0
      }));
      
      setGrades(gradesWithCounts);
    } catch (error) {
      console.error('Error loading grades:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load grades' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (grade = null) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        name: grade.name || '',
        grade_number: grade.grade_number?.toString() || '',
        description: grade.description || ''
      });
    } else {
      setEditingGrade(null);
      setFormData({ name: '', grade_number: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.grade_number) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in required fields' });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        grade_number: parseInt(formData.grade_number),
        description: formData.description || null
      };

      if (editingGrade) {
        const { error } = await supabase
          .from('grades')
          .update(payload)
          .eq('id', editingGrade.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Grade updated successfully' });
      } else {
        const { error } = await supabase
          .from('grades')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Grade created successfully' });
      }

      setIsModalOpen(false);
      loadGrades();
    } catch (error) {
      console.error('Error saving grade:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save grade' });
    }
  };

  const handleDelete = async (gradeId) => {
    if (!confirm('Are you sure you want to delete this grade? This will also affect all associated classes.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Grade deleted successfully' });
      loadGrades();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete grade. Make sure no classes are assigned.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grade Levels</h1>
          <p className="text-slate-500">Manage grade levels for your school</p>
        </div>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Grade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{grades.length}</p>
              <p className="text-sm text-slate-500">Total Grades</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{grades.reduce((sum, g) => sum + g.class_count, 0)}</p>
              <p className="text-sm text-slate-500">Total Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{grades.reduce((sum, g) => sum + g.book_count, 0)}</p>
              <p className="text-sm text-slate-500">Book Requirements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Grades</CardTitle>
          <CardDescription>Click on a grade to edit or view details</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No grades yet</p>
              <p className="text-sm">Click "Add Grade" to create your first grade level</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Books</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium">{grade.grade_number}</TableCell>
                    <TableCell className="font-semibold">{grade.name}</TableCell>
                    <TableCell className="text-slate-500">{grade.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {grade.class_count} classes
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {grade.book_count} books
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(grade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade_number">Grade Number *</Label>
                <Input
                  id="grade_number"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.grade_number}
                  onChange={(e) => setFormData({ ...formData, grade_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 1st Grade"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this grade level"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingGrade ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradesView;
