import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, CreditCard, Receipt, CheckCircle, Clock, AlertCircle, User, Filter, Download } from 'lucide-react';
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

const PaymentsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentFees, setSelectedStudentFees] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    student_fee_id: '',
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  // Student Lookup Modal
  const [isStudentLookupOpen, setIsStudentLookupOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load recent payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          student:students(id, first_name, last_name),
          student_fee:student_fees(id, fee:fees(name))
        `)
        .order('payment_date', { ascending: false })
        .limit(100);
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Load all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, class_id')
        .eq('status', 'active')
        .order('last_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const studentName = `${payment.student?.first_name || ''} ${payment.student?.last_name || ''}`.toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) ||
      (payment.reference_number && payment.reference_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (dateFilter === 'all') return matchesSearch;
    
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    
    if (dateFilter === 'today') {
      return matchesSearch && paymentDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today.setDate(today.getDate() - 7));
      return matchesSearch && paymentDate >= weekAgo;
    } else if (dateFilter === 'month') {
      return matchesSearch && paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
    }
    
    return matchesSearch;
  });

  // Calculate totals
  const todayTotal = payments
    .filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + p.amount, 0);
  
  const monthTotal = payments
    .filter(p => {
      const d = new Date(p.payment_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Student selection
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setIsStudentLookupOpen(false);
    
    // Load student's fees
    try {
      const { data: feesData, error: feesError } = await supabase
        .from('student_fees')
        .select(`
          *,
          fee:fees(id, name, amount)
        `)
        .eq('student_id', student.id)
        .in('status', ['pending', 'partial']);
      
      if (feesError) throw feesError;
      setSelectedStudentFees(feesData || []);
      
      if ((feesData || []).length > 0) {
        setPaymentForm(prev => ({
          ...prev,
          student_fee_id: feesData[0].id,
          amount: (feesData[0].amount - feesData[0].amount_paid).toFixed(2)
        }));
      }
      
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Error loading student fees:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student fees' });
    }
  };

  // When fee selection changes
  const handleFeeChange = (feeId) => {
    const fee = selectedStudentFees.find(f => f.id === feeId);
    if (fee) {
      setPaymentForm(prev => ({
        ...prev,
        student_fee_id: feeId,
        amount: (fee.amount - fee.amount_paid).toFixed(2)
      }));
    }
  };

  // Save payment
  const handleSavePayment = async () => {
    if (!selectedStudent || !paymentForm.amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter an amount' });
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          student_id: selectedStudent.id,
          student_fee_id: paymentForm.student_fee_id || null,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null,
          payment_date: new Date().toISOString().split('T')[0],
          received_by: currentUser?.id
        }]);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      setIsPaymentModalOpen(false);
      setSelectedStudent(null);
      setSelectedStudentFees([]);
      setPaymentForm({ student_fee_id: '', amount: '', payment_method: 'cash', reference_number: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save payment' });
    }
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500">Record and track student payments</p>
        </div>
        <Button onClick={() => setIsStudentLookupOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${todayTotal.toFixed(0)}</p>
              <p className="text-sm text-slate-500">Today's Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${monthTotal.toFixed(0)}</p>
              <p className="text-sm text-slate-500">This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{payments.filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString()).length}</p>
              <p className="text-sm text-slate-500">Today's Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {payments.filter(p => p.payment_method === 'check').length}
              </p>
              <p className="text-sm text-slate-500">Checks Received</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent payments received</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm">Click "Record Payment" to add a new payment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span>
                          {payment.student?.first_name} {payment.student?.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.student_fee?.fee?.name || payment.description || 'General Payment'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {payment.reference_number || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Lookup Modal */}
      <Dialog open={isStudentLookupOpen} onOpenChange={setIsStudentLookupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Student</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full p-3 text-left hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedStudent && (
              <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-semibold text-blue-600">
                    {selectedStudent.first_name?.charAt(0)}{selectedStudent.last_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <p className="text-sm text-slate-500">Recording payment</p>
                </div>
              </div>
            )}

            {selectedStudentFees.length > 0 ? (
              <div className="space-y-2">
                <Label>Apply to Fee</Label>
                <Select value={paymentForm.student_fee_id} onValueChange={handleFeeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedStudentFees.map(sf => (
                      <SelectItem key={sf.id} value={sf.id}>
                        {sf.fee?.name} - Owed: ${(sf.amount - sf.amount_paid).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                No outstanding fees found for this student. Payment will be recorded as a general payment.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference # (Check #, Transaction ID)</Label>
              <Input
                value={paymentForm.reference_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                placeholder="e.g., Check #1234"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes about this payment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPaymentModalOpen(false);
              setSelectedStudent(null);
              setSelectedStudentFees([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsView;
