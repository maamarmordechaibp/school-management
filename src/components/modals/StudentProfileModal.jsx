import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, User, MessageSquare, DollarSign, CreditCard, Receipt, Plus, Loader2, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// Helper function to get current academic year (August starts new year)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = Jan, 7 = Aug)
  // If we're in August or later, current year starts the academic year
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  // Otherwise we're in the second half of previous academic year
  return `${year - 1}-${year}`;
};

// Generate available academic years (past 5, current, future 2)
const getAvailableYears = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [];
  
  // Past 5 years
  for (let i = 5; i >= 1; i--) {
    years.push(`${currentYear - i}-${currentYear - i + 1}`);
  }
  // Current year
  years.push(`${currentYear}-${currentYear + 1}`);
  // Next 2 years
  for (let i = 1; i <= 2; i++) {
    years.push(`${currentYear + i}-${currentYear + i + 1}`);
  }
  
  return years;
};

const StudentProfileModal = ({ isOpen, onClose, studentId }) => {
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [siblings, setSiblings] = useState([]); // Students with same father_phone
  const [issues, setIssues] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [allStudentFees, setAllStudentFees] = useState([]); // All fees without filtering
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]); // All payments without filtering
  const [availableFees, setAvailableFees] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showFamilyPayment, setShowFamilyPayment] = useState(false);
  
  // Year filter - 'all' shows all years
  const [selectedYear, setSelectedYear] = useState('all');
  const availableYears = useMemo(() => getAvailableYears(), []);
  
  // New charge form
  const [newCharge, setNewCharge] = useState({ fee_id: '', amount: '', notes: '' });
  
  // New payment form
  const [newPayment, setNewPayment] = useState({ 
    student_fee_id: '', 
    amount: '', 
    payment_method: 'cash',
    reference_number: '',
    notes: '' 
  });

  // Family payment form - pay for multiple students at once
  const [familyPayment, setFamilyPayment] = useState({
    totalAmount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    selectedStudents: {} // { studentId: { selected: bool, fees: [{ feeId, amount }] } }
  });

  useEffect(() => {
    if (studentId && isOpen) {
      loadProfile();
    }
  }, [studentId, isOpen]);

  // Filter fees and payments when year selection changes
  useEffect(() => {
    if (selectedYear === 'all') {
      setStudentFees(allStudentFees);
      setPayments(allPayments);
    } else {
      // Filter by academic year from the fee
      const filteredFees = allStudentFees.filter(sf => sf.fee?.academic_year === selectedYear);
      setStudentFees(filteredFees);
      
      // Filter payments by the filtered student_fee_ids
      const filteredFeeIds = new Set(filteredFees.map(sf => sf.id));
      const filteredPayments = allPayments.filter(p => filteredFeeIds.has(p.student_fee_id));
      setPayments(filteredPayments);
    }
  }, [selectedYear, allStudentFees, allPayments]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Fetch student details with class info
      const { data: studentData } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(name, grade:grades(name))
        `)
        .eq('id', studentId)
        .single();
      
      setStudent(studentData);

      // Fetch siblings (same father_phone, different student)
      if (studentData?.father_phone) {
        const { data: siblingsData } = await supabase
          .from('students')
          .select(`
            id, first_name, last_name, hebrew_name, name,
            class:classes(name, grade:grades(name))
          `)
          .eq('father_phone', studentData.father_phone)
          .neq('id', studentId)
          .eq('status', 'active');
        
        setSiblings(siblingsData || []);
        
        // If there are siblings, fetch their open fees too for family payment
        if (siblingsData && siblingsData.length > 0) {
          const siblingIds = siblingsData.map(s => s.id);
          const allFamilyIds = [studentId, ...siblingIds];
          
          const { data: familyFeesData } = await supabase
            .from('student_fees')
            .select(`
              *,
              fee:fees(name, description, due_date, academic_year),
              student:students(id, first_name, last_name, hebrew_name)
            `)
            .in('student_id', allFamilyIds)
            .in('status', ['pending', 'partial'])
            .order('created_at', { ascending: false });
          
          // Group fees by student for family payment
          const studentFeesMap = {};
          (familyFeesData || []).forEach(sf => {
            if (!studentFeesMap[sf.student_id]) {
              studentFeesMap[sf.student_id] = { selected: false, fees: [] };
            }
            studentFeesMap[sf.student_id].fees.push(sf);
          });
          setFamilyPayment(prev => ({ ...prev, selectedStudents: studentFeesMap }));
        }
      } else {
        setSiblings([]);
      }

      // Fetch issues
      const { data: issuesData } = await supabase
        .from('student_issues')
        .select(`
          *,
          reported_by_user:app_users!student_issues_reported_by_fkey(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      setIssues(issuesData || []);

      // Fetch student fees (charges) - ALL of them
      const { data: feesData } = await supabase
        .from('student_fees')
        .select(`
          *,
          fee:fees(name, description, due_date, academic_year, fee_type:fee_types(name, category))
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      setAllStudentFees(feesData || []);
      setStudentFees(feesData || []); // Initially show all

      // Fetch payments - ALL of them
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          student_fee:student_fees(id, fee:fees(name, academic_year))
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });
      
      setAllPayments(paymentsData || []);
      setPayments(paymentsData || []); // Initially show all

      // Fetch available fees for adding charges
      const { data: availableFeesData } = await supabase
        .from('fees')
        .select('id, name, amount, fee_type:fee_types(name)')
        .eq('status', 'active');
      
      setAvailableFees(availableFeesData || []);

      // Fetch remarks
      const { data: remarksData } = await supabase
        .from('teacher_remarks')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      setRemarks(remarksData || []);

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial summary
  const calculateFinancials = () => {
    const totalCharges = studentFees.reduce((sum, sf) => sum + (parseFloat(sf.amount) || 0), 0);
    const totalPaid = studentFees.reduce((sum, sf) => sum + (parseFloat(sf.amount_paid) || 0), 0);
    const openBalance = totalCharges - totalPaid;
    const waived = studentFees.filter(sf => sf.status === 'waived').reduce((sum, sf) => sum + (parseFloat(sf.amount) || 0), 0);
    
    return { totalCharges, totalPaid, openBalance, waived };
  };

  const financials = calculateFinancials();

  // Add a new charge
  const handleAddCharge = async () => {
    if (!newCharge.fee_id) {
      toast({ variant: 'destructive', title: 'טעות', description: 'ביטע וועל אויס א טשאַרדזש' });
      return;
    }

    const selectedFee = availableFees.find(f => f.id === newCharge.fee_id);
    const amount = newCharge.amount || selectedFee?.amount || 0;

    try {
      const { error } = await supabase.from('student_fees').insert({
        student_id: studentId,
        fee_id: newCharge.fee_id,
        amount: parseFloat(amount),
        amount_paid: 0,
        status: 'pending',
        notes: newCharge.notes || null
      });

      if (error) throw error;

      toast({ title: 'צוגעלייגט', description: 'טשאַרדזש איז צוגעלייגט געווארן' });
      setNewCharge({ fee_id: '', amount: '', notes: '' });
      setShowAddCharge(false);
      loadProfile();
    } catch (error) {
      console.error('Error adding charge:', error);
      toast({ variant: 'destructive', title: 'טעות', description: 'קען נישט צולייגן טשאַרדזש' });
    }
  };

  // Add a new payment
  const handleAddPayment = async () => {
    if (!newPayment.student_fee_id || !newPayment.amount) {
      toast({ variant: 'destructive', title: 'טעות', description: 'ביטע פיל אויס אלע פעלדער' });
      return;
    }

    try {
      // Insert payment
      const { error: paymentError } = await supabase.from('payments').insert({
        student_id: studentId,
        student_fee_id: newPayment.student_fee_id,
        amount: parseFloat(newPayment.amount),
        payment_method: newPayment.payment_method,
        reference_number: newPayment.reference_number || null,
        payment_date: new Date().toISOString(),
        notes: newPayment.notes || null
      });

      if (paymentError) throw paymentError;

      // Update student_fee amount_paid
      const studentFee = studentFees.find(sf => sf.id === newPayment.student_fee_id);
      if (studentFee) {
        const newAmountPaid = (parseFloat(studentFee.amount_paid) || 0) + parseFloat(newPayment.amount);
        const newStatus = newAmountPaid >= parseFloat(studentFee.amount) ? 'paid' : 'partial';
        
        await supabase
          .from('student_fees')
          .update({ 
            amount_paid: newAmountPaid,
            status: newStatus
          })
          .eq('id', newPayment.student_fee_id);
      }

      toast({ title: 'באַצאָלט', description: 'צאָלונג איז רעקאָרדירט געווארן' });
      setNewPayment({ student_fee_id: '', amount: '', payment_method: 'cash', reference_number: '', notes: '' });
      setShowAddPayment(false);
      loadProfile();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({ variant: 'destructive', title: 'טעות', description: 'קען נישט רעקאָרדירן צאָלונג' });
    }
  };

  const addRemark = async () => {
    if (!newRemark.trim()) return;

    const { error } = await supabase.from('teacher_remarks').insert({
      student_id: studentId,
      content: newRemark,
      teacher_name: 'Current User'
    });

    if (!error) {
      setNewRemark('');
      loadProfile();
    }
  };

  // Handle family payment - split payment across multiple students
  const handleFamilyPayment = async () => {
    if (!familyPayment.totalAmount || parseFloat(familyPayment.totalAmount) <= 0) {
      toast({ variant: 'destructive', title: 'טעות', description: 'ביטע שרייב אריין א סומע' });
      return;
    }

    // Get all selected fees across all selected students
    const selectedFees = [];
    Object.entries(familyPayment.selectedStudents).forEach(([studId, data]) => {
      if (data.selected && data.fees) {
        data.fees.forEach(fee => {
          const balance = parseFloat(fee.amount) - parseFloat(fee.amount_paid || 0);
          if (balance > 0) {
            selectedFees.push({
              studentId: studId,
              feeId: fee.id,
              feeName: fee.fee?.name,
              balance,
              studentName: fee.student?.hebrew_name || fee.student?.first_name
            });
          }
        });
      }
    });

    if (selectedFees.length === 0) {
      toast({ variant: 'destructive', title: 'טעות', description: 'ביטע וועל אויס תלמידים מיט אפענע באַלאַנסן' });
      return;
    }

    let remainingAmount = parseFloat(familyPayment.totalAmount);
    const paymentsToInsert = [];
    const feesToUpdate = [];

    // Distribute payment across selected fees
    for (const fee of selectedFees) {
      if (remainingAmount <= 0) break;
      
      const paymentForThisFee = Math.min(remainingAmount, fee.balance);
      remainingAmount -= paymentForThisFee;

      paymentsToInsert.push({
        student_id: fee.studentId,
        student_fee_id: fee.feeId,
        amount: paymentForThisFee,
        payment_method: familyPayment.payment_method,
        reference_number: familyPayment.reference_number || null,
        payment_date: new Date().toISOString(),
        notes: familyPayment.notes || `משפחה צאָלונג - ${fee.studentName}`
      });

      // Calculate new status
      const originalFee = familyPayment.selectedStudents[fee.studentId]?.fees.find(f => f.id === fee.feeId);
      const newAmountPaid = (parseFloat(originalFee?.amount_paid) || 0) + paymentForThisFee;
      const newStatus = newAmountPaid >= parseFloat(originalFee?.amount) ? 'paid' : 'partial';

      feesToUpdate.push({
        id: fee.feeId,
        amount_paid: newAmountPaid,
        status: newStatus
      });
    }

    try {
      // Insert all payments
      const { error: paymentError } = await supabase.from('payments').insert(paymentsToInsert);
      if (paymentError) throw paymentError;

      // Update all student_fees
      for (const feeUpdate of feesToUpdate) {
        await supabase
          .from('student_fees')
          .update({ amount_paid: feeUpdate.amount_paid, status: feeUpdate.status })
          .eq('id', feeUpdate.id);
      }

      toast({ 
        title: 'משפחה צאָלונג רעקאָרדירט', 
        description: `$${parseFloat(familyPayment.totalAmount).toFixed(2)} צעטיילט צווישן ${paymentsToInsert.length} טשאַרדזשעס` 
      });
      
      setFamilyPayment({
        totalAmount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
        selectedStudents: {}
      });
      setShowFamilyPayment(false);
      loadProfile();
    } catch (error) {
      console.error('Error processing family payment:', error);
      toast({ variant: 'destructive', title: 'טעות', description: 'קען נישט פראצעסירן צאָלונג' });
    }
  };

  // Toggle student selection for family payment
  const toggleStudentSelection = (studentId) => {
    setFamilyPayment(prev => ({
      ...prev,
      selectedStudents: {
        ...prev.selectedStudents,
        [studentId]: {
          ...prev.selectedStudents[studentId],
          selected: !prev.selectedStudents[studentId]?.selected
        }
      }
    }));
  };

  // Calculate total open balance for selected students
  const calculateFamilyBalance = () => {
    let total = 0;
    Object.entries(familyPayment.selectedStudents).forEach(([_, data]) => {
      if (data.selected && data.fees) {
        data.fees.forEach(fee => {
          total += parseFloat(fee.amount) - parseFloat(fee.amount_paid || 0);
        });
      }
    });
    return total;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      waived: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'ווארט',
      partial: 'טיילווייז',
      paid: 'באצאלט',
      waived: 'מחול',
      overdue: 'פארפאלן'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            {student.hebrew_name || student.name || `${student.first_name} ${student.last_name}`}
          </DialogTitle>
          <p className="text-slate-500">
            כיתה: {student.class?.name || 'N/A'} | 
            {student.class?.grade?.name && ` ${student.class.grade.name}`}
          </p>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">פרטים</TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              חשבון ({financials.openBalance > 0 ? `$${financials.openBalance.toFixed(2)}` : 'באַלאַנס'})
            </TabsTrigger>
            <TabsTrigger value="issues">בעיות ({issues.length})</TabsTrigger>
            <TabsTrigger value="remarks">הערות ({remarks.length})</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><User size={16}/> עלטערן</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">טאטי:</span> {student.father_name || 'N/A'}</p>
                  <p><span className="font-medium">מאמע:</span> {student.mother_name || 'N/A'}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Phone size={16}/> קאנטאקט</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">טאטי טעלעפאן:</span> {student.father_phone || 'N/A'}</p>
                  <p><span className="font-medium">מאמע טעלעפאן:</span> {student.mother_phone || 'N/A'}</p>
                  <p><span className="font-medium">אדרעס:</span> {student.address || 'N/A'}, {student.city || ''}</p>
                </div>
              </div>
            </div>
            
            {/* Siblings Section */}
            {siblings.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  ברידער אין שולע ({siblings.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {siblings.map(sibling => (
                    <div key={sibling.id} className="px-3 py-2 bg-white rounded-lg border border-purple-200 text-sm">
                      <span className="font-medium">{sibling.hebrew_name || sibling.first_name} {sibling.last_name}</span>
                      <span className="text-purple-600 mr-2">| {sibling.class?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-4 space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-600" />
              <Label className="font-medium">שנה:</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="וועל אויס יאר..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">אלע יארן</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year} {year === getCurrentAcademicYear() && '(היינט)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">
                {selectedYear === 'all' 
                  ? `ווייזט אלע ${allStudentFees.length} טשאַרדזשעס` 
                  : `ווייזט ${studentFees.length} טשאַרדזשעס פאר ${selectedYear}`}
              </span>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">סה״כ טשאַרדזשעס</p>
                <p className="text-2xl font-bold text-blue-800">${financials.totalCharges.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">באצאלט</p>
                <p className="text-2xl font-bold text-green-800">${financials.totalPaid.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${financials.openBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm font-medium ${financials.openBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>אפענע באַלאַנס</p>
                <p className={`text-2xl font-bold ${financials.openBalance > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                  ${financials.openBalance.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">מחול</p>
                <p className="text-2xl font-bold text-gray-800">${financials.waived.toFixed(2)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowAddCharge(!showAddCharge)} 
                variant={showAddCharge ? "secondary" : "default"}
                size="sm"
              >
                <Plus className="h-4 w-4 ml-1" />
                צולייגן טשאַרדזש
              </Button>
              <Button 
                onClick={() => setShowAddPayment(!showAddPayment)} 
                variant={showAddPayment ? "secondary" : "outline"}
                size="sm"
              >
                <CreditCard className="h-4 w-4 ml-1" />
                רעקאָרדירן צאָלונג
              </Button>
              {siblings.length > 0 && (
                <Button 
                  onClick={() => setShowFamilyPayment(!showFamilyPayment)} 
                  variant={showFamilyPayment ? "secondary" : "outline"}
                  size="sm"
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
                >
                  <Users className="h-4 w-4 ml-1" />
                  משפחה צאָלונג ({siblings.length + 1} קינדער)
                </Button>
              )}
            </div>

            {/* Family Payment Form */}
            {showFamilyPayment && siblings.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-300 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  משפחה צאָלונג - {student.father_name || 'משפחה'}
                </h4>
                <p className="text-sm text-purple-700">
                  וועל אויס קינדער און די צאָלונג וועט זיך צעטיילן צווישן זייערע אפענע באַלאַנסן
                </p>
                
                {/* Student Selection */}
                <div className="space-y-2">
                  <Label>וועל אויס קינדער:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Current student */}
                    <div 
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        familyPayment.selectedStudents[studentId]?.selected 
                          ? 'bg-purple-100 border-purple-400' 
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => toggleStudentSelection(studentId)}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={familyPayment.selectedStudents[studentId]?.selected || false}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">{student.hebrew_name || student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500">{student.class?.name}</p>
                          {familyPayment.selectedStudents[studentId]?.fees && (
                            <p className="text-sm text-red-600 font-medium">
                              באַלאַנס: ${familyPayment.selectedStudents[studentId].fees
                                .reduce((sum, f) => sum + parseFloat(f.amount) - parseFloat(f.amount_paid || 0), 0)
                                .toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Siblings */}
                    {siblings.map(sibling => (
                      <div 
                        key={sibling.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          familyPayment.selectedStudents[sibling.id]?.selected 
                            ? 'bg-purple-100 border-purple-400' 
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => toggleStudentSelection(sibling.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={familyPayment.selectedStudents[sibling.id]?.selected || false}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="font-medium">{sibling.hebrew_name || sibling.first_name} {sibling.last_name}</p>
                            <p className="text-xs text-gray-500">{sibling.class?.name}</p>
                            {familyPayment.selectedStudents[sibling.id]?.fees && (
                              <p className="text-sm text-red-600 font-medium">
                                באַלאַנס: ${familyPayment.selectedStudents[sibling.id].fees
                                  .reduce((sum, f) => sum + parseFloat(f.amount) - parseFloat(f.amount_paid || 0), 0)
                                  .toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-purple-200">
                  <div>
                    <Label>סה״כ סומע</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder={`מאקסימום: $${calculateFamilyBalance().toFixed(2)}`}
                      value={familyPayment.totalAmount}
                      onChange={(e) => setFamilyPayment({...familyPayment, totalAmount: e.target.value})}
                      className="text-lg font-bold"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      סה״כ אויסגעוועלטע באַלאַנס: ${calculateFamilyBalance().toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>צאָלונג מעטאָד</Label>
                    <Select value={familyPayment.payment_method} onValueChange={(v) => setFamilyPayment({...familyPayment, payment_method: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">קעש</SelectItem>
                        <SelectItem value="check">טשעק</SelectItem>
                        <SelectItem value="credit_card">קרעדיט קארד</SelectItem>
                        <SelectItem value="bank_transfer">באנק טראנספער</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>רעפערענס # (טשעק/קארד)</Label>
                    <Input 
                      placeholder="רעפערענס נומער"
                      value={familyPayment.reference_number}
                      onChange={(e) => setFamilyPayment({...familyPayment, reference_number: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleFamilyPayment} 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={calculateFamilyBalance() === 0}
                >
                  <CreditCard className="h-4 w-4 ml-1" />
                  רעקאָרדירן משפחה צאָלונג
                </Button>
              </div>
            )}

            {/* Add Charge Form */}
            {showAddCharge && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                <h4 className="font-semibold">צולייגן נייע טשאַרדזש</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>טשאַרדזש טיפ</Label>
                    <Select value={newCharge.fee_id} onValueChange={(v) => setNewCharge({...newCharge, fee_id: v})}>
                      <SelectTrigger><SelectValue placeholder="וועל אויס..." /></SelectTrigger>
                      <SelectContent>
                        {availableFees.map(fee => (
                          <SelectItem key={fee.id} value={fee.id}>
                            {fee.name} - ${fee.amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סומע (אויב אנדערש)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="סומע"
                      value={newCharge.amount}
                      onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>נאטיצן</Label>
                    <Input 
                      placeholder="נאטיצן"
                      value={newCharge.notes}
                      onChange={(e) => setNewCharge({...newCharge, notes: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleAddCharge} size="sm">צולייגן טשאַרדזש</Button>
              </div>
            )}

            {/* Add Payment Form */}
            {showAddPayment && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                <h4 className="font-semibold">רעקאָרדירן צאָלונג</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>פאר וואס טשאַרדזש</Label>
                    <Select value={newPayment.student_fee_id} onValueChange={(v) => setNewPayment({...newPayment, student_fee_id: v})}>
                      <SelectTrigger><SelectValue placeholder="וועל אויס..." /></SelectTrigger>
                      <SelectContent>
                        {studentFees.filter(sf => sf.status !== 'paid' && sf.status !== 'waived').map(sf => (
                          <SelectItem key={sf.id} value={sf.id}>
                            {sf.fee?.name} - באלאנס: ${(parseFloat(sf.amount) - parseFloat(sf.amount_paid || 0)).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סומע</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="סומע"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>צאָלונג מעטאָד</Label>
                    <Select value={newPayment.payment_method} onValueChange={(v) => setNewPayment({...newPayment, payment_method: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">קעש</SelectItem>
                        <SelectItem value="check">טשעק</SelectItem>
                        <SelectItem value="credit_card">קרעדיט קארד</SelectItem>
                        <SelectItem value="bank_transfer">באנק טראנספער</SelectItem>
                        <SelectItem value="other">אנדערע</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>רעפערענס # (טשעק/קארד)</Label>
                    <Input 
                      placeholder="רעפערענס נומער"
                      value={newPayment.reference_number}
                      onChange={(e) => setNewPayment({...newPayment, reference_number: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleAddPayment} size="sm" className="bg-green-600 hover:bg-green-700">
                  רעקאָרדירן צאָלונג
                </Button>
              </div>
            )}

            {/* Charges List */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                טשאַרדזשעס ({studentFees.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {studentFees.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    {selectedYear === 'all' 
                      ? 'קיין טשאַרדזשעס נישט געפונען' 
                      : `קיין טשאַרדזשעס נישט געפונען פאר ${selectedYear}`}
                  </p>
                ) : (
                  studentFees.map(sf => (
                    <div key={sf.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{sf.fee?.name || 'טשאַרדזש'}</p>
                        <p className="text-sm text-slate-500">
                          {sf.fee?.fee_type?.name} 
                          {sf.fee?.academic_year && <span className="mx-1">|</span>}
                          {sf.fee?.academic_year && <span className="text-blue-600">{sf.fee.academic_year}</span>}
                          {sf.fee?.due_date && <span className="mx-1">|</span>}
                          {sf.fee?.due_date && new Date(sf.fee.due_date).toLocaleDateString('he-IL')}
                        </p>
                        {sf.notes && <p className="text-xs text-slate-400 mt-1">{sf.notes}</p>}
                      </div>
                      <div className="text-left">
                        <p className="font-bold">${parseFloat(sf.amount).toFixed(2)}</p>
                        <p className="text-sm text-green-600">באצאלט: ${parseFloat(sf.amount_paid || 0).toFixed(2)}</p>
                        {getStatusBadge(sf.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transaction History - Payments List (Prominent Section) */}
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800">
                <CreditCard className="h-6 w-6" />
                📜 היסטאריע פון צאָלונגען ({payments.length})
              </h4>
              
              {payments.length === 0 ? (
                <p className="text-slate-500 text-center py-6 bg-white rounded-lg">
                  {selectedYear === 'all' 
                    ? 'קיין צאָלונגען נישט געפונען - דער תלמיד האט נאך נישט באצאלט' 
                    : `קיין צאָלונגען נישט געפונען פאר ${selectedYear}`}
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {/* Payment Summary */}
                  <div className="mb-3 p-3 bg-green-100 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-green-800">סה״כ באצאלט:</span>
                    <span className="text-xl font-bold text-green-700">
                      ${payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Individual Payments */}
                  {payments.map(payment => (
                    <div key={payment.id} className="p-3 bg-white border border-green-200 rounded-lg flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-medium text-green-900">{payment.student_fee?.fee?.name || payment.description || 'צאָלונג'}</p>
                        <p className="text-sm text-slate-600">
                          {payment.payment_method === 'cash' ? '💵 קעש' : 
                           payment.payment_method === 'check' ? '📝 טשעק' :
                           payment.payment_method === 'credit_card' ? '💳 קרעדיט קארד' : 
                           payment.payment_method === 'bank_transfer' ? '🏦 באנק טראנספער' : payment.payment_method}
                          {payment.reference_number && ` - #${payment.reference_number}`}
                          {payment.student_fee?.fee?.academic_year && (
                            <span className="text-blue-600 mr-2"> | {payment.student_fee.fee.academic_year}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(payment.payment_date).toLocaleDateString('he-IL')}
                          {payment.notes && ` - ${payment.notes}`}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-600">${parseFloat(payment.amount).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="mt-4">
            <div className="space-y-3">
              {issues.length === 0 ? (
                <p className="text-slate-500 text-center py-4">קיין בעיות נישט רעקאָרדירט</p>
              ) : (
                issues.map(issue => (
                  <div key={issue.id} className="p-3 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between">
                      <h5 className="font-semibold text-slate-800">{issue.title}</h5>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        issue.status === 'open' ? 'bg-red-100 text-red-700' : 
                        issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{issue.status === 'open' ? 'אפן' : issue.status === 'in_progress' ? 'אין פראצעס' : 'פארטיג'}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{issue.description}</p>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>באריכטעט דורך: {issue.reported_by_user?.first_name} {issue.reported_by_user?.last_name}</span>
                      <span>{new Date(issue.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Remarks Tab */}
          <TabsContent value="remarks" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="צולייגן א הערה..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                />
                <Button onClick={addRemark} size="sm">
                  <MessageSquare className="h-4 w-4 ml-2" /> צולייגן
                </Button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {remarks.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">קיין הערות נישט געפונען</p>
                ) : (
                  remarks.map(remark => (
                    <div key={remark.id} className="p-3 bg-slate-50 rounded-lg border">
                      <p className="text-sm text-slate-700">{remark.content}</p>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>{remark.teacher_name}</span>
                        <span>{new Date(remark.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileModal;