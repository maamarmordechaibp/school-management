import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  User, Phone, Mail, BookOpen, Clock, AlertTriangle, 
  CheckCircle, Plus, FileText, ArrowLeft, Calendar, HelpCircle, AlertCircle, TrendingUp,
  DollarSign, CreditCard, Receipt, Heart, TrendingDown, Filter, Gift, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import AssessmentForm from '@/components/forms/AssessmentForm';
import { WorkflowBadge } from '@/components/ui/workflow-badge';
import StudentPlanModal from '@/components/modals/StudentPlanModal';
import SendEmailModal from '@/components/modals/SendEmailModal';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageSquare, Edit, Heart as HeartIcon } from 'lucide-react';

const StudentProfileView = ({ studentId, onBack }) => {
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState('all'); // Year filter for financial tab
  
  // Transaction Form State
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState('credit'); // 'credit' (payment) or 'debit' (new charge)
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [availableFees, setAvailableFees] = useState([]); // All fees in the system
  const [selectedFeeId, setSelectedFeeId] = useState(''); // Which fee type for new charge
  const [selectedStudentFeeId, setSelectedStudentFeeId] = useState(''); // Which existing charge to pay
  const [paymentMode, setPaymentMode] = useState('existing'); // 'existing' (pay existing charge) or 'new' (new payment/donation)
  
  const [data, setData] = useState({
    calls: [],
    issues: [],
    grades: [],
    assessments: [],
    interventions: [],
    meetings: [],
    plans: [],
    progress_reviews: [],
    studentFees: [],
    payments: []
  });
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Student notes & special ed state
  const [studentNotes, setStudentNotes] = useState([]);
  const [specialEdData, setSpecialEdData] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', note_type: 'general', edit_mode: 'update' });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});

  useEffect(() => {
    fetchStudentData();
    fetchAvailableFees();
  }, [studentId]);

  // Load all available fees in the system for dropdown
  const fetchAvailableFees = async () => {
    try {
      const { data: fees, error } = await supabase
        .from('fees')
        .select('*, fee_type:fee_types(name, category)')
        .order('name');
      
      if (error) {
        console.error('Error loading fees:', error);
        return;
      }
      setAvailableFees(fees || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const fetchStudentData = async () => {
    try {
      // 1. Student Info
      const { data: studentInfo } = await supabase.from('students').select('*').eq('id', studentId).single();
      setStudent(studentInfo);

      // 2. Parallel Fetching for related data
      const [calls, issues, grades, assessments, interventions, meetings, plans, reviews, studentFees, payments] = await Promise.all([
        supabase.from('call_logs').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('issues').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('grades').select('*').eq('student_id', studentId).order('created_at', { ascending: true }),
        supabase.from('assessments').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('interventions').select('*').eq('student_id', studentId).order('start_date', { ascending: false }),
        supabase.from('meetings').select('*').eq('student_id', studentId).order('meeting_date', { ascending: false }),
        supabase.from('student_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('progress_reviews').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('student_fees').select('*, fee:fees(name, description, due_date, academic_year, fee_type:fee_types(name, category))').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*, student_fee:student_fees(id, fee:fees(name, academic_year))').eq('student_id', studentId).order('payment_date', { ascending: false })
      ]);

      setData({
        calls: calls.data || [],
        issues: issues.data || [],
        grades: grades.data || [],
        assessments: assessments.data || [],
        interventions: interventions.data || [],
        meetings: meetings.data || [],
        plans: plans.data || [],
        progress_reviews: reviews.data || [],
        studentFees: studentFees.data || [],
        payments: payments.data || []
      });

      // Fetch student notes (communication log)
      try {
        const { data: notesData } = await supabase
          .from('student_notes')
          .select('*')
          .eq('student_id', studentId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setStudentNotes(notesData || []);
      } catch (e) { console.log('student_notes not available yet'); }

      // Fetch special ed data if exists
      try {
        const { data: sedData } = await supabase
          .from('special_ed_students')
          .select('*')
          .eq('student_id', studentId)
          .eq('is_active', true)
          .maybeSingle();
        if (sedData) {
          // Also fetch info sources and evaluations
          const [sources, evals, tutoring] = await Promise.all([
            supabase.from('special_ed_info_sources').select('*').eq('special_ed_student_id', sedData.id).order('created_at', { ascending: false }),
            supabase.from('special_ed_evaluations').select('*').eq('special_ed_student_id', sedData.id).order('evaluation_date', { ascending: false }),
            supabase.from('special_ed_tutoring').select('*, tutor:special_ed_staff(name, hebrew_name)').eq('special_ed_student_id', sedData.id).eq('is_active', true)
          ]);
          setSpecialEdData({
            ...sedData,
            info_sources: sources.data || [],
            evaluations: evals.data || [],
            tutoring: tutoring.data || []
          });
        } else {
          setSpecialEdData(null);
        }
      } catch (e) { console.log('special_ed tables not available yet'); }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student profile' });
    }
  };

  const handleAssessmentSave = () => {
    setIsAssessmentMode(false);
    setEditingAssessment(null);
    fetchStudentData(); // Refresh list
  };

  // Get unpaid charges for this student (for payment dropdown)
  const unpaidCharges = data.studentFees.filter(sf => 
    sf.status !== 'paid' && sf.status !== 'waived' && 
    (parseFloat(sf.amount) - parseFloat(sf.amount_paid || 0)) > 0
  );

  // Reset form when opening
  const openTransactionForm = (type) => {
    setTransactionType(type);
    setTransactionAmount('');
    setTransactionNote('');
    setSelectedFeeId('');
    setSelectedStudentFeeId('');
    setPaymentMode(type === 'credit' && unpaidCharges.length > 0 ? 'existing' : 'new');
    setShowTransactionForm(true);
  };

  // Transaction Save - handles payments to existing charges, new payments/donations, and new charges
  const saveTransaction = async () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid amount' });
      return;
    }

    setIsSavingTransaction(true);
    try {
      const amount = parseFloat(transactionAmount);
      const note = transactionNote || '';

      if (transactionType === 'credit') {
        // PAYMENT MODE
        if (paymentMode === 'existing' && selectedStudentFeeId) {
          // Pay toward existing charge
          const existingCharge = unpaidCharges.find(c => c.id === selectedStudentFeeId);
          if (!existingCharge) throw new Error('Charge not found');

          const newAmountPaid = parseFloat(existingCharge.amount_paid || 0) + amount;
          const totalAmount = parseFloat(existingCharge.amount);
          const newStatus = newAmountPaid >= totalAmount ? 'paid' : 'partial';

          // Update the student_fee
          await supabase
            .from('student_fees')
            .update({ 
              amount_paid: newAmountPaid,
              status: newStatus 
            })
            .eq('id', selectedStudentFeeId);

          // Create payment record
          await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              student_fee_id: selectedStudentFeeId,
              amount: amount,
              payment_method: 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: note || `Payment for ${existingCharge.fee?.name || 'charge'}`
            });

          toast({ 
            title: '✅ Payment Recorded!', 
            description: `$${amount.toFixed(2)} paid toward ${existingCharge.fee?.name || 'charge'}` 
          });

        } else {
          // NEW payment/donation (not toward existing charge)
          const feeId = selectedFeeId || null;
          
          if (!feeId) {
            // Create a generic donation entry
            let { data: feeTypes } = await supabase
              .from('fee_types')
              .select('id')
              .eq('category', 'donation');
            
            let feeTypeId = feeTypes?.[0]?.id;
            if (!feeTypeId) {
              const { data: newType } = await supabase
                .from('fee_types')
                .insert({ name: 'Donations', description: 'General donations', category: 'donation', is_active: true })
                .select()
                .single();
              feeTypeId = newType.id;
            }

            let { data: fees } = await supabase
              .from('fees')
              .select('id')
              .eq('fee_type_id', feeTypeId)
              .eq('academic_year', '2024-2025');
            
            let genericFeeId = fees?.[0]?.id;
            if (!genericFeeId) {
              const { data: newFee } = await supabase
                .from('fees')
                .insert({ name: 'General Payment', fee_type_id: feeTypeId, academic_year: '2024-2025', is_active: true })
                .select()
                .single();
              genericFeeId = newFee.id;
            }

            // Create student_fee and payment
            const { data: studentFee } = await supabase
              .from('student_fees')
              .insert({
                student_id: studentId,
                fee_id: genericFeeId,
                amount: amount,
                amount_paid: amount,
                status: 'paid',
                notes: note || 'Payment/Donation'
              })
              .select()
              .single();

            await supabase.from('payments').insert({
              student_id: studentId,
              student_fee_id: studentFee.id,
              amount: amount,
              payment_method: 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: note || 'Payment/Donation'
            });

          } else {
            // Payment for specific fee type (like books, trips)
            const { data: studentFee } = await supabase
              .from('student_fees')
              .insert({
                student_id: studentId,
                fee_id: feeId,
                amount: amount,
                amount_paid: amount,
                status: 'paid',
                notes: note
              })
              .select()
              .single();

            const selectedFee = availableFees.find(f => f.id === feeId);
            await supabase.from('payments').insert({
              student_id: studentId,
              student_fee_id: studentFee.id,
              amount: amount,
              payment_method: 'cash',
              payment_date: new Date().toISOString().split('T')[0],
              notes: note || `Payment for ${selectedFee?.name || 'fee'}`
            });
          }

          toast({ title: '✅ Payment Added!', description: `+$${amount.toFixed(2)} recorded` });
        }
        
      } else {
        // DEBIT: New Charge
        if (!selectedFeeId) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please select what this charge is for' });
          setIsSavingTransaction(false);
          return;
        }

        await supabase
          .from('student_fees')
          .insert({
            student_id: studentId,
            fee_id: selectedFeeId,
            amount: amount,
            amount_paid: 0,
            status: 'pending',
            notes: note
          });

        const selectedFee = availableFees.find(f => f.id === selectedFeeId);
        toast({ title: '📝 Charge Added!', description: `$${amount.toFixed(2)} charge for ${selectedFee?.name || 'fee'}` });
      }
      
      // Reset form and refresh
      setTransactionAmount('');
      setTransactionNote('');
      setSelectedFeeId('');
      setSelectedStudentFeeId('');
      setShowTransactionForm(false);
      fetchStudentData();
      
    } catch (error) {
      console.error('Transaction save error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save transaction' });
    } finally {
      setIsSavingTransaction(false);
    }
  };

  if (!student) return <div className="p-8 text-center">Loading profile...</div>;

  const NOTE_TYPES = [
    { value: 'general', label: 'כללי' },
    { value: 'teacher_meeting', label: 'געזעסן מיט מלמד' },
    { value: 'discipline', label: 'דיסציפלין' },
    { value: 'academic', label: 'לערנען' },
    { value: 'behavioral', label: 'אויפפירונג' },
    { value: 'parent_feedback', label: 'פידבעק פון עלטערן' },
    { value: 'other', label: 'אנדערע' },
  ];

  const handleSaveNote = async () => {
    if (!noteForm.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'ביטע שרייב אינהאלט' });
      return;
    }
    try {
      if (editingNote && noteForm.edit_mode === 'edit') {
        await supabase.from('student_notes').update({
          title: noteForm.title, content: noteForm.content, note_type: noteForm.note_type,
          previous_content: editingNote.content, edit_mode: 'edit', updated_at: new Date().toISOString()
        }).eq('id', editingNote.id);
        toast({ title: 'עדיטעד', description: 'נאטיץ איז געטוישט געווארן' });
      } else {
        await supabase.from('student_notes').insert([{
          student_id: studentId, title: noteForm.title || null, content: noteForm.content,
          note_type: noteForm.note_type, edit_mode: 'update'
        }]);
        toast({ title: 'צוגעלייגט', description: 'נאטיץ איז צוגעלייגט געווארן' });
      }
      setIsNoteModalOpen(false);
      setEditingNote(null);
      fetchStudentData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (isAssessmentMode) {
    return (
      <AssessmentForm 
        student={student} 
        assessment={editingAssessment}
        onSave={handleAssessmentSave}
        onCancel={() => {
          setIsAssessmentMode(false);
          setEditingAssessment(null);
        }}
      />
    );
  }

  // Helper for Grade Trends (Simple numeric conversion for demo)
  const gradeChartData = data.grades.map(g => ({
    date: new Date(g.date).toLocaleDateString(),
    grade: isNaN(g.grade) ? 0 : parseInt(g.grade), 
    subject: g.subject
  })).slice(-10);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-800">{student.name}</h1>
            {student.workflow_stage && <WorkflowBadge stage={student.workflow_stage} />}
          </div>
          <p className="text-slate-500">Class: {student.class} • Teacher: {student.teacher}</p>
        </div>
        <div className="ml-auto flex gap-2">
           <Button onClick={() => setIsAssessmentMode(true)} variant="outline">
             <Plus size={16} className="mr-2" /> New Assessment
           </Button>
           <Button onClick={() => {
             setEditingPlan(null);
             setIsPlanModalOpen(true);
           }}>
             <Plus size={16} className="mr-2" /> Create Plan
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6">Overview</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:shadow-none rounded-none px-6 flex items-center gap-2">
            <DollarSign size={16} />
            Financial
          </TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6">Workflow & Plans</TabsTrigger>
          <TabsTrigger value="academic" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6">Academic</TabsTrigger>
          <TabsTrigger value="communication" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6">Communication</TabsTrigger>
          <TabsTrigger value="intervention" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6">Assessments</TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none px-6 flex items-center gap-1">
            <MessageSquare size={14} />
            נאטיצן ({studentNotes.length})
          </TabsTrigger>
          {specialEdData && (
            <TabsTrigger value="special-ed" className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:shadow-none rounded-none px-6 flex items-center gap-1">
              <HeartIcon size={14} />
              חינוך מיוחד
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Info Card */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                   <div className="flex items-center gap-3">
                      <User className="text-slate-400" size={18} />
                      <div>
                        <p className="font-medium">Father: {student.father_name || 'N/A'}</p>
                        <p className="text-slate-500">{student.father_phone}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <User className="text-slate-400" size={18} />
                      <div>
                        <p className="font-medium">Mother: {student.mother_name || 'N/A'}</p>
                        <p className="text-slate-500">{student.mother_phone}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <Phone className="text-slate-400" size={18} />
                      <p>{student.home_phone || 'N/A'}</p>
                   </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                 <CardHeader><CardTitle className="text-lg">Quick Stats</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                       <span>Average Grade</span>
                       <span className="font-bold text-blue-600">
                         {data.grades.length > 0 ? 
                           Math.round(data.grades.reduce((acc, curr) => acc + (parseInt(curr.grade) || 0), 0) / data.grades.length) + '%' 
                           : 'N/A'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                       <span>Open Issues</span>
                       <span className="font-bold text-amber-600">{data.issues.filter(i => i.status === 'open').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                       <span>Assessments</span>
                       <span className="font-bold text-purple-600">{data.assessments.length}</span>
                    </div>
                 </CardContent>
              </Card>

              {/* Recent Issues */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Issues</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                   {data.issues.slice(0,3).map(issue => (
                     <div key={issue.id} className="flex gap-2 items-start text-sm">
                        <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${issue.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                        <div>
                           <p className="font-medium">{issue.title}</p>
                           <p className="text-xs text-slate-500">{new Date(issue.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                   ))}
                   {data.issues.length === 0 && <p className="text-sm text-slate-400">No issues recorded.</p>}
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-6 space-y-6">
          {/* Year Filter */}
          {(() => {
            // Extract unique years
            const years = [...new Set(data.studentFees.map(sf => sf.fee?.academic_year).filter(Boolean))];
            const sortedYears = years.sort().reverse();
            
            // Filter data based on selected year
            const filteredFees = selectedYear === 'all' 
              ? data.studentFees 
              : data.studentFees.filter(sf => sf.fee?.academic_year === selectedYear);
            
            const filteredPayments = selectedYear === 'all'
              ? data.payments
              : data.payments.filter(p => p.student_fee?.fee?.academic_year === selectedYear);

            // Separate donations from regular fees
            const donationFees = filteredFees.filter(sf => sf.fee?.fee_type?.category === 'donation');
            const regularFees = filteredFees.filter(sf => sf.fee?.fee_type?.category !== 'donation');
            
            // Categorize fees
            const mandatoryCategories = ['tuition', 'registration', 'books'];
            const mandatoryFees = regularFees.filter(sf => mandatoryCategories.includes(sf.fee?.fee_type?.category));
            const optionalFees = regularFees.filter(sf => !mandatoryCategories.includes(sf.fee?.fee_type?.category));
            
            // Calculate totals
            const totalCharges = regularFees.reduce((sum, sf) => sum + (parseFloat(sf.amount) || 0), 0);
            const totalPaid = regularFees.reduce((sum, sf) => sum + (parseFloat(sf.amount_paid) || 0), 0);
            const totalDonations = donationFees.reduce((sum, sf) => sum + (parseFloat(sf.amount_paid) || 0), 0);
            
            // Calculate last year donations for comparison
            const currentYearStr = selectedYear !== 'all' ? selectedYear : '2024-2025';
            const lastYearStr = currentYearStr === '2024-2025' ? '2023-2024' : '2022-2023';
            
            const lastYearDonations = data.studentFees
              .filter(sf => sf.fee?.fee_type?.category === 'donation' && sf.fee?.academic_year === lastYearStr)
              .reduce((sum, sf) => sum + (parseFloat(sf.amount_paid) || 0), 0);
            
            const thisYearDonations = data.studentFees
              .filter(sf => sf.fee?.fee_type?.category === 'donation' && sf.fee?.academic_year === currentYearStr)
              .reduce((sum, sf) => sum + (parseFloat(sf.amount_paid) || 0), 0);
            
            const donationChange = thisYearDonations - lastYearDonations;

            return (
              <>
                {/* Year Filter Bar */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <Filter size={20} className="text-slate-600" />
                  <span className="font-medium">Filter by Year:</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={selectedYear === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSelectedYear('all')}
                    >
                      All Years
                    </Button>
                    {sortedYears.map(year => (
                      <Button 
                        key={year}
                        variant={selectedYear === year ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-600 font-medium">Total Charges</p>
                      <p className="text-2xl font-bold text-blue-800">${totalCharges.toFixed(2)}</p>
                      <p className="text-xs text-blue-500 mt-1">(excludes donations)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-600 font-medium">Total Paid</p>
                      <p className="text-2xl font-bold text-green-800">${totalPaid.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className={`${(totalCharges - totalPaid) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <CardContent className="p-4">
                      <p className={`text-sm font-medium ${(totalCharges - totalPaid) > 0 ? 'text-red-600' : 'text-gray-600'}`}>Open Balance</p>
                      <p className={`text-2xl font-bold ${(totalCharges - totalPaid) > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                        ${(totalCharges - totalPaid).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-pink-50 border-pink-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-pink-600 font-medium flex items-center gap-1">
                        <Heart size={14} /> Donations Collected
                      </p>
                      <p className="text-2xl font-bold text-pink-800">${totalDonations.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* ADD TRANSACTION BUTTONS */}
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button 
                    onClick={() => openTransactionForm('credit')}
                    className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-5 h-auto rounded-xl shadow-lg"
                    size="lg"
                  >
                    💵 Add Payment
                  </Button>
                  <Button 
                    onClick={() => openTransactionForm('debit')}
                    className="bg-red-600 hover:bg-red-700 text-white text-lg px-6 py-5 h-auto rounded-xl shadow-lg"
                    size="lg"
                  >
                    📝 Add Charge
                  </Button>
                </div>

                {/* Transaction Form Popup */}
                {showTransactionForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                      <CardHeader className={`border-b ${transactionType === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="flex justify-between items-center">
                          <CardTitle className={`text-xl flex items-center gap-2 ${transactionType === 'credit' ? 'text-green-800' : 'text-red-800'}`}>
                            {transactionType === 'credit' ? '💵 Add Payment' : '📝 Add Charge'}
                          </CardTitle>
                          <Button variant="ghost" size="icon" onClick={() => setShowTransactionForm(false)}>
                            <X size={20} />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">For: <strong>{student.name}</strong></p>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        
                        {transactionType === 'credit' ? (
                          <>
                            {/* PAYMENT MODE: Pay existing charge OR new payment */}
                            {unpaidCharges.length > 0 && (
                              <div className="space-y-2">
                                <Label className="font-bold">Payment Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    type="button"
                                    onClick={() => { setPaymentMode('existing'); setSelectedFeeId(''); }}
                                    className={`h-12 ${paymentMode === 'existing' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-100 text-gray-700'}`}
                                  >
                                    Pay Existing Charge
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => { setPaymentMode('new'); setSelectedStudentFeeId(''); }}
                                    className={`h-12 ${paymentMode === 'new' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-100 text-gray-700'}`}
                                  >
                                    New Payment/Donation
                                  </Button>
                                </div>
                              </div>
                            )}

                            {paymentMode === 'existing' && unpaidCharges.length > 0 ? (
                              /* SELECT EXISTING CHARGE TO PAY */
                              <div className="space-y-2">
                                <Label className="font-bold text-blue-700">📋 Select Charge to Pay</Label>
                                <Select value={selectedStudentFeeId} onValueChange={setSelectedStudentFeeId}>
                                  <SelectTrigger className="h-14 text-lg border-2 border-blue-300">
                                    <SelectValue placeholder="Select a charge..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unpaidCharges.map(charge => {
                                      const balance = parseFloat(charge.amount) - parseFloat(charge.amount_paid || 0);
                                      return (
                                        <SelectItem key={charge.id} value={charge.id} className="py-3">
                                          <div className="flex justify-between items-center w-full">
                                            <span className="font-medium">{charge.fee?.name || 'Charge'}</span>
                                            <span className="text-red-600 font-bold ml-4">
                                              ${balance.toFixed(2)} owed
                                            </span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                {selectedStudentFeeId && (
                                  <p className="text-sm text-blue-600">
                                    Balance: ${(parseFloat(unpaidCharges.find(c => c.id === selectedStudentFeeId)?.amount || 0) - 
                                              parseFloat(unpaidCharges.find(c => c.id === selectedStudentFeeId)?.amount_paid || 0)).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              /* NEW PAYMENT - SELECT FEE TYPE */
                              <div className="space-y-2">
                                <Label className="font-bold text-green-700">📋 What is this payment for? (Optional)</Label>
                                <Select value={selectedFeeId || 'general'} onValueChange={(val) => setSelectedFeeId(val === 'general' ? '' : val)}>
                                  <SelectTrigger className="h-12 border-2 border-green-300">
                                    <SelectValue placeholder="General payment / donation" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General Payment / Donation</SelectItem>
                                    {availableFees.map(fee => (
                                      <SelectItem key={fee.id} value={fee.id}>
                                        {fee.name} {fee.fee_type?.name ? `(${fee.fee_type.name})` : ''} - {fee.academic_year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        ) : (
                          /* DEBIT: SELECT FEE TYPE FOR NEW CHARGE */
                          <div className="space-y-2">
                            <Label className="font-bold text-red-700">📋 What is this charge for? *</Label>
                            <Select value={selectedFeeId} onValueChange={setSelectedFeeId}>
                              <SelectTrigger className="h-14 text-lg border-2 border-red-300">
                                <SelectValue placeholder="Select fee type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFees.map(fee => (
                                  <SelectItem key={fee.id} value={fee.id}>
                                    {fee.name} {fee.fee_type?.name ? `(${fee.fee_type.name})` : ''} - {fee.academic_year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Amount Input - BIG */}
                        <div>
                          <Label className="text-lg font-bold">סכום / Amount ($)</Label>
                          <div className="relative mt-2">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold ${transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={transactionAmount}
                              onChange={(e) => setTransactionAmount(e.target.value)}
                              placeholder="0.00"
                              className={`text-4xl h-20 pl-12 text-center font-bold border-2 ${transactionType === 'credit' ? 'border-green-300 focus:border-green-500' : 'border-red-300 focus:border-red-500'}`}
                            />
                          </div>
                        </div>

                        {/* Note Input - Optional */}
                        <div>
                          <Label className="text-sm">באמערקונג / Note (optional)</Label>
                          <Textarea
                            value={transactionNote}
                            onChange={(e) => setTransactionNote(e.target.value)}
                            placeholder="Additional details..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        {/* Save Button - BIG */}
                        <Button
                          onClick={saveTransaction}
                          disabled={isSavingTransaction || !transactionAmount || (transactionType === 'debit' && !selectedFeeId)}
                          className={`w-full h-14 text-xl ${transactionType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                          {isSavingTransaction ? (
                            'Saving...'
                          ) : transactionType === 'credit' ? (
                            <>✅ Save Payment</>
                          ) : (
                            <>📝 Save Charge</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Donation Year Comparison Card */}
                {(thisYearDonations > 0 || lastYearDonations > 0) && (
                  <Card className="border-2 border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gift size={20} className="text-pink-600" />
                        🎁 דאנאציעס געזאמלט / Donation Collection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Last Year */}
                        <div className="p-4 bg-white rounded-lg border">
                          <p className="text-sm text-slate-500 mb-1">Last Year ({lastYearStr})</p>
                          <p className="text-3xl font-bold text-slate-700">${lastYearDonations.toFixed(2)}</p>
                        </div>
                        
                        {/* This Year */}
                        <div className="p-4 bg-white rounded-lg border border-pink-300">
                          <p className="text-sm text-pink-600 mb-1">This Year ({currentYearStr})</p>
                          <p className="text-3xl font-bold text-pink-700">${thisYearDonations.toFixed(2)}</p>
                        </div>
                        
                        {/* Comparison */}
                        <div className={`p-4 rounded-lg border ${donationChange >= 0 ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                          <p className="text-sm text-slate-600 mb-1">Change</p>
                          <div className="flex items-center gap-2">
                            {donationChange >= 0 ? (
                              <TrendingUp size={24} className="text-green-600" />
                            ) : (
                              <TrendingDown size={24} className="text-amber-600" />
                            )}
                            <p className={`text-3xl font-bold ${donationChange >= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                              {donationChange >= 0 ? '+' : ''}${donationChange.toFixed(2)}
                            </p>
                          </div>
                          {lastYearDonations > 0 && (
                            <p className={`text-xs mt-1 ${donationChange >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                              {((donationChange / lastYearDonations) * 100).toFixed(0)}% {donationChange >= 0 ? 'increase' : 'decrease'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Donation Details */}
                      {donationFees.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Donation Campaigns:</p>
                          <div className="space-y-2">
                            {donationFees.map(df => (
                              <div key={df.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                  <p className="font-medium text-pink-800">{df.fee?.name}</p>
                                  <p className="text-xs text-slate-500">{df.fee?.academic_year}</p>
                                </div>
                                <p className="font-bold text-pink-600">${parseFloat(df.amount_paid || 0).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment History */}
                  <Card className="border-2 border-green-300">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                        <CreditCard size={20} />
                        📜 Payment History ({filteredPayments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {filteredPayments.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No payments recorded {selectedYear !== 'all' ? `for ${selectedYear}` : 'yet'}</p>
                      ) : (
                        <>
                          {/* Total paid summary */}
                          <div className="p-3 bg-green-100 rounded-lg flex justify-between items-center mb-4">
                            <span className="font-medium text-green-800">Total Paid:</span>
                            <span className="text-xl font-bold text-green-700">
                              ${filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {filteredPayments.map(payment => (
                            <div key={payment.id} className="p-3 bg-white border border-green-200 rounded-lg shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-green-900">{payment.student_fee?.fee?.name || 'Payment'}</p>
                                  <p className="text-sm text-slate-600">
                                    {payment.payment_method === 'cash' ? '💵 Cash' : 
                                     payment.payment_method === 'check' ? '📝 Check' :
                                     payment.payment_method === 'credit_card' ? '💳 Credit Card' : 
                                     payment.payment_method === 'bank_transfer' ? '🏦 Bank Transfer' : payment.payment_method}
                                    {payment.reference_number && ` - #${payment.reference_number}`}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                    {payment.notes && ` - ${payment.notes}`}
                                  </p>
                                </div>
                                <p className="font-bold text-green-600 text-lg">${parseFloat(payment.amount).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Charges / Fees */}
                  <Card>
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                        <Receipt size={20} />
                        Charges ({regularFees.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {regularFees.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No charges recorded {selectedYear !== 'all' ? `for ${selectedYear}` : ''}</p>
                      ) : (
                        <>
                          {/* Mandatory Fees Section */}
                          {mandatoryFees.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                                <AlertCircle size={14} /> Mandatory Fees ({mandatoryFees.length})
                              </p>
                              {mandatoryFees.map(sf => (
                                <div key={sf.id} className="p-3 mb-2 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{sf.fee?.name || 'Charge'}</p>
                                      <span className="text-xs px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-medium">Required</span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                      {sf.fee?.fee_type?.name}
                                      {sf.fee?.academic_year && <span className="text-blue-600 ml-2">| {sf.fee.academic_year}</span>}
                                    </p>
                                    {sf.notes && <p className="text-xs text-slate-400 mt-1">{sf.notes}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">${parseFloat(sf.amount).toFixed(2)}</p>
                                    <p className="text-sm text-green-600">Paid: ${parseFloat(sf.amount_paid || 0).toFixed(2)}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      sf.status === 'paid' ? 'bg-green-100 text-green-800' :
                                      sf.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                      sf.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      sf.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>{sf.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Optional Fees Section */}
                          {optionalFees.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-1">
                                <HelpCircle size={14} /> Optional Fees ({optionalFees.length})
                              </p>
                              {optionalFees.map(sf => (
                                <div key={sf.id} className="p-3 mb-2 bg-white border rounded-lg flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{sf.fee?.name || 'Charge'}</p>
                                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Optional</span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                      {sf.fee?.fee_type?.name}
                                      {sf.fee?.academic_year && <span className="text-blue-600 ml-2">| {sf.fee.academic_year}</span>}
                                    </p>
                                    {sf.notes && <p className="text-xs text-slate-400 mt-1">{sf.notes}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">${parseFloat(sf.amount).toFixed(2)}</p>
                                    <p className="text-sm text-green-600">Paid: ${parseFloat(sf.amount_paid || 0).toFixed(2)}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      sf.status === 'paid' ? 'bg-green-100 text-green-800' :
                                      sf.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                      sf.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      sf.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>{sf.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* Workflow & Plans Tab */}
        <TabsContent value="workflow" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Plans */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Student Plans</h3>
                <Button size="sm" onClick={() => {
                  setEditingPlan(null);
                  setIsPlanModalOpen(true);
                }}>
                  <Plus size={14} className="mr-1" /> New Plan
                </Button>
              </div>
              
              {data.plans.length > 0 ? (
                <div className="space-y-3">
                  {data.plans.map(plan => (
                    <Card key={plan.id} className="cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsPlanModalOpen(true);
                      }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-blue-500" />
                            <span className="font-semibold">Plan created {new Date(plan.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded capitalize ${
                            plan.status === 'active' ? 'bg-green-100 text-green-800' :
                            plan.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            plan.status === 'needs_adjustment' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>{plan.status?.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{plan.goals}</p>
                        <div className="flex gap-2 flex-wrap">
                          {plan.interventions && plan.interventions.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {plan.interventions.length} intervention{plan.interventions.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                            {plan.review_frequency || 'monthly'} reviews
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-50">
                  <CardContent className="p-8 text-center text-slate-500">
                    <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No plans created yet</p>
                    <Button size="sm" className="mt-3" onClick={() => setIsPlanModalOpen(true)}>
                      Create First Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Progress Reviews */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Progress Reviews</h3>
              {data.progress_reviews.length > 0 ? (
                <div className="space-y-3">
                  {data.progress_reviews.map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {review.progress_rating === 'excellent' && <TrendingUp className="text-green-600" size={18} />}
                            {review.progress_rating === 'good' && <CheckCircle className="text-blue-600" size={18} />}
                            {review.progress_rating === 'fair' && <Clock className="text-yellow-600" size={18} />}
                            {review.progress_rating === 'poor' && <AlertCircle className="text-red-600" size={18} />}
                            <span className="font-semibold capitalize">{review.progress_rating} Progress</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.notes && (
                          <p className="text-sm text-slate-600 mb-2">{review.notes}</p>
                        )}
                        {review.concerns && (
                          <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 mb-2">
                            <span className="font-semibold text-orange-800">Concerns: </span>
                            <span className="text-orange-700">{review.concerns}</span>
                          </div>
                        )}
                        {review.escalate_to_mz && (
                          <div className="text-xs bg-red-50 border border-red-200 rounded p-2 flex items-center gap-1">
                            <AlertCircle size={12} className="text-red-600" />
                            <span className="text-red-800 font-semibold">Escalated to M.Z. - Needs Plan Adjustment</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-50">
                  <CardContent className="p-8 text-center text-slate-500">
                    <TrendingUp size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No progress reviews yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="mt-6 space-y-6">
           <Card>
             <CardHeader><CardTitle>Performance Trends</CardTitle></CardHeader>
             <CardContent className="h-80">
               {gradeChartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="grade" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                 </ResponsiveContainer>
               ) : <div className="flex h-full items-center justify-center text-slate-400">No grade data available</div>}
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <h3 className="font-semibold text-lg">Grade History</h3>
                 <div className="bg-white rounded border divide-y max-h-[400px] overflow-y-auto">
                    {data.grades.map(g => (
                      <div key={g.id} className="p-3 flex justify-between items-center">
                         <div>
                            <p className="font-medium">{g.subject}</p>
                            <p className="text-xs text-slate-500">{new Date(g.date).toLocaleDateString()}</p>
                         </div>
                         <span className="font-bold bg-slate-100 px-2 py-1 rounded">{g.grade}</span>
                      </div>
                    ))}
                    {data.grades.length === 0 && <p className="p-4 text-center text-slate-400">No grades recorded.</p>}
                 </div>
              </div>
           </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="mt-6 space-y-6">
           <div className="grid grid-cols-1 gap-6">
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Detailed Call History</CardTitle>
                    <span className="text-sm text-slate-500">{data.calls.length} Total Calls</span>
                 </CardHeader>
                 <CardContent>
                   <div className="rounded-md border overflow-hidden">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                           <tr>
                              <th className="px-4 py-3">Date & Time</th>
                              <th className="px-4 py-3">Contact</th>
                              <th className="px-4 py-3">Outcome</th>
                              <th className="px-4 py-3">Notes</th>
                              <th className="px-4 py-3">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {data.calls.map(call => (
                              <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                       <span className="font-medium">{new Date(call.created_at).toLocaleDateString()}</span>
                                       <span className="text-xs text-slate-500">{new Date(call.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3">
                                    <p className="font-medium">{call.contact_person}</p>
                                    <p className="text-xs text-slate-500">{call.phone_number}</p>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border">
                                       {call.outcome || 'N/A'}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 max-w-xs truncate" title={call.notes}>
                                    {call.notes || '-'}
                                 </td>
                                 <td className="px-4 py-3">
                                     <span className="flex items-center text-green-600 gap-1 text-xs"><CheckCircle size={14}/> Logged</span>
                                     {call.follow_up_date && (
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                           <Clock size={10}/> {new Date(call.follow_up_date).toLocaleDateString()}
                                        </div>
                                     )}
                                 </td>
                              </tr>
                           ))}
                           {data.calls.length === 0 && (
                              <tr>
                                 <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    No call logs found for this student.
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                 </CardContent>
              </Card>

              <Card>
                 <CardHeader><CardTitle>Meetings</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    {data.meetings.map(m => (
                      <div key={m.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded">
                         <Calendar className="shrink-0 text-slate-400" />
                         <div>
                            <p className="font-medium">{m.title}</p>
                            <p className="text-sm text-slate-600">{new Date(m.meeting_date).toLocaleDateString()} at {new Date(m.meeting_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <p className="text-xs text-slate-500 mt-1 capitalize">Status: {m.status}</p>
                         </div>
                      </div>
                    ))}
                    {data.meetings.length === 0 && <p className="text-center text-slate-400">No meetings scheduled.</p>}
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Intervention Tab */}
        <TabsContent value="intervention" className="mt-6 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Assessments & Plans</h3>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessments List */}
              <div className="space-y-4">
                 <h4 className="font-semibold text-slate-600">Assessments History</h4>
                 {data.assessments.map(assessment => (
                   <Card key={assessment.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => {
                     setEditingAssessment(assessment);
                     setIsAssessmentMode(true);
                   }}>
                      <CardContent className="p-4 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <FileText className="text-slate-400" />
                            <div>
                               <p className="font-medium">
                                 {assessment.template_id ? 'Custom Assessment' : 'Standard Assessment'} 
                                 <span className="text-slate-400 mx-2">|</span>
                                 {new Date(assessment.date).toLocaleDateString()}
                               </p>
                               <p className="text-xs text-slate-500">By {assessment.teacher_name}</p>
                            </div>
                         </div>
                         <span className={`text-xs px-2 py-1 rounded capitalize ${
                            assessment.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                         }`}>{assessment.status}</span>
                      </CardContent>
                   </Card>
                 ))}
                 {data.assessments.length === 0 && (
                   <div className="border-2 border-dashed border-slate-200 rounded p-6 text-center text-slate-400">
                      No assessments created yet.
                   </div>
                 )}
              </div>

              {/* Interventions / Plans */}
              <div className="space-y-4">
                 <h4 className="font-semibold text-slate-600">Intervention Plans</h4>
                 <Card className="bg-slate-50">
                    <CardContent className="p-4 text-center text-slate-500 italic flex flex-col items-center">
                       <HelpCircle className="mb-2" />
                       Intervention plans are typically generated from Finalized Assessments.
                    </CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>

        {/* Notes / Communication Log Tab */}
        <TabsContent value="notes" className="mt-6 space-y-6" dir="rtl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">נאטיצן / קאמיוניקעישאן לאג</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setEmailContext({
                  subject: `וועגן ${student.hebrew_name || student.first_name || student.name}`,
                  body: `אינפארמאציע וועגן ${student.hebrew_name || student.first_name || student.name}\n\n`
                });
                setIsEmailModalOpen(true);
              }}>
                <Mail size={14} className="ml-1" /> אימעיל
              </Button>
              <Button size="sm" onClick={() => {
                setEditingNote(null);
                setNoteForm({ title: '', content: '', note_type: 'general', edit_mode: 'update' });
                setIsNoteModalOpen(true);
              }}>
                <Plus size={14} className="ml-1" /> נייע נאטיץ
              </Button>
            </div>
          </div>

          {studentNotes.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="p-8 text-center text-slate-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
                <p>קיין נאטיצן נישט פאראן נאך</p>
                <Button size="sm" className="mt-3" onClick={() => {
                  setEditingNote(null);
                  setNoteForm({ title: '', content: '', note_type: 'general', edit_mode: 'update' });
                  setIsNoteModalOpen(true);
                }}>ערשטע נאטיץ צולייגן</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {studentNotes.map(note => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type}
                          </Badge>
                          {note.title && <span className="font-bold">{note.title}</span>}
                          {note.edit_mode === 'edit' && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">עדיטעד</Badge>
                          )}
                        </div>
                        <p className="text-slate-700 mt-1">{note.content}</p>
                        {note.previous_content && (
                          <details className="mt-2">
                            <summary className="text-xs text-orange-600 cursor-pointer">פריערדיגע ווערזיע</summary>
                            <p className="text-xs text-slate-400 mt-1 p-2 bg-slate-50 rounded">{note.previous_content}</p>
                          </details>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{new Date(note.created_at).toLocaleDateString('he-IL')}</span>
                          <span>{new Date(note.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                          {note.created_by_name && <span>דורך: {note.created_by_name}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingNote(note);
                        setNoteForm({
                          title: note.title || '', content: note.content,
                          note_type: note.note_type, edit_mode: 'edit'
                        });
                        setIsNoteModalOpen(true);
                      }}>
                        <Edit size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Special Education Tab */}
        {specialEdData && (
          <TabsContent value="special-ed" className="mt-6 space-y-6" dir="rtl">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <HeartIcon size={20} className="text-pink-600" /> חינוך מיוחד אינפארמאציע
              </h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className="bg-blue-100 text-blue-800">סטאטוס: {specialEdData.status}</Badge>
                {specialEdData.referral_reason && (
                  <Badge variant="outline">סיבה: {specialEdData.referral_reason}</Badge>
                )}
              </div>
            </div>

            {/* Info Sources */}
            {specialEdData.info_sources?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">אינפארמאציע קוואלן</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {specialEdData.info_sources.map(src => (
                    <div key={src.id} className="p-3 bg-slate-50 rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{src.source_type}</Badge>
                        {src.source_name && <span className="font-medium text-sm">{src.source_name}</span>}
                        <span className="text-xs text-slate-400">{new Date(src.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      <p className="text-sm">{src.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Evaluations */}
            {specialEdData.evaluations?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">עוואלואציעס</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {specialEdData.evaluations.map(ev => (
                    <div key={ev.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <Badge className={ev.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {ev.status}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {ev.evaluation_date && new Date(ev.evaluation_date).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      {ev.evaluator_name && <p className="text-sm"><span className="font-medium">עוואלואטער:</span> {ev.evaluator_name}</p>}
                      {ev.results && <p className="text-sm mt-1"><span className="font-medium">רעזולטאטן:</span> {ev.results}</p>}
                      {ev.recommendations && <p className="text-sm mt-1"><span className="font-medium">המלצות:</span> {ev.recommendations}</p>}
                      {ev.action_plan && <p className="text-sm mt-1"><span className="font-medium">פלאן:</span> {ev.action_plan}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tutoring */}
            {specialEdData.tutoring?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">שיעורים פרטיים</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {specialEdData.tutoring.map(t => (
                      <div key={t.id} className="p-3 bg-purple-50 rounded border border-purple-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {t.tutor?.hebrew_name || t.tutor?.name || t.tutor_name}
                            </p>
                            <p className="text-sm text-slate-600">{t.subject}</p>
                          </div>
                          <div className="text-left text-sm">
                            <p>{t.day_of_week} {t.start_time}–{t.end_time}</p>
                          </div>
                        </div>
                        {t.notes && <p className="text-xs text-slate-500 mt-1">{t.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {specialEdData.notes && (
              <Card>
                <CardHeader><CardTitle className="text-lg">באמערקונגען</CardTitle></CardHeader>
                <CardContent>
                  <p>{specialEdData.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

      </Tabs>

      {/* Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'עדיט נאטיץ' : 'נייע נאטיץ'} - {student.hebrew_name || student.first_name || student.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editingNote && (
              <div>
                <Label>מאָדע</Label>
                <Select value={noteForm.edit_mode} onValueChange={(v) => setNoteForm({ ...noteForm, edit_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">UPDATE - לאז פריערדיגע, לייג צו נייע</SelectItem>
                    <SelectItem value="edit">EDIT - טוישט וואס עס שטייט (האלט רעקארד)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טיפ</Label>
                <Select value={noteForm.note_type} onValueChange={(v) => setNoteForm({ ...noteForm, note_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>טיטל</Label>
                <Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>אינהאלט *</Label>
              <Textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} rows={5} placeholder="וואס איז גערעדט געווארן..." />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setEmailContext({
                subject: `נאטיץ - ${student.hebrew_name || student.first_name || student.name}`,
                body: `${noteForm.title ? noteForm.title + '\n\n' : ''}${noteForm.content}`
              });
              setIsEmailModalOpen(true);
            }}>
              <Mail size={14} className="ml-1" /> שיק אימעיל
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>בטל</Button>
              <Button onClick={handleSaveNote}>
                {editingNote && noteForm.edit_mode === 'edit' ? 'EDIT - טוישן' : 'UPDATE - צולייגן'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={emailContext.subject}
        defaultBody={emailContext.body}
      />
      {/* Student Plan Modal */}
      <StudentPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
        studentId={studentId}
        plan={editingPlan}
        onSuccess={() => {
          fetchStudentData();
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
      />
    </div>
  );
};

export default StudentProfileView;