import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Users, GraduationCap, School, ArrowUpCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { levelFromAverage, gradeSoftClass } from '@/lib/gradeColors';

const studentDisplayName = (s) => s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim();

const ClassesView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classLevels, setClassLevels] = useState({}); // classId -> { avg, count }
  const [studentLevels, setStudentLevels] = useState({}); // studentId -> { avg, count }
  const [studentsByClass, setStudentsByClass] = useState({}); // classId -> [student]
  const [expandedClass, setExpandedClass] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_id: '',
    hebrew_teacher_id: '',
    english_teacher_id: '',
    academic_year: '2024-2025',
    is_active: true
  });

  // Promotion state
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionClass, setPromotionClass] = useState(null);
  const [targetClass, setTargetClass] = useState('');
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load classes with related data (using staff_members for teachers)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          grade:grades(id, name, grade_number),
          hebrew_teacher:app_users!hebrew_teacher_id(id, first_name, last_name),
          english_teacher:app_users!english_teacher_id(id, first_name, last_name),
          students:students!class_id(id)
        `)
        .order('name');
      
      if (classesError) throw classesError;
      
      // Add student count
      const classesWithCount = (classesData || []).map(cls => ({
        ...cls,
        student_count: cls.students?.length || 0
      }));
      setClasses(classesWithCount);

      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Load teachers (Hebrew and English)
      const { data: teachersData, error: teachersError } = await supabase
        .from('app_users')
        .select('id, first_name, last_name, role')
        .in('role', ['teacher_hebrew', 'teacher_english', 'teacher', 'admin', 'principal', 'principal_hebrew', 'principal_english'])
        .eq('is_active', true)
        .order('last_name');
      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Load staff members for teacher assignment
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('last_name');
      if (!staffError) {
        setStaffMembers(staffData || []);
        console.log('Staff loaded:', staffData?.length, 'members');
      }

      // Compute color-coded academic levels from grade scores + farher grades
      await loadAcademicLevels();

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicLevels = async () => {
    try {
      const [{ data: studs }, { data: gradeScores }, { data: farherScores }] = await Promise.all([
        supabase.from('students').select('id, first_name, last_name, hebrew_name, class_id').eq('status', 'active'),
        supabase.from('grades').select('student_id, score').not('student_id', 'is', null).not('score', 'is', null),
        supabase.from('farhers').select('student_id, grade').not('grade', 'is', null),
      ]);

      // Accumulate all 1-5 scores per student
      const acc = {}; // studentId -> { sum, n }
      const add = (sid, val) => {
        const v = Number(val);
        if (!sid || !Number.isFinite(v)) return;
        const a = acc[sid] || { sum: 0, n: 0 };
        a.sum += v; a.n += 1; acc[sid] = a;
      };
      (gradeScores || []).forEach((g) => add(g.student_id, g.score));
      (farherScores || []).forEach((f) => add(f.student_id, f.grade));

      const sLevels = {};
      Object.entries(acc).forEach(([sid, a]) => { sLevels[sid] = { avg: a.sum / a.n, count: a.n }; });

      // Group students by class + roll averages up to the class
      const byClass = {};
      const classAcc = {};
      (studs || []).forEach((s) => {
        if (!s.class_id) return;
        (byClass[s.class_id] = byClass[s.class_id] || []).push(s);
        const sl = sLevels[s.id];
        if (sl) {
          const c = classAcc[s.class_id] || { sum: 0, n: 0 };
          c.sum += sl.avg; c.n += 1; classAcc[s.class_id] = c;
        }
      });
      const cLevels = {};
      Object.entries(classAcc).forEach(([cid, c]) => { cLevels[cid] = { avg: c.sum / c.n, count: c.n }; });

      setStudentLevels(sLevels);
      setStudentsByClass(byClass);
      setClassLevels(cLevels);
    } catch (e) {
      // grades.score / farhers may not exist before migration 047 — fail soft
      console.log('Academic levels unavailable:', e?.message);
    }
  };

  const openModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name || '',
        grade_id: cls.grade_id || '',
        hebrew_teacher_id: cls.hebrew_teacher_id || '',
        english_teacher_id: cls.english_teacher_id || '',
        academic_year: cls.academic_year || '2024-2025',
        is_active: cls.is_active !== false
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '', grade_id: '', hebrew_teacher_id: '', english_teacher_id: '',
        academic_year: '2024-2025', is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.grade_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in class name and grade' });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        grade_id: formData.grade_id,
        hebrew_teacher_id: formData.hebrew_teacher_id || null,
        english_teacher_id: formData.english_teacher_id || null,
        academic_year: formData.academic_year,
        is_active: formData.is_active
      };

      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', editingClass.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Class updated' });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Class created' });
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save class' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class? Students will be unassigned.')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Class deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete class' });
    }
  };

  const handleRemoveAllStudents = async (cls) => {
    const count = cls.student_count || 0;
    if (count === 0) {
      toast({ title: 'No students', description: 'This class has no students to remove.' });
      return;
    }
    if (!confirm(`Permanently delete ALL ${count} student(s) in "${cls.name}" and every record linked to them (issues, calls, grades, fees, documents, etc.)? Use this when a class leaves the school. This cannot be undone.`)) return;
    try {
      const { data, error } = await supabase.rpc('delete_class_students', { p_class_id: cls.id });
      if (error) throw error;
      toast({ title: 'Class emptied', description: `Removed ${data ?? count} student(s) and all their records.` });
      loadData();
    } catch (error) {
      console.error('Error removing class students:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to remove students' });
    }
  };

  // Promotion Functions
  const openPromotionModal = (cls) => {
    setPromotionClass(cls);
    setTargetClass('');
    setIsPromotionModalOpen(true);
  };

  // Get next grade classes for promotion
  const getNextGradeClasses = (currentClass) => {
    if (!currentClass?.grade) return [];
    const currentGradeNumber = currentClass.grade.grade_number;
    const nextGrade = grades.find(g => g.grade_number === currentGradeNumber + 1);
    if (!nextGrade) return [];
    return classes.filter(c => c.grade_id === nextGrade.id);
  };

  const handlePromoteStudents = async () => {
    if (!promotionClass || !targetClass) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a target class' });
      return;
    }

    setPromoting(true);
    try {
      // Get all students in the current class
      const { data: studentsToPromote, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', promotionClass.id);

      if (fetchError) throw fetchError;

      if (!studentsToPromote || studentsToPromote.length === 0) {
        toast({ variant: 'destructive', title: 'No Students', description: 'No students to promote in this class' });
        setPromoting(false);
        return;
      }

      // Update all students to new class
      const { error: updateError } = await supabase
        .from('students')
        .update({
          class_id: targetClass,
          previous_class_id: promotionClass.id,
          promoted_at: new Date().toISOString(),
          promoted_by: currentUser?.id
        })
        .eq('class_id', promotionClass.id);

      if (updateError) throw updateError;

      toast({ 
        title: 'Success', 
        description: `${studentsToPromote.length} students promoted to new class` 
      });
      setIsPromotionModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error promoting students:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to promote students' });
    } finally {
      setPromoting(false);
    }
  };

  // Filter staff by position for teacher assignment
  const hebrewTeachers = staffMembers.filter(s => 
    ['Melamed', 'Melamed / Driver', 'Menahal', 'Sgan Menahal', 'Principal', 'Chinuch Mychud'].includes(s.position)
  );
  const englishTeachers = staffMembers.filter(s => 
    ['English Teacher', 'Principal', 'Menahal', 'Sgan Menahal', 'Curriculum Implementer'].includes(s.position)
  );

  // Group classes by grade
  const classesByGrade = grades.map(grade => ({
    ...grade,
    classes: classes.filter(cls => cls.grade_id === grade.id)
  }));

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
          <h1 className="text-2xl font-bold text-slate-800">Classes Management</h1>
          <p className="text-slate-500">Manage classes and assign teachers</p>
        </div>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-sm text-slate-500">Total Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.reduce((sum, c) => sum + c.student_count, 0)}</p>
              <p className="text-sm text-slate-500">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{grades.length}</p>
              <p className="text-sm text-slate-500">Grade Levels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes by Grade */}
      <div className="space-y-6">
        {classesByGrade.map((grade) => (
          <Card key={grade.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">{grade.name}</span>
                <Badge variant="outline">{grade.classes.length} classes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grade.classes.length === 0 ? (
                <p className="text-slate-400 text-sm italic py-4">No classes in this grade yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Hebrew Teacher</TableHead>
                      <TableHead>English Teacher</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Year</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grade.classes.map((cls) => {
                      const cl = classLevels[cls.id];
                      const lvl = levelFromAverage(cl?.avg);
                      const isExpanded = expandedClass === cls.id;
                      return (
                      <React.Fragment key={cls.id}>
                      <TableRow>
                        <TableCell className="font-semibold">
                          <button
                            type="button"
                            onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                            className="inline-flex items-center gap-1 hover:text-indigo-600"
                            title="Show students & levels"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {cls.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${lvl.bg} ${lvl.text}`}>
                            <span className={`h-2 w-2 rounded-full ${lvl.dot}`}></span>
                            {lvl.label}{cl?.avg != null ? ` (${cl.avg.toFixed(1)})` : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          {cls.hebrew_teacher ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-medium">
                                {cls.hebrew_teacher.first_name?.charAt(0)}{cls.hebrew_teacher.last_name?.charAt(0)}
                              </div>
                              <span className="text-sm">{cls.hebrew_teacher.first_name} {cls.hebrew_teacher.last_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cls.english_teacher ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-700 font-medium">
                                {cls.english_teacher.first_name?.charAt(0)}{cls.english_teacher.last_name?.charAt(0)}
                              </div>
                              <span className="text-sm">{cls.english_teacher.first_name} {cls.english_teacher.last_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{cls.student_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500">{cls.academic_year}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-purple-600"
                              onClick={() => openPromotionModal(cls)}
                              title="Promote students to next grade"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600"
                              onClick={() => handleRemoveAllStudents(cls)}
                              title="Remove all students (class left school)"
                            >
                              <GraduationCap className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openModal(cls)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDelete(cls.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-slate-50/60">
                            {(studentsByClass[cls.id] || []).length === 0 ? (
                              <p className="text-sm text-slate-400 py-2">No students in this class.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 py-1">
                                {(studentsByClass[cls.id] || []).map((s) => {
                                  const sl = studentLevels[s.id];
                                  return (
                                    <span
                                      key={s.id}
                                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${sl ? gradeSoftClass(Math.round(sl.avg)) : 'bg-slate-100 text-slate-500'}`}
                                    >
                                      {studentDisplayName(s)}{sl ? ` · ${sl.avg.toFixed(1)}` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {grades.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No grades defined yet</p>
            <p className="text-sm">Please create grade levels first in the Grades section</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 1A, 2B"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select value={formData.grade_id} onValueChange={(v) => setFormData({ ...formData, grade_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hebrew Teacher ({hebrewTeachers.length} available)</Label>
              <Select 
                value={formData.hebrew_teacher_id || 'none'} 
                onValueChange={(v) => setFormData({ ...formData, hebrew_teacher_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Hebrew teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {hebrewTeachers.length === 0 ? (
                    <SelectItem value="no-teachers" disabled>No Hebrew teachers in staff</SelectItem>
                  ) : (
                    hebrewTeachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.position})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>English Teacher ({englishTeachers.length} available)</Label>
              <Select 
                value={formData.english_teacher_id || 'none'} 
                onValueChange={(v) => setFormData({ ...formData, english_teacher_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select English teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {englishTeachers.length === 0 ? (
                    <SelectItem value="no-teachers" disabled>No English teachers in staff</SelectItem>
                  ) : (
                    englishTeachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.position})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={formData.academic_year} onValueChange={(v) => setFormData({ ...formData, academic_year: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingClass ? 'Update' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Modal */}
      <Dialog open={isPromotionModalOpen} onOpenChange={setIsPromotionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-purple-600" />
              Promote Students
            </DialogTitle>
            <DialogDescription>
              Move all students from {promotionClass?.name} to the next grade level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <strong>Current Class:</strong> {promotionClass?.name}
              </p>
              <p className="text-sm text-purple-800">
                <strong>Students to promote:</strong> {promotionClass?.student_count || 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Select Target Class (Next Grade)</Label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose next year's class" />
                </SelectTrigger>
                <SelectContent>
                  {getNextGradeClasses(promotionClass).map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade?.name}) - {cls.student_count} students
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {promotionClass && getNextGradeClasses(promotionClass).length === 0 && (
                <p className="text-sm text-amber-600">
                  No classes found in the next grade. This may be the highest grade.
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Warning:</strong> This will move ALL students from {promotionClass?.name} to the selected class. 
                This action is typically done at the end of the school year.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromotionModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePromoteStudents} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!targetClass || promoting}
            >
              {promoting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Promote Students
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesView;
