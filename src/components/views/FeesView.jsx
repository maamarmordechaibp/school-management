import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Users, Calendar, Send, Filter, Bus, PartyPopper, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FeesView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [fees, setFees] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeForm, setFeeForm] = useState({
    name: '',
    description: '',
    fee_type_id: '',
    amount: '',
    scope: 'school_wide',
    grade_id: '',
    class_id: '',
    due_date: '',
    academic_year: '2024-2025'
  });

  const [isFeeTypeModalOpen, setIsFeeTypeModalOpen] = useState(false);
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: '',
    description: '',
    category: 'other',
    default_amount: ''
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFeeForAssign, setSelectedFeeForAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const feeCategories = [
    { value: 'trip', label: 'Trip', icon: Bus },
    { value: 'event', label: 'Event', icon: PartyPopper },
    { value: 'supplies', label: 'Supplies', icon: BookOpen },
    { value: 'books', label: 'Books', icon: BookOpen },
    { value: 'other', label: 'Other', icon: DollarSign }
  ];

  const scopes = [
    { value: 'school_wide', label: 'School Wide (All Students)' },
    { value: 'grade_specific', label: 'Grade Specific' },
    { value: 'class_specific', label: 'Class Specific' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load fees with related data
      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select(`
          *,
          fee_type:fee_types(id, name, category),
          grade:grades(id, name),
          class:classes(id, name),
          student_fees:student_fees(id, status, amount, amount_paid)
        `)
        .order('created_at', { ascending: false });
      if (feesError) throw feesError;
      
      // Calculate stats for each fee
      const feesWithStats = (feesData || []).map(fee => {
        const studentFees = fee.student_fees || [];
        return {
          ...fee,
          total_students: studentFees.length,
          paid_count: studentFees.filter(sf => sf.status === 'paid').length,
          partial_count: studentFees.filter(sf => sf.status === 'partial').length,
          pending_count: studentFees.filter(sf => sf.status === 'pending').length,
          total_expected: studentFees.reduce((sum, sf) => sum + sf.amount, 0),
          total_collected: studentFees.reduce((sum, sf) => sum + sf.amount_paid, 0)
        };
      });
      setFees(feesWithStats);

      // Load fee types
      const { data: typesData, error: typesError } = await supabase
        .from('fee_types')
        .select('*')
        .order('name');
      if (typesError) throw typesError;
      setFeeTypes(typesData || []);

      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Load classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*, grade:grades(name)')
        .order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Fee Modal Functions
  const openFeeModal = (fee = null) => {
    if (fee) {
      setEditingFee(fee);
      setFeeForm({
        name: fee.name || '',
        description: fee.description || '',
        fee_type_id: fee.fee_type_id || '',
        amount: fee.amount?.toString() || '',
        scope: fee.scope || 'school_wide',
        grade_id: fee.grade_id || '',
        class_id: fee.class_id || '',
        due_date: fee.due_date || '',
        academic_year: fee.academic_year || '2024-2025'
      });
    } else {
      setEditingFee(null);
      setFeeForm({
        name: '', description: '', fee_type_id: '', amount: '',
        scope: 'school_wide', grade_id: '', class_id: '', due_date: '',
        academic_year: '2024-2025'
      });
    }
    setIsFeeModalOpen(true);
  };

  const handleSaveFee = async () => {
    if (!feeForm.name || !feeForm.amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in name and amount' });
      return;
    }

    try {
      const payload = {
        name: feeForm.name,
        description: feeForm.description || null,
        fee_type_id: feeForm.fee_type_id || null,
        amount: parseFloat(feeForm.amount),
        scope: feeForm.scope,
        grade_id: feeForm.scope === 'grade_specific' ? feeForm.grade_id : null,
        class_id: feeForm.scope === 'class_specific' ? feeForm.class_id : null,
        due_date: feeForm.due_date || null,
        academic_year: feeForm.academic_year
      };

      if (editingFee) {
        const { error } = await supabase
          .from('fees')
          .update(payload)
          .eq('id', editingFee.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Fee updated successfully' });
      } else {
        const { error } = await supabase
          .from('fees')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Fee created successfully' });
      }

      setIsFeeModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving fee:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save fee' });
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!confirm('Are you sure you want to delete this fee? This will also remove all student assignments.')) return;

    try {
      const { error } = await supabase
        .from('fees')
        .delete()
        .eq('id', feeId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Fee deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting fee:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete fee' });
    }
  };

  // Fee Type Modal Functions
  const handleSaveFeeType = async () => {
    if (!feeTypeForm.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a name' });
      return;
    }

    try {
      const { error } = await supabase
        .from('fee_types')
        .insert([{
          name: feeTypeForm.name,
          description: feeTypeForm.description || null,
          category: feeTypeForm.category,
          default_amount: feeTypeForm.default_amount ? parseFloat(feeTypeForm.default_amount) : null
        }]);
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Fee type created' });
      setIsFeeTypeModalOpen(false);
      setFeeTypeForm({ name: '', description: '', category: 'other', default_amount: '' });
      loadData();
    } catch (error) {
      console.error('Error saving fee type:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save fee type' });
    }
  };

  // Assign Fee to Students
  const openAssignModal = (fee) => {
    setSelectedFeeForAssign(fee);
    setIsAssignModalOpen(true);
  };

  const handleAssignFee = async () => {
    if (!selectedFeeForAssign) return;
    setAssigning(true);

    try {
      // Get students based on scope
      let studentsQuery = supabase.from('students').select('id, class_id').eq('status', 'active');

      if (selectedFeeForAssign.scope === 'grade_specific' && selectedFeeForAssign.grade_id) {
        // Get class IDs for this grade
        const { data: gradeClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('grade_id', selectedFeeForAssign.grade_id);
        
        const classIds = gradeClasses?.map(c => c.id) || [];
        if (classIds.length > 0) {
          studentsQuery = studentsQuery.in('class_id', classIds);
        }
      } else if (selectedFeeForAssign.scope === 'class_specific' && selectedFeeForAssign.class_id) {
        studentsQuery = studentsQuery.eq('class_id', selectedFeeForAssign.class_id);
      }

      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'No students found for this scope' });
        return;
      }

      // Create student_fees entries
      const studentFees = students.map(student => ({
        student_id: student.id,
        fee_id: selectedFeeForAssign.id,
        amount: selectedFeeForAssign.amount,
        status: 'pending'
      }));

      // Insert (ignore duplicates)
      const { error: insertError } = await supabase
        .from('student_fees')
        .upsert(studentFees, { onConflict: 'student_id,fee_id', ignoreDuplicates: true });
      
      if (insertError) throw insertError;

      toast({ title: 'Success', description: `Fee assigned to ${students.length} students` });
      setIsAssignModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error assigning fee:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign fee' });
    } finally {
      setAssigning(false);
    }
  };

  const getCategoryIcon = (category) => {
    const cat = feeCategories.find(c => c.value === category);
    return cat?.icon || DollarSign;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate totals
  const totalExpected = fees.reduce((sum, f) => sum + f.total_expected, 0);
  const totalCollected = fees.reduce((sum, f) => sum + f.total_collected, 0);
  const activeFees = fees.filter(f => f.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fees & Trips</h1>
          <p className="text-slate-500">Manage school fees, trips, and events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFeeTypeModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Fee Type
          </Button>
          <Button onClick={() => openFeeModal()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Fee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeFees.length}</p>
              <p className="text-sm text-slate-500">Active Fees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalCollected.toFixed(0)}</p>
              <p className="text-sm text-slate-500">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${(totalExpected - totalCollected).toFixed(0)}</p>
              <p className="text-sm text-slate-500">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((totalCollected / (totalExpected || 1)) * 100)}%
              </p>
              <p className="text-sm text-slate-500">Collection Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fees</CardTitle>
          <CardDescription>Manage and track fee collection</CardDescription>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No fees created yet</p>
              <p className="text-sm">Click "Create Fee" to add a new fee or trip</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Collection</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => {
                  const Icon = getCategoryIcon(fee.fee_type?.category);
                  const collectionPercent = fee.total_expected > 0 
                    ? Math.round((fee.total_collected / fee.total_expected) * 100)
                    : 0;
                  return (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <Icon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{fee.name}</p>
                            {fee.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">{fee.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {fee.scope === 'school_wide' && 'All Students'}
                          {fee.scope === 'grade_specific' && fee.grade?.name}
                          {fee.scope === 'class_specific' && fee.class?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${fee.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">{fee.paid_count}</span>
                          <span className="text-slate-400"> / </span>
                          <span>{fee.total_students}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${collectionPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{collectionPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssignModal(fee)}
                            title="Assign to students"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openFeeModal(fee)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteFee(fee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fee Modal */}
      <Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFee ? 'Edit Fee' : 'Create New Fee'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Name *</Label>
              <Input
                value={feeForm.name}
                onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                placeholder="e.g., End of Year Trip"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={feeForm.description}
                onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                placeholder="Details about this fee"
              />
            </div>
            <div className="space-y-2">
              <Label>Fee Type</Label>
              <Select value={feeForm.fee_type_id} onValueChange={(v) => setFeeForm({ ...feeForm, fee_type_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={feeForm.amount}
                onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Scope *</Label>
              <Select value={feeForm.scope} onValueChange={(v) => setFeeForm({ ...feeForm, scope: v, grade_id: '', class_id: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map(scope => (
                    <SelectItem key={scope.value} value={scope.value}>{scope.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {feeForm.scope === 'grade_specific' && (
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={feeForm.grade_id} onValueChange={(v) => setFeeForm({ ...feeForm, grade_id: v })}>
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
            )}
            {feeForm.scope === 'class_specific' && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={feeForm.class_id} onValueChange={(v) => setFeeForm({ ...feeForm, class_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.grade?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={feeForm.due_date}
                onChange={(e) => setFeeForm({ ...feeForm, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={feeForm.academic_year} onValueChange={(v) => setFeeForm({ ...feeForm, academic_year: v })}>
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
            <Button variant="outline" onClick={() => setIsFeeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFee} className="bg-blue-600 hover:bg-blue-700">
              {editingFee ? 'Update' : 'Create Fee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Type Modal */}
      <Dialog open={isFeeTypeModalOpen} onOpenChange={setIsFeeTypeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fee Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={feeTypeForm.name}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                placeholder="e.g., Annual Trip"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={feeTypeForm.category} onValueChange={(v) => setFeeTypeForm({ ...feeTypeForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feeCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={feeTypeForm.default_amount}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, default_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={feeTypeForm.description}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })}
                placeholder="Description of this fee type"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeeTypeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeeType} className="bg-blue-600 hover:bg-blue-700">
              Create Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Fee Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Fee to Students</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              This will assign <strong>{selectedFeeForAssign?.name}</strong> (${selectedFeeForAssign?.amount?.toFixed(2)}) to all applicable students.
            </p>
            <div className="p-4 bg-slate-100 rounded-lg">
              <p className="font-medium">Scope: {selectedFeeForAssign?.scope === 'school_wide' && 'All Students'}</p>
              {selectedFeeForAssign?.scope === 'grade_specific' && (
                <p className="font-medium">Grade: {selectedFeeForAssign?.grade?.name}</p>
              )}
              {selectedFeeForAssign?.scope === 'class_specific' && (
                <p className="font-medium">Class: {selectedFeeForAssign?.class?.name}</p>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Students who already have this fee assigned will be skipped.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignFee} disabled={assigning} className="bg-blue-600 hover:bg-blue-700">
              {assigning ? 'Assigning...' : 'Assign Fee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesView;
