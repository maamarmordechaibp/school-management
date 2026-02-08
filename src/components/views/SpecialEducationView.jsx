import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import {
  Plus, Search, Edit, Trash2, User, Users, Calendar, Clock,
  FileText, ClipboardList, BookOpen, UserCheck, AlertCircle,
  ChevronDown, ChevronUp, Eye, Mail, RefreshCw, Loader2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'monitoring', label: 'מאניטארינג', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'referral_pending', label: 'ווארט אויף בדיקה', color: 'bg-orange-100 text-orange-800' },
  { value: 'being_evaluated', label: 'ווערט בודק', color: 'bg-blue-100 text-blue-800' },
  { value: 'has_plan', label: 'האט א פלאן', color: 'bg-purple-100 text-purple-800' },
  { value: 'receiving_services', label: 'באקומט הילף', color: 'bg-green-100 text-green-800' },
  { value: 'discharged', label: 'פארטיג', color: 'bg-gray-100 text-gray-800' },
];

const HELP_TYPES = [
  { value: 'speech', label: 'שפראך טעראפיע' },
  { value: 'OT', label: 'OT - אקיופעישענאל טעראפיע' },
  { value: 'PT', label: 'PT - פיזיקאל טעראפיע' },
  { value: 'behavioral', label: 'ביהייוויער' },
  { value: 'academic', label: 'לערנען הילף' },
  { value: 'social_skills', label: 'סאשיאל סקילס' },
  { value: 'reading', label: 'לייענען' },
  { value: 'other', label: 'אנדערע' },
];

const SOURCE_TYPES = [
  { value: 'principal', label: 'מנהל' },
  { value: 'teacher', label: 'מלמד' },
  { value: 'parent', label: 'עלטערן' },
  { value: 'private_tutor', label: 'פריוואטע מלמד' },
  { value: 'therapist', label: 'טעראפיסט' },
  { value: 'other', label: 'אנדערע' },
];

const EVAL_TYPES = [
  { value: 'psychoeducational', label: 'פסיכא-עדיוקעישאנאל' },
  { value: 'speech', label: 'שפראך' },
  { value: 'OT', label: 'OT' },
  { value: 'behavioral', label: 'ביהייוויער' },
  { value: 'academic', label: 'אקאדעמיש' },
  { value: 'other', label: 'אנדערע' },
];

const STAFF_ROLES = [
  { value: 'coordinator', label: 'קאארדינאטאר' },
  { value: 'psychologist', label: 'פסיכאלאגיסט' },
  { value: 'speech_therapist', label: 'שפראך טעראפיסט' },
  { value: 'OT', label: 'OT טעראפיסט' },
  { value: 'PT', label: 'PT טעראפיסט' },
  { value: 'resource_teacher', label: 'ריסורס מלמד' },
  { value: 'aide', label: 'עוזר/הילף' },
  { value: 'other', label: 'אנדערע' },
];

const DAYS = ['זונטאג', 'מאנטאג', 'דינסטאג', 'מיטוואך', 'דאנערשטאג', 'פרייטאג', 'שבת'];

const SpecialEducationView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [specEdStudents, setSpecEdStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [specEdStaff, setSpecEdStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isTutoringModalOpen, setIsTutoringModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSessionLogModalOpen, setIsSessionLogModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  
  // Selected items
  const [selectedSpecEd, setSelectedSpecEd] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  
  // Form data
  const [studentForm, setStudentForm] = useState({
    student_id: '', status: 'monitoring', referral_reason: '', help_type: '',
    help_description: '', current_plan: '', referral_date: new Date().toISOString().split('T')[0]
  });
  
  const [infoForm, setInfoForm] = useState({
    source_type: 'teacher', source_name: '', content: '',
    date_gathered: new Date().toISOString().split('T')[0]
  });
  
  const [evalForm, setEvalForm] = useState({
    evaluation_type: 'psychoeducational', evaluator_name: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    results: '', recommendations: '', plan: '', actual_actions: ''
  });
  
  const [tutoringForm, setTutoringForm] = useState({
    tutor_name: '', tutor_phone: '', tutor_type: 'private_teacher',
    subject: '', schedule_days: '', schedule_time: '', location: '',
    frequency: 'weekly', session_duration_minutes: 45, notes: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  
  const [staffForm, setStaffForm] = useState({
    name: '', hebrew_name: '', role: 'resource_teacher', phone: '',
    email: '', specialization: '', certification: '', notes: ''
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 1, start_time: '08:00', end_time: '15:00',
    location: '', status: 'in_school', notes: ''
  });

  const [sessionForm, setSessionForm] = useState({
    special_ed_staff_id: '', tutor_name: '',
    session_date: new Date().toISOString().split('T')[0],
    session_time: '', duration_minutes: 30,
    subject: '', content: '', progress_notes: '', goals_worked_on: ''
  });

  // Detail view data
  const [detailData, setDetailData] = useState({
    infoSources: [], evaluations: [], tutoring: [], sessionLogs: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load spec ed students with student info
      const { data: specEdData } = await supabase
        .from('special_ed_students')
        .select(`
          *,
          student:students(id, first_name, last_name, hebrew_name, class_id,
            class:classes!class_id(name, grade:grades(name))
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setSpecEdStudents(specEdData || []);

      // Load all students for dropdown
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class_id, class:classes!class_id(name)')
        .eq('status', 'active')
        .order('last_name');
      setAllStudents(studentsData || []);

      // Load special ed staff
      const { data: staffData } = await supabase
        .from('special_ed_staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      setSpecEdStaff(staffData || []);

      // Load classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, grade:grades(name)')
        .order('name');
      setClasses(classesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Load detail data for expanded student
  const loadStudentDetail = async (specEdId) => {
    try {
      const [infoRes, evalRes, tutorRes, sessRes] = await Promise.all([
        supabase.from('special_ed_info_sources').select('*').eq('special_ed_student_id', specEdId).order('date_gathered', { ascending: false }),
        supabase.from('special_ed_evaluations').select('*').eq('special_ed_student_id', specEdId).order('evaluation_date', { ascending: false }),
        supabase.from('special_ed_tutoring').select('*').eq('special_ed_student_id', specEdId).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('special_ed_session_logs').select('*, staff:special_ed_staff(name)').eq('special_ed_student_id', specEdId).order('session_date', { ascending: false }).limit(20)
      ]);
      setDetailData({
        infoSources: infoRes.data || [],
        evaluations: evalRes.data || [],
        tutoring: tutorRes.data || [],
        sessionLogs: sessRes.data || []
      });
    } catch (error) {
      console.error('Error loading detail:', error);
    }
  };

  // Load staff schedules
  const [staffSchedules, setStaffSchedules] = useState([]);
  const loadStaffSchedules = async (staffId) => {
    const { data } = await supabase
      .from('special_ed_staff_schedule')
      .select('*')
      .eq('special_ed_staff_id', staffId)
      .eq('is_active', true)
      .order('day_of_week');
    setStaffSchedules(data || []);
  };

  // Toggle student detail
  const toggleStudentDetail = async (specEdId) => {
    if (expandedStudentId === specEdId) {
      setExpandedStudentId(null);
    } else {
      setExpandedStudentId(specEdId);
      await loadStudentDetail(specEdId);
    }
  };

  // CRUD - Add/Edit Special Ed Student
  const handleSaveStudent = async () => {
    if (!studentForm.student_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a student' });
      return;
    }
    try {
      const payload = {
        student_id: studentForm.student_id,
        status: studentForm.status,
        referral_reason: studentForm.referral_reason || null,
        referral_date: studentForm.referral_date || null,
        help_type: studentForm.help_type || null,
        help_description: studentForm.help_description || null,
        current_plan: studentForm.current_plan || null,
        created_by: currentUser?.id
      };

      if (selectedSpecEd) {
        const { error } = await supabase.from('special_ed_students').update(payload).eq('id', selectedSpecEd.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Student record updated' });
      } else {
        const { error } = await supabase.from('special_ed_students').insert([payload]);
        if (error) throw error;
        toast({ title: 'Added', description: 'Student added to special education' });
      }
      setIsStudentModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Add Info Source
  const handleSaveInfoSource = async () => {
    if (!infoForm.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter content' });
      return;
    }
    try {
      const { error } = await supabase.from('special_ed_info_sources').insert([{
        special_ed_student_id: selectedSpecEd.id,
        source_type: infoForm.source_type,
        source_name: infoForm.source_name || null,
        content: infoForm.content,
        date_gathered: infoForm.date_gathered,
        gathered_by: currentUser?.id,
        gathered_by_name: currentUser?.name || currentUser?.first_name
      }]);
      if (error) throw error;
      toast({ title: 'Added', description: 'Information recorded' });
      setIsInfoModalOpen(false);
      loadStudentDetail(selectedSpecEd.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save Evaluation
  const handleSaveEvaluation = async () => {
    try {
      const { error } = await supabase.from('special_ed_evaluations').insert([{
        special_ed_student_id: selectedSpecEd.id,
        evaluation_type: evalForm.evaluation_type,
        evaluator_name: evalForm.evaluator_name || null,
        evaluation_date: evalForm.evaluation_date,
        results: evalForm.results || null,
        recommendations: evalForm.recommendations || null,
        plan: evalForm.plan || null,
        actual_actions: evalForm.actual_actions || null,
        created_by: currentUser?.id
      }]);
      if (error) throw error;
      toast({ title: 'Added', description: 'Evaluation recorded' });
      setIsEvalModalOpen(false);
      loadStudentDetail(selectedSpecEd.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save Tutoring
  const handleSaveTutoring = async () => {
    if (!tutoringForm.tutor_name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter tutor name' });
      return;
    }
    try {
      const { error } = await supabase.from('special_ed_tutoring').insert([{
        special_ed_student_id: selectedSpecEd.id,
        ...tutoringForm
      }]);
      if (error) throw error;
      toast({ title: 'Added', description: 'Tutoring assignment saved' });
      setIsTutoringModalOpen(false);
      loadStudentDetail(selectedSpecEd.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save Staff
  const handleSaveStaff = async () => {
    if (!staffForm.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter staff name' });
      return;
    }
    try {
      if (selectedStaff) {
        const { error } = await supabase.from('special_ed_staff').update(staffForm).eq('id', selectedStaff.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Staff record updated' });
      } else {
        const { error } = await supabase.from('special_ed_staff').insert([staffForm]);
        if (error) throw error;
        toast({ title: 'Added', description: 'Staff member added' });
      }
      setIsStaffModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save Schedule
  const handleSaveSchedule = async () => {
    try {
      const { error } = await supabase.from('special_ed_staff_schedule').insert([{
        special_ed_staff_id: selectedStaff.id,
        ...scheduleForm
      }]);
      if (error) throw error;
      toast({ title: 'Added', description: 'Schedule saved' });
      setIsScheduleModalOpen(false);
      loadStaffSchedules(selectedStaff.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save Session Log
  const handleSaveSessionLog = async () => {
    if (!sessionForm.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter session content' });
      return;
    }
    try {
      const { error } = await supabase.from('special_ed_session_logs').insert([{
        special_ed_student_id: selectedSpecEd.id,
        special_ed_staff_id: sessionForm.special_ed_staff_id || null,
        tutor_name: sessionForm.tutor_name || null,
        session_date: sessionForm.session_date,
        session_time: sessionForm.session_time || null,
        duration_minutes: sessionForm.duration_minutes || null,
        subject: sessionForm.subject || null,
        content: sessionForm.content,
        progress_notes: sessionForm.progress_notes || null,
        goals_worked_on: sessionForm.goals_worked_on || null
      }]);
      if (error) throw error;
      toast({ title: 'Added', description: 'Session log saved' });
      setIsSessionLogModalOpen(false);
      loadStudentDetail(selectedSpecEd.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : <Badge>{status}</Badge>;
  };

  const openSendEmail = (subject, body) => {
    setEmailContext({ subject, body });
    setIsEmailModalOpen(true);
  };

  // Filter students
  const filteredStudents = specEdStudents.filter(s => {
    const matchesSearch = !searchQuery ||
      s.student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student?.hebrew_name?.includes(searchQuery) ||
      s.referral_reason?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: specEdStudents.length,
    monitoring: specEdStudents.filter(s => s.status === 'monitoring').length,
    pendingEval: specEdStudents.filter(s => s.status === 'referral_pending' || s.status === 'being_evaluated').length,
    active: specEdStudents.filter(s => s.status === 'receiving_services' || s.status === 'has_plan').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">חינוך מיוחד</h1>
          <p className="text-slate-500">ניהול חינוך מיוחד - תלמידים, סטעף, בדיקות, און פלענער</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 ml-2" /> רענו
          </Button>
          <Button onClick={() => {
            setSelectedSpecEd(null);
            setStudentForm({ student_id: '', status: 'monitoring', referral_reason: '', help_type: '', help_description: '', current_plan: '', referral_date: new Date().toISOString().split('T')[0] });
            setIsStudentModalOpen(true);
          }} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 ml-2" /> צולייגן תלמיד
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg"><Users className="h-6 w-6 text-orange-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-slate-500">סה״כ תלמידים</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg"><AlertCircle className="h-6 w-6 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold">{stats.monitoring}</p><p className="text-sm text-slate-500">מאניטארינג</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.pendingEval}</p><p className="text-sm text-slate-500">ווארט/ווערט בודק</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-slate-500">באקומט הילף</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">תלמידים ({specEdStudents.length})</TabsTrigger>
          <TabsTrigger value="staff">סטעף ({specEdStaff.length})</TabsTrigger>
          <TabsTrigger value="overview">איבערבליק</TabsTrigger>
        </TabsList>

        {/* ===== STUDENTS TAB ===== */}
        <TabsContent value="students" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="זוך תלמיד..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="סטאטוס" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">אלע סטאטוסן</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            {filteredStudents.map(specEd => (
              <Card key={specEd.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header Row */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleStudentDetail(specEd.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                        {specEd.student?.hebrew_name?.charAt(0) || specEd.student?.first_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {specEd.student?.hebrew_name || `${specEd.student?.first_name} ${specEd.student?.last_name}`}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {specEd.student?.class?.name || 'אהן קלאס'} | {specEd.help_type ? HELP_TYPES.find(h => h.value === specEd.help_type)?.label : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(specEd.status)}
                      {specEd.referral_date && (
                        <span className="text-xs text-slate-400">
                          {new Date(specEd.referral_date).toLocaleDateString('he-IL')}
                        </span>
                      )}
                      {expandedStudentId === specEd.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Referral Reason */}
                  {specEd.referral_reason && (
                    <div className="px-4 pb-2">
                      <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        <strong>סיבה/זארג:</strong> {specEd.referral_reason}
                      </p>
                    </div>
                  )}

                  {/* Expanded Detail */}
                  {expandedStudentId === specEd.id && (
                    <div className="border-t p-4 space-y-4 bg-slate-50">
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setStudentForm({
                            student_id: specEd.student_id,
                            status: specEd.status,
                            referral_reason: specEd.referral_reason || '',
                            help_type: specEd.help_type || '',
                            help_description: specEd.help_description || '',
                            current_plan: specEd.current_plan || '',
                            referral_date: specEd.referral_date || ''
                          });
                          setIsStudentModalOpen(true);
                        }}>
                          <Edit className="h-4 w-4 ml-1" /> עדיט סטאטוס
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setInfoForm({ source_type: 'teacher', source_name: '', content: '', date_gathered: new Date().toISOString().split('T')[0] });
                          setIsInfoModalOpen(true);
                        }}>
                          <FileText className="h-4 w-4 ml-1" /> צולייגן אינפארמאציע
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setEvalForm({ evaluation_type: 'psychoeducational', evaluator_name: '', evaluation_date: new Date().toISOString().split('T')[0], results: '', recommendations: '', plan: '', actual_actions: '' });
                          setIsEvalModalOpen(true);
                        }}>
                          <ClipboardList className="h-4 w-4 ml-1" /> צולייגן בדיקה
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setTutoringForm({ tutor_name: '', tutor_phone: '', tutor_type: 'private_teacher', subject: '', schedule_days: '', schedule_time: '', location: '', frequency: 'weekly', session_duration_minutes: 45, notes: '', start_date: new Date().toISOString().split('T')[0] });
                          setIsTutoringModalOpen(true);
                        }}>
                          <BookOpen className="h-4 w-4 ml-1" /> צולייגן מלמד פרטי
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setSessionForm({ special_ed_staff_id: '', tutor_name: '', session_date: new Date().toISOString().split('T')[0], session_time: '', duration_minutes: 30, subject: '', content: '', progress_notes: '', goals_worked_on: '' });
                          setIsSessionLogModalOpen(true);
                        }}>
                          <Calendar className="h-4 w-4 ml-1" /> לאג סעסיע
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          openSendEmail(
                            `חינוך מיוחד אפדעיט - ${specEd.student?.hebrew_name || specEd.student?.first_name}`,
                            `עס איז דא א נייע אפדעיט וועגן ${specEd.student?.hebrew_name || specEd.student?.first_name} ${specEd.student?.last_name}\n\nסטאטוס: ${STATUS_OPTIONS.find(s => s.value === specEd.status)?.label}\n${specEd.referral_reason ? `סיבה: ${specEd.referral_reason}` : ''}`
                          );
                        }}>
                          <Mail className="h-4 w-4 ml-1" /> שיק אימעיל
                        </Button>
                      </div>

                      {/* Current Plan */}
                      {specEd.current_plan && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-1">פלאן:</h4>
                          <p className="text-sm text-purple-700">{specEd.current_plan}</p>
                        </div>
                      )}

                      {/* Help Description */}
                      {specEd.help_description && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-1">הילף באשרייבונג:</h4>
                          <p className="text-sm text-green-700">{specEd.help_description}</p>
                        </div>
                      )}

                      {/* Info Sources */}
                      {detailData.infoSources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">אינפארמאציע צוזאמגענומען ({detailData.infoSources.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {detailData.infoSources.map(info => (
                              <div key={info.id} className="p-3 bg-white rounded border text-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <Badge variant="outline">{SOURCE_TYPES.find(s => s.value === info.source_type)?.label || info.source_type}</Badge>
                                  <span className="text-xs text-slate-400">{new Date(info.date_gathered).toLocaleDateString('he-IL')}</span>
                                </div>
                                {info.source_name && <p className="text-xs text-slate-500 mb-1">פון: {info.source_name}</p>}
                                <p className="text-slate-700">{info.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluations */}
                      {detailData.evaluations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">בדיקות ({detailData.evaluations.length})</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {detailData.evaluations.map(ev => (
                              <div key={ev.id} className="p-3 bg-white rounded border text-sm space-y-1">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">{EVAL_TYPES.find(e => e.value === ev.evaluation_type)?.label || ev.evaluation_type}</Badge>
                                  <span className="text-xs text-slate-400">{ev.evaluation_date && new Date(ev.evaluation_date).toLocaleDateString('he-IL')}</span>
                                </div>
                                {ev.evaluator_name && <p className="text-xs text-slate-500">בודק: {ev.evaluator_name}</p>}
                                {ev.results && <div className="bg-blue-50 p-2 rounded"><strong>תוצאה:</strong> {ev.results}</div>}
                                {ev.recommendations && <div className="bg-yellow-50 p-2 rounded"><strong>הצעה:</strong> {ev.recommendations}</div>}
                                {ev.plan && <div className="bg-green-50 p-2 rounded"><strong>פלאן:</strong> {ev.plan}</div>}
                                {ev.actual_actions && <div className="bg-purple-50 p-2 rounded"><strong>פאקטישע אקציע:</strong> {ev.actual_actions}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tutoring */}
                      {detailData.tutoring.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">מלמדים פרטיים ({detailData.tutoring.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {detailData.tutoring.map(t => (
                              <div key={t.id} className="p-3 bg-white rounded border text-sm">
                                <p className="font-bold">{t.tutor_name}</p>
                                {t.tutor_phone && <p className="text-slate-500">{t.tutor_phone}</p>}
                                <p className="text-orange-600">{t.subject || 'N/A'} | {t.schedule_days} {t.schedule_time}</p>
                                <p className="text-xs text-slate-400">{t.frequency} | {t.session_duration_minutes} מינוט</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Session Logs */}
                      {detailData.sessionLogs.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">סעסיע לאגס ({detailData.sessionLogs.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {detailData.sessionLogs.map(sess => (
                              <div key={sess.id} className="p-3 bg-white rounded border text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{sess.staff?.name || sess.tutor_name || 'N/A'} - {sess.subject || ''}</span>
                                  <span className="text-xs text-slate-400">{new Date(sess.session_date).toLocaleDateString('he-IL')}</span>
                                </div>
                                <p className="text-slate-600 mt-1">{sess.content}</p>
                                {sess.progress_notes && <p className="text-green-600 text-xs mt-1">פראגרעס: {sess.progress_notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>קיין תלמידים נישט געפונען</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== STAFF TAB ===== */}
        <TabsContent value="staff" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">סטעף פון חינוך מיוחד</h3>
            <Button onClick={() => {
              setSelectedStaff(null);
              setStaffForm({ name: '', hebrew_name: '', role: 'resource_teacher', phone: '', email: '', specialization: '', certification: '', notes: '' });
              setIsStaffModalOpen(true);
            }}>
              <Plus className="h-4 w-4 ml-2" /> צולייגן סטעף
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specEdStaff.map(staff => (
              <Card key={staff.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{staff.hebrew_name || staff.name}</h4>
                      <Badge variant="outline">{STAFF_ROLES.find(r => r.value === staff.role)?.label || staff.role}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedStaff(staff);
                        setStaffForm({
                          name: staff.name || '', hebrew_name: staff.hebrew_name || '', role: staff.role || 'other',
                          phone: staff.phone || '', email: staff.email || '', specialization: staff.specialization || '',
                          certification: staff.certification || '', notes: staff.notes || ''
                        });
                        setIsStaffModalOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {staff.phone && <p className="text-sm text-slate-500 mt-2">{staff.phone}</p>}
                  {staff.email && <p className="text-sm text-slate-500">{staff.email}</p>}
                  {staff.specialization && <p className="text-sm text-orange-600 mt-1">{staff.specialization}</p>}
                  
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => {
                      setSelectedStaff(staff);
                      await loadStaffSchedules(staff.id);
                      setIsScheduleModalOpen(true);
                    }}>
                      <Clock className="h-3 w-3 ml-1" /> צייטן
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {specEdStaff.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>קיין סטעף נישט צוגעלייגט</p>
            </div>
          )}
        </TabsContent>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Status */}
            <Card>
              <CardHeader><CardTitle>תלמידים לויט סטאטוס</CardTitle></CardHeader>
              <CardContent>
                {STATUS_OPTIONS.map(s => {
                  const count = specEdStudents.filter(se => se.status === s.value).length;
                  return count > 0 ? (
                    <div key={s.value} className="flex justify-between items-center py-2 border-b last:border-0">
                      <Badge className={s.color}>{s.label}</Badge>
                      <span className="font-bold">{count}</span>
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>

            {/* By Help Type */}
            <Card>
              <CardHeader><CardTitle>תלמידים לויט הילף טיפ</CardTitle></CardHeader>
              <CardContent>
                {HELP_TYPES.map(h => {
                  const count = specEdStudents.filter(se => se.help_type === h.value).length;
                  return count > 0 ? (
                    <div key={h.value} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span>{h.label}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>

            {/* Staff Schedule Overview */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>סטעף איבערבליק</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>נאמען</TableHead>
                      <TableHead>ראלע</TableHead>
                      <TableHead>טעלעפאן</TableHead>
                      <TableHead>ספעציאליזאציע</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specEdStaff.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.hebrew_name || s.name}</TableCell>
                        <TableCell>{STAFF_ROLES.find(r => r.value === s.role)?.label || s.role}</TableCell>
                        <TableCell>{s.phone}</TableCell>
                        <TableCell>{s.specialization}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== MODALS ===== */}

      {/* Student Modal */}
      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedSpecEd ? 'עדיט תלמיד' : 'צולייגן תלמיד צו חינוך מיוחד'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>תלמיד *</Label>
              <Select value={studentForm.student_id} onValueChange={(v) => setStudentForm({ ...studentForm, student_id: v })} disabled={!!selectedSpecEd}>
                <SelectTrigger><SelectValue placeholder="וועל אויס תלמיד..." /></SelectTrigger>
                <SelectContent>
                  {allStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.hebrew_name || `${s.first_name} ${s.last_name}`} ({s.class?.name || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סטאטוס</Label>
              <Select value={studentForm.status} onValueChange={(v) => setStudentForm({ ...studentForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סיבה / זארג (וואס מ'דארף בודק זיין)</Label>
              <Textarea value={studentForm.referral_reason} onChange={(e) => setStudentForm({ ...studentForm, referral_reason: e.target.value })} placeholder="פארוואס דארף מען בודק זיין דעם קינד?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>הילף טיפ</Label>
                <Select value={studentForm.help_type || 'none'} onValueChange={(v) => setStudentForm({ ...studentForm, help_type: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="וועל אויס..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">קיינס</SelectItem>
                    {HELP_TYPES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>דאטום</Label>
                <Input type="date" value={studentForm.referral_date} onChange={(e) => setStudentForm({ ...studentForm, referral_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>באשרייבונג פון הילף</Label>
              <Textarea value={studentForm.help_description} onChange={(e) => setStudentForm({ ...studentForm, help_description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>פלאן</Label>
              <Textarea value={studentForm.current_plan} onChange={(e) => setStudentForm({ ...studentForm, current_plan: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveStudent} className="bg-orange-600 hover:bg-orange-700">{selectedSpecEd ? 'אפדעיט' : 'צולייגן'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Source Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>צולייגן אינפארמאציע</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מקור</Label>
                <Select value={infoForm.source_type} onValueChange={(v) => setInfoForm({ ...infoForm, source_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>נאמען (אפציאנאל)</Label>
                <Input value={infoForm.source_name} onChange={(e) => setInfoForm({ ...infoForm, source_name: e.target.value })} placeholder="נאמען פון מקור" />
              </div>
            </div>
            <div>
              <Label>דאטום</Label>
              <Input type="date" value={infoForm.date_gathered} onChange={(e) => setInfoForm({ ...infoForm, date_gathered: e.target.value })} />
            </div>
            <div>
              <Label>אינפארמאציע *</Label>
              <Textarea value={infoForm.content} onChange={(e) => setInfoForm({ ...infoForm, content: e.target.value })} rows={4} placeholder="וואס האט מען געזאגט / געפונען..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInfoModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveInfoSource}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Modal */}
      <Dialog open={isEvalModalOpen} onOpenChange={setIsEvalModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>צולייגן בדיקה תוצאות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>טיפ בדיקה</Label>
                <Select value={evalForm.evaluation_type} onValueChange={(v) => setEvalForm({ ...evalForm, evaluation_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVAL_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>בודק נאמען</Label>
                <Input value={evalForm.evaluator_name} onChange={(e) => setEvalForm({ ...evalForm, evaluator_name: e.target.value })} />
              </div>
              <div>
                <Label>דאטום</Label>
                <Input type="date" value={evalForm.evaluation_date} onChange={(e) => setEvalForm({ ...evalForm, evaluation_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>תוצאה (רעזולטס)</Label>
              <Textarea value={evalForm.results} onChange={(e) => setEvalForm({ ...evalForm, results: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>הצעה (רעקאמענדעישאן)</Label>
              <Textarea value={evalForm.recommendations} onChange={(e) => setEvalForm({ ...evalForm, recommendations: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>פלאן</Label>
              <Textarea value={evalForm.plan} onChange={(e) => setEvalForm({ ...evalForm, plan: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>וואס מ'גייט פאקטיש טון</Label>
              <Textarea value={evalForm.actual_actions} onChange={(e) => setEvalForm({ ...evalForm, actual_actions: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEvalModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveEvaluation} className="bg-blue-600 hover:bg-blue-700">שמור בדיקה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutoring Modal */}
      <Dialog open={isTutoringModalOpen} onOpenChange={setIsTutoringModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>צולייגן מלמד פרטי / טעראפיסט</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>נאמען *</Label>
                <Input value={tutoringForm.tutor_name} onChange={(e) => setTutoringForm({ ...tutoringForm, tutor_name: e.target.value })} />
              </div>
              <div>
                <Label>טעלעפאן</Label>
                <Input value={tutoringForm.tutor_phone} onChange={(e) => setTutoringForm({ ...tutoringForm, tutor_phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טיפ</Label>
                <Select value={tutoringForm.tutor_type} onValueChange={(v) => setTutoringForm({ ...tutoringForm, tutor_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_teacher">פריוואטע מלמד</SelectItem>
                    <SelectItem value="speech">שפראך</SelectItem>
                    <SelectItem value="OT">OT</SelectItem>
                    <SelectItem value="reading_specialist">לייענען ספעציאליסט</SelectItem>
                    <SelectItem value="the">THE</SelectItem>
                    <SelectItem value="other">אנדערע</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>וואס לערנט מען</Label>
                <Input value={tutoringForm.subject} onChange={(e) => setTutoringForm({ ...tutoringForm, subject: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טעג</Label>
                <Input value={tutoringForm.schedule_days} onChange={(e) => setTutoringForm({ ...tutoringForm, schedule_days: e.target.value })} placeholder="מאנטיג, מיטוואך" />
              </div>
              <div>
                <Label>צייט</Label>
                <Input value={tutoringForm.schedule_time} onChange={(e) => setTutoringForm({ ...tutoringForm, schedule_time: e.target.value })} placeholder="2:00-3:00" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>פלאץ</Label>
                <Input value={tutoringForm.location} onChange={(e) => setTutoringForm({ ...tutoringForm, location: e.target.value })} />
              </div>
              <div>
                <Label>ווי אפט</Label>
                <Select value={tutoringForm.frequency} onValueChange={(v) => setTutoringForm({ ...tutoringForm, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">טעגליך</SelectItem>
                    <SelectItem value="weekly">וועכנטליך</SelectItem>
                    <SelectItem value="bi-weekly">אלע 2 וואכן</SelectItem>
                    <SelectItem value="monthly">חודשליך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>מינוטן</Label>
                <Input type="number" value={tutoringForm.session_duration_minutes} onChange={(e) => setTutoringForm({ ...tutoringForm, session_duration_minutes: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>נאטיצן</Label>
              <Textarea value={tutoringForm.notes} onChange={(e) => setTutoringForm({ ...tutoringForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTutoringModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveTutoring}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Modal */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'עדיט סטעף' : 'צולייגן סטעף מעמבער'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>נאמען *</Label>
                <Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
              </div>
              <div>
                <Label>אידישער נאמען</Label>
                <Input value={staffForm.hebrew_name} onChange={(e) => setStaffForm({ ...staffForm, hebrew_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ראלע</Label>
                <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ספעציאליזאציע</Label>
                <Input value={staffForm.specialization} onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טעלעפאן</Label>
                <Input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>אימעיל</Label>
                <Input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>סערטיפיקאט</Label>
              <Input value={staffForm.certification} onChange={(e) => setStaffForm({ ...staffForm, certification: e.target.value })} />
            </div>
            <div>
              <Label>נאטיצן</Label>
              <Textarea value={staffForm.notes} onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveStaff} className="bg-orange-600 hover:bg-orange-700">{selectedStaff ? 'אפדעיט' : 'צולייגן'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>צייטן פון {selectedStaff?.hebrew_name || selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing Schedule */}
            {staffSchedules.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">אקטועלע צייטן:</h4>
                {staffSchedules.map(sch => (
                  <div key={sch.id} className="p-2 bg-slate-50 rounded border text-sm flex justify-between items-center">
                    <span>{DAYS[sch.day_of_week]}: {sch.start_time} - {sch.end_time}</span>
                    <Badge variant={sch.status === 'available' || sch.status === 'in_school' ? 'default' : 'destructive'}>
                      {sch.status === 'available' ? 'אוועילעבל' : sch.status === 'busy' ? 'פארנומען' : sch.status === 'in_school' ? 'אין חדר' : 'נישט דא'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">צולייגן נייע צייט:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>טאג</Label>
                  <Select value={String(scheduleForm.day_of_week)} onValueChange={(v) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>סטאטוס</Label>
                  <Select value={scheduleForm.status} onValueChange={(v) => setScheduleForm({ ...scheduleForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_school">אין חדר</SelectItem>
                      <SelectItem value="available">אוועילעבל</SelectItem>
                      <SelectItem value="busy">פארנומען</SelectItem>
                      <SelectItem value="unavailable">נישט דא</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label>פון</Label>
                  <Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>ביז</Label>
                  <Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                </div>
              </div>
              <div className="mt-2">
                <Label>פלאץ</Label>
                <Input value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="רום נומער" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>פארמאך</Button>
            <Button onClick={handleSaveSchedule}>צולייגן צייט</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Log Modal */}
      <Dialog open={isSessionLogModalOpen} onOpenChange={setIsSessionLogModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>לאג סעסיע</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>סטעף מעמבער</Label>
                <Select value={sessionForm.special_ed_staff_id || 'none'} onValueChange={(v) => setSessionForm({ ...sessionForm, special_ed_staff_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="וועל אויס..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">אנדערע / אויסערליך</SelectItem>
                    {specEdStaff.map(s => <SelectItem key={s.id} value={s.id}>{s.hebrew_name || s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>אדער: אויסערליכע נאמען</Label>
                <Input value={sessionForm.tutor_name} onChange={(e) => setSessionForm({ ...sessionForm, tutor_name: e.target.value })} placeholder="נאמען" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>דאטום</Label>
                <Input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
              </div>
              <div>
                <Label>צייט</Label>
                <Input type="time" value={sessionForm.session_time} onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })} />
              </div>
              <div>
                <Label>מינוטן</Label>
                <Input type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>סאביעקט/נושא</Label>
              <Input value={sessionForm.subject} onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })} />
            </div>
            <div>
              <Label>אינהאלט *</Label>
              <Textarea value={sessionForm.content} onChange={(e) => setSessionForm({ ...sessionForm, content: e.target.value })} rows={3} placeholder="וואס האט מען געטון..." />
            </div>
            <div>
              <Label>פראגרעס נאטיצן</Label>
              <Textarea value={sessionForm.progress_notes} onChange={(e) => setSessionForm({ ...sessionForm, progress_notes: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>גאולס וואס מ'האט געארבעט</Label>
              <Input value={sessionForm.goals_worked_on} onChange={(e) => setSessionForm({ ...sessionForm, goals_worked_on: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionLogModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveSessionLog}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={emailContext.subject}
        defaultBody={emailContext.body}
        currentUser={currentUser}
      />
    </div>
  );
};

export default SpecialEducationView;
