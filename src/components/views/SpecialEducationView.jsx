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
import StudentPicker from '@/components/ui/student-picker';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import { useStudentNotify } from '@/hooks/useStudentNotify';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportButton from '@/components/ExportButton';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import {
  Plus, Search, Edit, Trash2, User, Users, Calendar, Clock,
  FileText, ClipboardList, BookOpen, UserCheck, AlertCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, Mail, RefreshCw, Loader2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'monitoring', label: 'Monitoring', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'needs_evaluation', label: 'Needs Evaluation', color: 'bg-red-100 text-red-800' },
  { value: 'referral_pending', label: 'Referral Pending', color: 'bg-orange-100 text-orange-800' },
  { value: 'being_evaluated', label: 'Being Evaluated', color: 'bg-blue-100 text-blue-800' },
  { value: 'has_plan', label: 'Has Plan', color: 'bg-purple-100 text-purple-800' },
  { value: 'receiving_services', label: 'Receiving Services', color: 'bg-green-100 text-green-800' },
  { value: 'out_of_school_services', label: 'Out of School Services', color: 'bg-teal-100 text-teal-800' },
  { value: 'discharged', label: 'Discharged', color: 'bg-gray-100 text-gray-800' },
];

const HELP_TYPES = [
  { value: 'speech', label: 'Speech Therapy' },
  { value: 'OT', label: 'OT - Occupational Therapy' },
  { value: 'PT', label: 'PT - Physical Therapy' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'academic', label: 'Academic Support' },
  { value: 'social_skills', label: 'Social Skills' },
  { value: 'reading', label: 'Reading' },
  { value: 'other', label: 'Other' },
];

const SOURCE_TYPES = [
  { value: 'principal', label: 'Principal' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'private_tutor', label: 'Private Tutor' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'other', label: 'Other' },
];

const EVAL_TYPES = [
  { value: 'psychoeducational', label: 'Psychoeducational' },
  { value: 'speech', label: 'Speech' },
  { value: 'OT', label: 'OT' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'academic', label: 'Academic' },
  { value: 'other', label: 'Other' },
];

const STAFF_ROLES = [
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'psychologist', label: 'Psychologist' },
  { value: 'speech_therapist', label: 'Speech Therapist' },
  { value: 'OT', label: 'OT Therapist' },
  { value: 'PT', label: 'PT Therapist' },
  { value: 'resource_teacher', label: 'Resource Teacher' },
  { value: 'aide', label: 'Aide' },
  { value: 'other', label: 'Other' },
];

const EVAL_REQUEST_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
];

const EVAL_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { value: 'normal', label: 'Normal', color: 'bg-sky-100 text-sky-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos'];

const SPECED_STUDENT = (s) => s.student ? (s.student.hebrew_name || `${s.student.first_name || ''} ${s.student.last_name || ''}`.trim()) : '';
const SPECED_LABEL = (arr, v) => (arr.find((o) => o.value === v)?.label) || v || '';
const SPECED_EXPORT_COLUMNS = [
  { key: 'student', label: 'Student', accessor: SPECED_STUDENT },
  { key: 'hebrew_name', label: 'Hebrew Name', accessor: (s) => s.student?.hebrew_name, default: false },
  { key: 'class', label: 'Class', accessor: (s) => s.student?.class?.name },
  { key: 'grade', label: 'Grade', accessor: (s) => s.student?.class?.grade?.name, default: false },
  { key: 'status', label: 'Status', accessor: (s) => SPECED_LABEL(STATUS_OPTIONS, s.status) },
  { key: 'help_type', label: 'Help Type', accessor: (s) => SPECED_LABEL(HELP_TYPES, s.help_type) },
  { key: 'referral_reason', label: 'Referral Reason', accessor: (s) => s.referral_reason },
  { key: 'help_description', label: 'Help Description', accessor: (s) => s.help_description, default: false },
  { key: 'current_plan', label: 'Current Plan', accessor: (s) => s.current_plan, default: false },
  { key: 'referral_date', label: 'Referral Date', accessor: (s) => (s.referral_date ? new Date(s.referral_date).toLocaleDateString('en-US') : ''), default: false },
];
const SPECED_SORT_OPTIONS = [
  { key: 'student', label: 'Student', accessor: SPECED_STUDENT },
  { key: 'status', label: 'Status', accessor: (s) => s.status },
  { key: 'help_type', label: 'Help Type', accessor: (s) => s.help_type },
];
const SPECED_GROUP_OPTIONS = [
  { key: 'status', label: 'Status', accessor: (s) => SPECED_LABEL(STATUS_OPTIONS, s.status) || 'Unknown' },
  { key: 'help_type', label: 'Help Type', accessor: (s) => SPECED_LABEL(HELP_TYPES, s.help_type) || 'None' },
  { key: 'class', label: 'Class', accessor: (s) => s.student?.class?.name || 'No Class' },
];

const SpecialEducationView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const { open: openProfile } = useStudentProfile();
  const { t } = useLanguage();
  const { notify, notifyElement } = useStudentNotify(currentUser);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [specEdStudents, setSpecEdStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [specEdStaff, setSpecEdStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [evalRequests, setEvalRequests] = useState([]);
  const [evalRequestSearch, setEvalRequestSearch] = useState('');
  const [evalRequestStatusFilter, setEvalRequestStatusFilter] = useState('open');
  
  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [staffStudentsMap, setStaffStudentsMap] = useState({}); // { [staffId]: [ { tutoring, student } ] }
  
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
  const [selectedEvalRequest, setSelectedEvalRequest] = useState(null);

  // "Needs evaluation" flag shown in the Add-to-Special-Ed modal
  const [needsEval, setNeedsEval] = useState(false);
  const [evalReqPriority, setEvalReqPriority] = useState('normal');
  
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
    special_ed_staff_id: '', tutor_name: '', tutor_phone: '', tutor_type: 'private_teacher',
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
    infoSources: [], evaluations: [], tutoring: [], sessionLogs: [], assessments: []
  });

  // Monthly reports
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportStudent, setReportStudent] = useState(null);
  const [reportSearch, setReportSearch] = useState('');
  const [reportForm, setReportForm] = useState({
    what_was_done: '', progress: '', challenges: '', goals_next_month: '', recommendations: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') loadMonthlyReports(reportMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportMonth]);

  const loadMonthlyReports = async (monthStr) => {
    setMonthlyLoading(true);
    try {
      const firstDay = `${monthStr}-01`;
      const { data, error } = await supabase
        .from('special_ed_monthly_reports')
        .select('*')
        .eq('report_month', firstDay);
      if (error) throw error;
      setMonthlyReports(data || []);
    } catch (e) {
      console.error('Error loading monthly reports:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load monthly reports' });
    } finally {
      setMonthlyLoading(false);
    }
  };

  const openMonthlyReport = (specEd) => {
    const existing = monthlyReports.find(r => r.special_ed_student_id === specEd.id);
    setReportStudent(specEd);
    setSelectedReport(existing || null);
    setReportForm({
      what_was_done: existing?.what_was_done || '',
      progress: existing?.progress || '',
      challenges: existing?.challenges || '',
      goals_next_month: existing?.goals_next_month || '',
      recommendations: existing?.recommendations || ''
    });
    setIsMonthlyReportModalOpen(true);
  };

  const handleSaveMonthlyReport = async () => {
    if (!reportStudent) return;
    try {
      const firstDay = `${reportMonth}-01`;
      const payload = {
        special_ed_student_id: reportStudent.id,
        report_month: firstDay,
        ...reportForm,
        updated_at: new Date().toISOString()
      };
      let error;
      if (selectedReport) {
        ({ error } = await supabase.from('special_ed_monthly_reports').update(payload).eq('id', selectedReport.id));
      } else {
        ({ error } = await supabase
          .from('special_ed_monthly_reports')
          .upsert([{ ...payload, created_by: currentUser?.id, created_by_name: currentUser?.name || currentUser?.first_name }],
            { onConflict: 'special_ed_student_id,report_month' }));
      }
      if (error) throw error;
      toast({ title: 'Saved', description: 'Monthly report saved' });
      setIsMonthlyReportModalOpen(false);
      loadMonthlyReports(reportMonth);
      const rs = reportStudent.student || reportStudent;
      const rsName = `${rs.first_name || ''} ${rs.last_name || ''}`.trim() || rs.hebrew_name || '';
      notify({
        studentId: rs.id || reportStudent.student_id || null,
        studentName: rsName,
        action: selectedReport ? 'updated' : 'created',
        recordType: 'Monthly special-ed report',
        title: `${monthLabel} report`,
        details:
          (reportForm.progress ? `Progress: ${reportForm.progress}\n` : '') +
          (reportForm.challenges ? `Challenges: ${reportForm.challenges}\n` : '') +
          (reportForm.goals_next_month ? `Goals: ${reportForm.goals_next_month}` : ''),
        relatedType: 'special_ed_monthly_report',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteMonthlyReport = async (id) => {
    if (!id || !window.confirm('Delete this monthly report? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('special_ed_monthly_reports').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Monthly report deleted' });
      loadMonthlyReports(reportMonth);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const shiftReportMonth = (delta) => {
    const [y, m] = reportMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = reportMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();


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
      let studentsData = null;
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class_id, class:classes!class_id(name)')
        .eq('status', 'active')
        .order('last_name');
      
      if (sError) {
        console.error('Error loading students with class join, trying without:', sError);
        // Fallback: load without class join
        const { data: fallbackData } = await supabase
          .from('students')
          .select('id, first_name, last_name, hebrew_name, class_id')
          .eq('status', 'active')
          .order('last_name');
        studentsData = fallbackData;
      } else {
        studentsData = sData;
      }
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

      // Load evaluation requests (the "needs evaluation" pending queue)
      await loadEvalRequests();

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Load the "needs evaluation" queue (pending evaluation requests)
  const loadEvalRequests = async () => {
    const { data, error } = await supabase
      .from('special_ed_evaluation_requests')
      .select(`
        *,
        student:students(id, first_name, last_name, hebrew_name,
          class:classes!class_id(name)
        ),
        assigned_staff:special_ed_staff!assigned_staff_id(id, name, hebrew_name, email, role)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading evaluation requests:', error);
      return;
    }
    setEvalRequests(data || []);
  };

  // Create a pending evaluation request for a student
  const createEvalRequest = async ({ studentId, specEdStudentId = null, reason = '', priority = 'normal', evaluationType = null }) => {
    const { error } = await supabase.from('special_ed_evaluation_requests').insert([{
      student_id: studentId,
      special_ed_student_id: specEdStudentId,
      reason: reason || null,
      evaluation_type: evaluationType,
      priority: priority || 'normal',
      status: 'pending',
      requested_by: currentUser?.id || null,
      requested_by_name: currentUser?.name || currentUser?.first_name || null
    }]);
    if (error) throw error;
  };

  // Assign an evaluation request to a special-ed staff member (and offer to email them)
  const handleAssignEvalRequest = async (req, staffId) => {
    try {
      const { error } = await supabase
        .from('special_ed_evaluation_requests')
        .update({
          assigned_staff_id: staffId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', req.id);
      if (error) throw error;

      const staff = specEdStaff.find(s => s.id === staffId);
      toast({ title: 'Assigned', description: `Evaluation assigned to ${staff?.name || 'staff member'}` });
      await loadEvalRequests();

      // Offer to email the assigned staff member
      const studentName = req.student?.hebrew_name || `${req.student?.first_name || ''} ${req.student?.last_name || ''}`.trim();
      setEmailContext({
        subject: `Evaluation Request - ${studentName}`,
        body: `You have been assigned to evaluate ${studentName}${req.student?.class?.name ? ` (${req.student.class.name})` : ''}.\n\n${req.reason ? `Reason: ${req.reason}\n` : ''}${req.priority ? `Priority: ${EVAL_PRIORITIES.find(p => p.value === req.priority)?.label || req.priority}\n` : ''}\nPlease follow up and record the evaluation results in the Special Education system.`,
        to: staff?.email || ''
      });
      setIsEmailModalOpen(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Change the status of an evaluation request
  const handleUpdateEvalRequestStatus = async (reqId, status) => {
    try {
      const patch = { status, updated_at: new Date().toISOString() };
      if (status === 'completed') patch.completed_at = new Date().toISOString();
      const { error } = await supabase.from('special_ed_evaluation_requests').update(patch).eq('id', reqId);
      if (error) throw error;
      toast({ title: 'Updated', description: 'Evaluation request updated' });
      await loadEvalRequests();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Delete (soft) an evaluation request
  const handleDeleteEvalRequest = async (reqId) => {
    if (!window.confirm('Remove this evaluation request?')) return;
    try {
      const { error } = await supabase
        .from('special_ed_evaluation_requests')
        .update({ is_active: false })
        .eq('id', reqId);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Evaluation request removed' });
      await loadEvalRequests();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  // Load detail data for expanded student
  const loadStudentDetail = async (specEdId) => {
    try {
      const specEd = specEdStudents.find(s => s.id === specEdId);
      const studentId = specEd?.student_id || specEd?.student?.id || null;
      const [infoRes, evalRes, tutorRes, sessRes, asmtRes] = await Promise.all([
        supabase.from('special_ed_info_sources').select('*').eq('special_ed_student_id', specEdId).order('date_gathered', { ascending: false }),
        supabase.from('special_ed_evaluations').select('*').eq('special_ed_student_id', specEdId).order('evaluation_date', { ascending: false }),
        supabase.from('special_ed_tutoring').select('*').eq('special_ed_student_id', specEdId).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('special_ed_session_logs').select('*, staff:special_ed_staff(name)').eq('special_ed_student_id', specEdId).order('session_date', { ascending: false }).limit(20),
        studentId
          ? supabase.from('assessments').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      setDetailData({
        infoSources: infoRes.data || [],
        evaluations: evalRes.data || [],
        tutoring: tutorRes.data || [],
        sessionLogs: sessRes.data || [],
        assessments: asmtRes.data || []
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

  // Load students assigned to a staff member (via tutoring).
  // Matches either the explicit link (special_ed_staff_id) OR a tutor_name
  // that equals the staff member's name / hebrew_name, so existing rows that
  // pre-date the link column still show up.
  const loadStaffStudents = async (staffId) => {
    const staff = specEdStaff.find(s => s.id === staffId);
    const norm = (v) => (v || '').toString().trim().toLowerCase();
    const staffNames = [norm(staff?.name), norm(staff?.hebrew_name)].filter(Boolean);

    const { data: tutoring, error } = await supabase
      .from('special_ed_tutoring')
      .select('*')
      .eq('is_active', true);
    if (error) {
      console.error('Error loading staff students:', error);
      setStaffStudentsMap(prev => ({ ...prev, [staffId]: [] }));
      return;
    }

    const matched = (tutoring || []).filter(t =>
      t.special_ed_staff_id === staffId ||
      (staffNames.length > 0 && staffNames.includes(norm(t.tutor_name)))
    );
    const rows = matched.map(t => {
      const specEd = specEdStudents.find(se => se.id === t.special_ed_student_id);
      return { tutoring: t, specEd, student: specEd?.student || null };
    });
    setStaffStudentsMap(prev => ({ ...prev, [staffId]: rows }));
  };

  const toggleStaffDetail = async (staffId) => {
    if (expandedStaffId === staffId) {
      setExpandedStaffId(null);
    } else {
      setExpandedStaffId(staffId);
      if (!staffStudentsMap[staffId]) await loadStaffStudents(staffId);
    }
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
        const { data: inserted, error } = await supabase
          .from('special_ed_students')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        toast({ title: 'Added', description: 'Student added to special education' });

        // If flagged, drop a pending evaluation request into the Evaluations queue
        if (needsEval) {
          try {
            await createEvalRequest({
              studentId: studentForm.student_id,
              specEdStudentId: inserted?.id || null,
              reason: studentForm.referral_reason,
              priority: evalReqPriority,
              evaluationType: studentForm.help_type || null
            });
            toast({ title: 'Evaluation Requested', description: 'Added to the pending evaluation queue' });
          } catch (reqErr) {
            console.error('Error creating evaluation request:', reqErr);
            toast({ variant: 'destructive', title: 'Evaluation request failed', description: reqErr.message });
          }
        }
      }
      setNeedsEval(false);
      setEvalReqPriority('normal');
      setIsStudentModalOpen(false);
      loadData();
      const sName = (() => {
        const s = allStudents.find(x => x.id === studentForm.student_id);
        return s ? (`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.hebrew_name || '') : '';
      })();
      notify({
        studentId: studentForm.student_id,
        studentName: sName,
        action: selectedSpecEd ? 'updated' : 'created',
        recordType: 'Special education record',
        title: studentForm.help_type || 'Special education',
        details:
          (studentForm.referral_reason ? `Referral: ${studentForm.referral_reason}\n` : '') +
          (studentForm.help_description ? `Help: ${studentForm.help_description}\n` : '') +
          (studentForm.current_plan ? `Plan: ${studentForm.current_plan}` : ''),
        relatedType: 'special_ed_student',
        relatedId: selectedSpecEd?.id,
      });
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
      const { special_ed_staff_id, ...rest } = tutoringForm;
      // If a staff member was picked, make sure tutor_name matches their name so
      // the Staff tab links the student even if the link column isn't present yet.
      const staff = special_ed_staff_id ? specEdStaff.find(s => s.id === special_ed_staff_id) : null;
      const baseRow = {
        special_ed_student_id: selectedSpecEd.id,
        ...rest,
        tutor_name: rest.tutor_name || staff?.name || staff?.hebrew_name || ''
      };
      let { error } = await supabase.from('special_ed_tutoring').insert([{
        ...baseRow,
        special_ed_staff_id: special_ed_staff_id || null
      }]);
      // Fallback if the link column hasn't been added to the DB yet (migration 033).
      if (error && /special_ed_staff_id/.test(error.message || '')) {
        ({ error } = await supabase.from('special_ed_tutoring').insert([baseRow]));
      }
      if (error) throw error;
      toast({ title: 'Added', description: 'Tutoring assignment saved' });
      setIsTutoringModalOpen(false);
      // Invalidate cached staff->students list so the Staff tab reflects the new link
      if (special_ed_staff_id) {
        setStaffStudentsMap(prev => {
          const next = { ...prev };
          delete next[special_ed_staff_id];
          return next;
        });
      }
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

  // Generic delete for any special-ed child record
  const handleDeleteRecord = async (table, id, label = 'record', refresh = 'detail') => {
    if (!id) return;
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: `${label} removed` });
      if (refresh === 'detail' && selectedSpecEd?.id) {
        loadStudentDetail(selectedSpecEd.id);
      } else if (refresh === 'all') {
        loadData();
      } else if (refresh === 'schedules' && selectedStaff?.id) {
        loadStaffSchedules(selectedStaff.id);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleRemoveStudentFromSpecEd = async (specEdId) => {
    if (!specEdId) return;
    if (!window.confirm('Remove this student from special education? Their info, evaluations, tutoring and session logs will also be deleted. This cannot be undone.')) return;
    try {
      // Remove children explicitly in case CASCADE isn't set
      await supabase.from('special_ed_session_logs').delete().eq('special_ed_student_id', specEdId);
      await supabase.from('special_ed_tutoring').delete().eq('special_ed_student_id', specEdId);
      await supabase.from('special_ed_evaluations').delete().eq('special_ed_student_id', specEdId);
      await supabase.from('special_ed_info_sources').delete().eq('special_ed_student_id', specEdId);
      const { error } = await supabase.from('special_ed_students').delete().eq('id', specEdId);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Student removed from special education' });
      setExpandedStudentId(null);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!staffId) return;
    if (!window.confirm('Delete this staff member and their schedule? This cannot be undone.')) return;
    try {
      await supabase.from('special_ed_staff_schedule').delete().eq('special_ed_staff_id', staffId);
      const { error } = await supabase.from('special_ed_staff').delete().eq('id', staffId);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Staff member removed' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    if (!opt) return <Badge>{status}</Badge>;
    return (
      <Badge className={`${opt.color} text-sm px-3 py-1 font-semibold rounded-full inline-flex items-center gap-1.5 border-0`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        {opt.label}
      </Badge>
    );
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
    pendingEval: specEdStudents.filter(s => s.status === 'needs_evaluation' || s.status === 'referral_pending' || s.status === 'being_evaluated').length,
    active: specEdStudents.filter(s => s.status === 'receiving_services' || s.status === 'has_plan').length,
  };
  const statusCounts = STATUS_OPTIONS.reduce((acc, o) => {
    acc[o.value] = specEdStudents.filter(s => s.status === o.value).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t('menu.special-ed')}</h1>
          <p className="text-slate-500">Special Education Management - Students, Staff, Evaluations, and Plans</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            className="h-12 px-4"
            title={t('menu.special-ed')}
            filename="special-education"
            rows={filteredStudents}
            columns={SPECED_EXPORT_COLUMNS}
            sortOptions={SPECED_SORT_OPTIONS}
            groupOptions={SPECED_GROUP_OPTIONS}
          />
          <Button variant="outline" onClick={loadData} className="h-12">
            <RefreshCw className="h-4 w-4 me-2" /> Refresh
          </Button>
          <Button onClick={() => {
            setSelectedSpecEd(null);
            setStudentForm({ student_id: '', status: 'monitoring', referral_reason: '', help_type: '', help_description: '', current_plan: '', referral_date: new Date().toISOString().split('T')[0] });
            setNeedsEval(false);
            setEvalReqPriority('normal');
            setIsStudentModalOpen(true);
          }} className="bg-orange-600 hover:bg-orange-700 h-12 px-5 text-base font-semibold">
            <Plus className="h-5 w-5 me-2" /> {t('students.add')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setActiveTab('students'); }}
          className={`bg-[#4F46E5]/5 rounded-2xl border shadow-card p-6 text-start cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5 ${statusFilter === 'all' ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200/70'}`}
        >
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4"><Users className="h-9 w-9" strokeWidth={1.75} /></div>
          <p className="text-4xl font-bold text-slate-900 tabular-nums leading-none">{stats.total}</p>
          <p className="text-sm text-slate-500 font-medium mt-2">Total Students</p>
        </button>
        {STATUS_OPTIONS.map((o) => (
          <button
            type="button"
            key={o.value}
            onClick={() => { setStatusFilter(o.value); setActiveTab('students'); }}
            className={`bg-white rounded-2xl border shadow-card p-6 flex flex-col text-start cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5 ${statusFilter === o.value ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200/70'}`}
          >
            <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${o.color}`}>{o.label}</span>
            <p className="text-4xl font-bold text-slate-900 tabular-nums leading-none">{statusCounts[o.value] || 0}</p>
            <p className="text-sm text-slate-500 font-medium mt-2">{o.label}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="students">{t('nav.students')} ({specEdStudents.length})</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evalRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({specEdStaff.length})</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="overview">{t('nav.overview')}</TabsTrigger>
        </TabsList>

        {/* ===== STUDENTS TAB ===== */}
        <TabsContent value="students" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder={t('students.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-10 h-12" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] h-12"><SelectValue placeholder={t('filterLabels.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
              {t('common.showing')} <span className="font-bold text-slate-800">{filteredStudents.length}</span> {t('common.of')} <span className="font-bold text-slate-800">{specEdStudents.length}</span>
            </p>
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
                          <span
                            className={specEd.student?.id ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}
                            onClick={(e) => { e.stopPropagation(); specEd.student?.id && openProfile(specEd.student.id); }}
                          >
                            {specEd.student?.hebrew_name || `${specEd.student?.first_name} ${specEd.student?.last_name}`}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">
                          {specEd.student?.class?.name || 'No Class'} | {specEd.help_type ? HELP_TYPES.find(h => h.value === specEd.help_type)?.label : 'N/A'}
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
                        <strong>Reason/Concern:</strong> {specEd.referral_reason}
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
                          setNeedsEval(false);
                          setEvalReqPriority('normal');
                          setIsStudentModalOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-1" /> Edit Status
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setInfoForm({ source_type: 'teacher', source_name: '', content: '', date_gathered: new Date().toISOString().split('T')[0] });
                          setIsInfoModalOpen(true);
                        }}>
                          <FileText className="h-4 w-4 mr-1" /> Add Information
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setEvalForm({ evaluation_type: 'psychoeducational', evaluator_name: '', evaluation_date: new Date().toISOString().split('T')[0], results: '', recommendations: '', plan: '', actual_actions: '' });
                          setIsEvalModalOpen(true);
                        }}>
                          <ClipboardList className="h-4 w-4 mr-1" /> Add Evaluation
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setTutoringForm({ special_ed_staff_id: '', tutor_name: '', tutor_phone: '', tutor_type: 'private_teacher', subject: '', schedule_days: '', schedule_time: '', location: '', frequency: 'weekly', session_duration_minutes: 45, notes: '', start_date: new Date().toISOString().split('T')[0] });
                          setIsTutoringModalOpen(true);
                        }}>
                          <BookOpen className="h-4 w-4 mr-1" /> Add Private Tutor
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpecEd(specEd);
                          setSessionForm({ special_ed_staff_id: '', tutor_name: '', session_date: new Date().toISOString().split('T')[0], session_time: '', duration_minutes: 30, subject: '', content: '', progress_notes: '', goals_worked_on: '' });
                          setIsSessionLogModalOpen(true);
                        }}>
                          <Calendar className="h-4 w-4 mr-1" /> Log Session
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          openSendEmail(
                            `Special Education Update - ${specEd.student?.hebrew_name || specEd.student?.first_name}`,
                            `There is a new update regarding ${specEd.student?.hebrew_name || specEd.student?.first_name} ${specEd.student?.last_name}\n\nStatus: ${STATUS_OPTIONS.find(s => s.value === specEd.status)?.label}\n${specEd.referral_reason ? `Reason: ${specEd.referral_reason}` : ''}`
                          );
                        }}>
                          <Mail className="h-4 w-4 mr-1" /> Send Email
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ml-auto"
                          onClick={(e) => { e.stopPropagation(); handleRemoveStudentFromSpecEd(specEd.id); }}>
                          <Trash2 className="h-4 w-4 mr-1" /> Remove from Special Ed
                        </Button>
                      </div>

                      {/* Current Plan */}
                      {specEd.current_plan && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-1">Plan:</h4>
                          <p className="text-sm text-purple-700">{specEd.current_plan}</p>
                        </div>
                      )}

                      {/* Help Description */}
                      {specEd.help_description && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-1">Help Description:</h4>
                          <p className="text-sm text-green-700">{specEd.help_description}</p>
                        </div>
                      )}

                      {/* Info Sources */}
                      {detailData.infoSources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">Information Gathered ({detailData.infoSources.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {detailData.infoSources.map(info => (
                              <div key={info.id} className="p-3 bg-white rounded border text-sm relative group">
                                <div className="flex justify-between items-center mb-1">
                                  <Badge variant="outline">{SOURCE_TYPES.find(s => s.value === info.source_type)?.label || info.source_type}</Badge>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{new Date(info.date_gathered).toLocaleDateString('he-IL')}</span>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteRecord('special_ed_info_sources', info.id, 'information record'); }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                {info.source_name && <p className="text-xs text-slate-500 mb-1">From: {info.source_name}</p>}
                                <p className="text-slate-700">{info.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluations & Assessments (unified view) */}
                      {(detailData.evaluations.length > 0 || (detailData.assessments && detailData.assessments.length > 0)) && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">Evaluations &amp; Assessments ({detailData.evaluations.length + (detailData.assessments?.length || 0)})</h4>
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {detailData.evaluations.map(ev => (
                              <div key={ev.id} className="p-3 bg-white rounded border text-sm space-y-1">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">{EVAL_TYPES.find(e => e.value === ev.evaluation_type)?.label || ev.evaluation_type}</Badge>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{ev.evaluation_date && new Date(ev.evaluation_date).toLocaleDateString('he-IL')}</span>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteRecord('special_ed_evaluations', ev.id, 'evaluation'); }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                {ev.evaluator_name && <p className="text-xs text-slate-500">Evaluator: {ev.evaluator_name}</p>}
                                {ev.results && <div className="bg-blue-50 p-2 rounded"><strong>Results:</strong> {ev.results}</div>}
                                {ev.recommendations && <div className="bg-yellow-50 p-2 rounded"><strong>Recommendation:</strong> {ev.recommendations}</div>}
                                {ev.plan && <div className="bg-green-50 p-2 rounded"><strong>Plan:</strong> {ev.plan}</div>}
                                {ev.actual_actions && <div className="bg-purple-50 p-2 rounded"><strong>Actual Actions:</strong> {ev.actual_actions}</div>}
                              </div>
                            ))}
                            {(detailData.assessments || []).map(a => (
                              <div key={`asmt-${a.id}`} className="p-3 bg-white rounded border text-sm space-y-1">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">{a.template_id ? 'Assessment (Custom)' : 'Assessment (Standard)'}</Badge>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${a.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{a.status || 'draft'}</span>
                                    <span className="text-xs text-slate-400">{a.date && new Date(a.date).toLocaleDateString('en-US')}</span>
                                  </div>
                                </div>
                                {(a.created_by_name || a.teacher_name) && <p className="text-xs text-slate-500">By {a.created_by_name || a.teacher_name}</p>}
                                {a.summary && <div className="bg-blue-50 p-2 rounded"><strong>Summary:</strong> {a.summary}</div>}
                                {a.remarks && <div className="bg-yellow-50 p-2 rounded"><strong>Remarks:</strong> {a.remarks}</div>}
                                {a.plan && <div className="bg-green-50 p-2 rounded"><strong>Plan:</strong> {a.plan}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tutoring */}
                      {detailData.tutoring.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">Private Tutors ({detailData.tutoring.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {detailData.tutoring.map(t => (
                              <div key={t.id} className="p-3 bg-white rounded border text-sm relative">
                                <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecord('special_ed_tutoring', t.id, 'tutoring assignment'); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <p className="font-bold">{t.tutor_name}</p>
                                {t.tutor_phone && <p className="text-slate-500">{t.tutor_phone}</p>}
                                <p className="text-orange-600">{t.subject || 'N/A'} | {t.schedule_days} {t.schedule_time}</p>
                                <p className="text-xs text-slate-400">{t.frequency} | {t.session_duration_minutes} min</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Session Logs */}
                      {detailData.sessionLogs.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-2">Session Logs ({detailData.sessionLogs.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {detailData.sessionLogs.map(sess => (
                              <div key={sess.id} className="p-3 bg-white rounded border text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{sess.staff?.name || sess.tutor_name || 'N/A'} - {sess.subject || ''}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{new Date(sess.session_date).toLocaleDateString('he-IL')}</span>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteRecord('special_ed_session_logs', sess.id, 'session log'); }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-slate-600 mt-1">{sess.content}</p>
                                {sess.progress_notes && <p className="text-green-600 text-xs mt-1">Progress: {sess.progress_notes}</p>}
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
                <p>No students found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== EVALUATIONS (NEEDS-EVALUATION QUEUE) TAB ===== */}
        <TabsContent value="evaluations" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search student..." value={evalRequestSearch} onChange={(e) => setEvalRequestSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={evalRequestStatusFilter} onValueChange={setEvalRequestStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (not done)</SelectItem>
                <SelectItem value="all">All</SelectItem>
                {EVAL_REQUEST_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {evalRequests
              .filter(req => {
                const name = `${req.student?.first_name || ''} ${req.student?.last_name || ''} ${req.student?.hebrew_name || ''}`.toLowerCase();
                const matchesSearch = !evalRequestSearch || name.includes(evalRequestSearch.toLowerCase());
                const matchesStatus =
                  evalRequestStatusFilter === 'all' ? true :
                  evalRequestStatusFilter === 'open' ? (req.status !== 'completed' && req.status !== 'cancelled') :
                  req.status === evalRequestStatusFilter;
                return matchesSearch && matchesStatus;
              })
              .map(req => {
                const status = EVAL_REQUEST_STATUS.find(s => s.value === req.status);
                const priority = EVAL_PRIORITIES.find(p => p.value === req.priority);
                const studentName = req.student?.hebrew_name || `${req.student?.first_name || ''} ${req.student?.last_name || ''}`.trim() || 'Unknown student';
                return (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                            {studentName.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{studentName}</h3>
                            <p className="text-sm text-slate-500">
                              {req.student?.class?.name || 'No Class'}
                              {req.requested_by_name ? ` | Requested by ${req.requested_by_name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {priority && <Badge className={priority.color}>{priority.label}</Badge>}
                          {status && <Badge className={status.color}>{status.label}</Badge>}
                          {req.created_at && (
                            <span className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString('he-IL')}</span>
                          )}
                        </div>
                      </div>

                      {req.reason && (
                        <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded mt-3">
                          <strong>Reason:</strong> {req.reason}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-slate-400" />
                          <Select
                            value={req.assigned_staff_id || 'none'}
                            onValueChange={(v) => { if (v !== 'none') handleAssignEvalRequest(req, v); }}
                          >
                            <SelectTrigger className="w-[220px] h-9">
                              <SelectValue placeholder="Assign to staff..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {specEdStaff.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}{s.role ? ` — ${STAFF_ROLES.find(r => r.value === s.role)?.label || s.role}` : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {req.assigned_staff && (
                          <Button size="sm" variant="outline" onClick={() => {
                            const name = req.student?.hebrew_name || `${req.student?.first_name || ''} ${req.student?.last_name || ''}`.trim();
                            setEmailContext({
                              subject: `Evaluation Request - ${name}`,
                              body: `Reminder regarding the evaluation for ${name}${req.student?.class?.name ? ` (${req.student.class.name})` : ''}.\n\n${req.reason ? `Reason: ${req.reason}\n` : ''}Please record the evaluation results in the Special Education system.`,
                              to: req.assigned_staff?.email || ''
                            });
                            setIsEmailModalOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-1" /> Email
                          </Button>
                        )}

                        {req.status !== 'in_progress' && req.status !== 'completed' && req.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateEvalRequestStatus(req.id, 'in_progress')}>
                            Mark In Progress
                          </Button>
                        )}
                        {req.status !== 'completed' && (
                          <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => handleUpdateEvalRequestStatus(req.id, 'completed')}>
                            Mark Completed
                          </Button>
                        )}
                        {req.status !== 'cancelled' && req.status !== 'completed' && (
                          <Button size="sm" variant="outline" className="text-slate-600"
                            onClick={() => handleUpdateEvalRequestStatus(req.id, 'cancelled')}>
                            Cancel
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                          onClick={() => handleDeleteEvalRequest(req.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {req.assigned_staff && (
                        <p className="text-xs text-slate-500 mt-2">
                          Assigned to <strong>{req.assigned_staff.name}</strong>
                          {req.assigned_at ? ` on ${new Date(req.assigned_at).toLocaleDateString('he-IL')}` : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

            {evalRequests.filter(req => {
              const matchesStatus =
                evalRequestStatusFilter === 'all' ? true :
                evalRequestStatusFilter === 'open' ? (req.status !== 'completed' && req.status !== 'cancelled') :
                req.status === evalRequestStatusFilter;
              return matchesStatus;
            }).length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No evaluation requests</p>
                <p className="text-xs mt-1">Flag a child as "needs evaluation" when adding them to see it here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== STAFF TAB ===== */}
        <TabsContent value="staff" className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h3 className="text-lg font-semibold">Special Education Staff</h3>
            <div className="flex gap-2 items-center flex-1 min-w-[260px] max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search staff by name, role, or specialization..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => {
              setSelectedStaff(null);
              setStaffForm({ name: '', hebrew_name: '', role: 'resource_teacher', phone: '', email: '', specialization: '', certification: '', notes: '' });
              setIsStaffModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Add Staff
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specEdStaff
              .filter(s => {
                if (!staffSearchQuery) return true;
                const q = staffSearchQuery.toLowerCase();
                return (
                  s.name?.toLowerCase().includes(q) ||
                  s.hebrew_name?.toLowerCase().includes(q) ||
                  s.role?.toLowerCase().includes(q) ||
                  s.specialization?.toLowerCase().includes(q) ||
                  s.email?.toLowerCase().includes(q) ||
                  s.phone?.toLowerCase().includes(q) ||
                  STAFF_ROLES.find(r => r.value === s.role)?.label?.toLowerCase().includes(q)
                );
              })
              .map(staff => {
                const isExpanded = expandedStaffId === staff.id;
                const assigned = staffStudentsMap[staff.id] || [];
                return (
                  <Card key={staff.id} className={isExpanded ? 'md:col-span-2 lg:col-span-3 ring-2 ring-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleStaffDetail(staff.id)}>
                        <div>
                          <h4 className="font-bold">{staff.hebrew_name || staff.name}</h4>
                          <Badge variant="outline">{STAFF_ROLES.find(r => r.value === staff.role)?.label || staff.role}</Badge>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => toggleStaffDetail(staff.id)} title="Show students">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
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
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteStaff(staff.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {staff.phone && <p className="text-sm text-slate-500 mt-2">{staff.phone}</p>}
                      {staff.email && <p className="text-sm text-slate-500">{staff.email}</p>}
                      {staff.specialization && <p className="text-sm text-orange-600 mt-1">{staff.specialization}</p>}

                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedStaff(staff);
                          await loadStaffSchedules(staff.id);
                          setIsScheduleModalOpen(true);
                        }}>
                          <Clock className="h-3 w-3 mr-1" /> Schedule
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toggleStaffDetail(staff.id); }}>
                          <Users className="h-3 w-3 mr-1" /> Students {staffStudentsMap[staff.id] ? `(${staffStudentsMap[staff.id].length})` : ''}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t bg-slate-50 -mx-4 -mb-4 px-4 pb-4 rounded-b">
                          <h5 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Assigned Students ({assigned.length})
                          </h5>
                          {assigned.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No students currently assigned to this staff member.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {assigned.map(({ tutoring, specEd, student }) => {
                                const displayName = student
                                  ? (student.hebrew_name || `${student.first_name || ''} ${student.last_name || ''}`.trim())
                                  : (tutoring.tutor_name || 'Unknown student');
                                const className = student?.class?.name || '';
                                const status = specEd ? STATUS_OPTIONS.find(o => o.value === specEd.status) : null;
                                return (
                                  <div
                                    key={tutoring.id}
                                    className="p-3 bg-white rounded border text-sm hover:bg-orange-50 cursor-pointer"
                                    onClick={() => {
                                      if (specEd) {
                                        setActiveTab('students');
                                        setExpandedStudentId(specEd.id);
                                        loadStudentDetail(specEd.id);
                                      }
                                    }}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1">
                                        <p className="font-bold text-slate-800">{displayName}</p>
                                        {className && <p className="text-xs text-slate-500">{className}</p>}
                                      </div>
                                      {status && <Badge className={`${status.color} text-xs`}>{status.label}</Badge>}
                                    </div>
                                    {(tutoring.subject || tutoring.schedule_days || tutoring.schedule_time) && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        {tutoring.subject || ''}
                                        {tutoring.subject && (tutoring.schedule_days || tutoring.schedule_time) ? ' | ' : ''}
                                        {tutoring.schedule_days || ''} {tutoring.schedule_time || ''}
                                      </p>
                                    )}
                                    {tutoring.frequency && (
                                      <p className="text-xs text-slate-400">{tutoring.frequency}{tutoring.session_duration_minutes ? ` · ${tutoring.session_duration_minutes} min` : ''}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {specEdStaff.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff added yet</p>
            </div>
          )}
        </TabsContent>

        {/* ===== OVERVIEW TAB ===== */}
        {/* ===== MONTHLY REPORTS TAB ===== */}
        <TabsContent value="monthly" className="space-y-4">
          {/* Month selector */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => shiftReportMonth(-1)} title="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white min-w-[180px] justify-center">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-slate-800">{monthLabel}</span>
              </div>
              <Button variant="outline" size="icon" onClick={() => shiftReportMonth(1)} title="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => e.target.value && setReportMonth(e.target.value)}
                className="ml-2 h-9 px-2 border rounded-lg text-sm bg-white"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {monthlyReports.length} of {specEdStudents.length} reports completed
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search student..." value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} className="pl-10" />
          </div>

          {monthlyLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading reports...
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card border border-border/70 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specEdStudents
                    .filter(se => {
                      if (!reportSearch) return true;
                      const q = reportSearch.toLowerCase();
                      const s = se.student;
                      return (
                        s?.first_name?.toLowerCase().includes(q) ||
                        s?.last_name?.toLowerCase().includes(q) ||
                        s?.hebrew_name?.includes(reportSearch)
                      );
                    })
                    .map(se => {
                      const report = monthlyReports.find(r => r.special_ed_student_id === se.id);
                      const name = se.student
                        ? `${se.student.first_name || ''} ${se.student.last_name || ''}`.trim() || se.student.hebrew_name
                        : 'Unknown student';
                      return (
                        <TableRow key={se.id}>
                          <TableCell className="font-medium">
                            {name}
                            {se.student?.hebrew_name && (
                              <span className="block text-xs text-slate-500 font-hebrew" dir="rtl">{se.student.hebrew_name}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{se.student?.class?.name || '-'}</TableCell>
                          <TableCell>
                            {report
                              ? <Badge variant="success">Completed</Badge>
                              : <Badge variant="warning">Missing</Badge>}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[280px] truncate">
                            {report?.what_was_done || report?.progress || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant={report ? 'outline' : 'default'} onClick={() => openMonthlyReport(se)}>
                                {report ? (<><Edit className="h-3.5 w-3.5 mr-1" /> Edit</>) : (<><Plus className="h-3.5 w-3.5 mr-1" /> Add</>)}
                              </Button>
                              {report && (
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteMonthlyReport(report.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {specEdStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">No special-education students yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Status */}
            <Card>
              <CardHeader><CardTitle>Students by Status</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Students by Help Type</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Staff Overview</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Specialization</TableHead>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSpecEd ? 'Edit Student' : 'Add Student to Special Education'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <StudentPicker
                students={allStudents}
                value={studentForm.student_id}
                onChange={(id) => setStudentForm({ ...studentForm, student_id: id })}
                placeholder="Search student..."
                disabled={!!selectedSpecEd}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={studentForm.status} onValueChange={(v) => setStudentForm({ ...studentForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason / Concern (what needs to be evaluated)</Label>
              <Textarea value={studentForm.referral_reason} onChange={(e) => setStudentForm({ ...studentForm, referral_reason: e.target.value })} placeholder="Why does this child need to be evaluated?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Help Type</Label>
                <Select value={studentForm.help_type || 'none'} onValueChange={(v) => setStudentForm({ ...studentForm, help_type: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {HELP_TYPES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={studentForm.referral_date} onChange={(e) => setStudentForm({ ...studentForm, referral_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Help Description</Label>
              <Textarea value={studentForm.help_description} onChange={(e) => setStudentForm({ ...studentForm, help_description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Plan</Label>
              <Textarea value={studentForm.current_plan} onChange={(e) => setStudentForm({ ...studentForm, current_plan: e.target.value })} rows={2} />
            </div>

            {!selectedSpecEd && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="needs_evaluation"
                    checked={needsEval}
                    onChange={(e) => setNeedsEval(e.target.checked)}
                    className="rounded border-slate-300 h-4 w-4 mt-0.5"
                  />
                  <Label htmlFor="needs_evaluation" className="cursor-pointer text-sm">
                    <span className="font-medium">This child needs an evaluation</span>
                    <span className="block text-xs text-slate-500">Adds a pending request to the Evaluations queue so it can be assigned to a staff member.</span>
                  </Label>
                </div>
                {needsEval && (
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select value={evalReqPriority} onValueChange={setEvalReqPriority}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVAL_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} className="bg-orange-600 hover:bg-orange-700">{selectedSpecEd ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Source Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source</Label>
                <Select value={infoForm.source_type} onValueChange={(v) => setInfoForm({ ...infoForm, source_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name (optional)</Label>
                <Input value={infoForm.source_name} onChange={(e) => setInfoForm({ ...infoForm, source_name: e.target.value })} placeholder="Source name" />
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={infoForm.date_gathered} onChange={(e) => setInfoForm({ ...infoForm, date_gathered: e.target.value })} />
            </div>
            <div>
              <Label>Information *</Label>
              <Textarea value={infoForm.content} onChange={(e) => setInfoForm({ ...infoForm, content: e.target.value })} rows={4} placeholder="What was said / found..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInfoModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInfoSource}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Modal */}
      <Dialog open={isEvalModalOpen} onOpenChange={setIsEvalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Evaluation Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Evaluation Type</Label>
                <Select value={evalForm.evaluation_type} onValueChange={(v) => setEvalForm({ ...evalForm, evaluation_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVAL_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Evaluator Name</Label>
                <Input value={evalForm.evaluator_name} onChange={(e) => setEvalForm({ ...evalForm, evaluator_name: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={evalForm.evaluation_date} onChange={(e) => setEvalForm({ ...evalForm, evaluation_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Results</Label>
              <Textarea value={evalForm.results} onChange={(e) => setEvalForm({ ...evalForm, results: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Recommendations</Label>
              <Textarea value={evalForm.recommendations} onChange={(e) => setEvalForm({ ...evalForm, recommendations: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Plan</Label>
              <Textarea value={evalForm.plan} onChange={(e) => setEvalForm({ ...evalForm, plan: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Actual Actions Planned</Label>
              <Textarea value={evalForm.actual_actions} onChange={(e) => setEvalForm({ ...evalForm, actual_actions: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEvalModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEvaluation} className="bg-blue-600 hover:bg-blue-700">Save Evaluation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutoring Modal */}
      <Dialog open={isTutoringModalOpen} onOpenChange={setIsTutoringModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Private Tutor / Therapist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Link to Special-Ed Staff Member (optional)</Label>
              <Select
                value={tutoringForm.special_ed_staff_id || 'none'}
                onValueChange={(v) => {
                  if (v === 'none') {
                    setTutoringForm(prev => ({ ...prev, special_ed_staff_id: '' }));
                  } else {
                    const staff = specEdStaff.find(s => s.id === v);
                    setTutoringForm(prev => ({
                      ...prev,
                      special_ed_staff_id: v,
                      tutor_name: prev.tutor_name || staff?.name || '',
                      tutor_phone: prev.tutor_phone || staff?.phone || ''
                    }));
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Private / external (not staff)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Private / external (not staff)</SelectItem>
                  {specEdStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}{s.role ? ` — ${s.role}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Pick a staff member to make this student show up under them in the Staff tab.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={tutoringForm.tutor_name} onChange={(e) => setTutoringForm({ ...tutoringForm, tutor_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={tutoringForm.tutor_phone} onChange={(e) => setTutoringForm({ ...tutoringForm, tutor_phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={tutoringForm.tutor_type} onValueChange={(v) => setTutoringForm({ ...tutoringForm, tutor_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_teacher">Private Teacher</SelectItem>
                    <SelectItem value="speech">Speech</SelectItem>
                    <SelectItem value="OT">OT</SelectItem>
                    <SelectItem value="reading_specialist">Reading Specialist</SelectItem>
                    <SelectItem value="the">THE</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={tutoringForm.subject} onChange={(e) => setTutoringForm({ ...tutoringForm, subject: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Days</Label>
                <Input value={tutoringForm.schedule_days} onChange={(e) => setTutoringForm({ ...tutoringForm, schedule_days: e.target.value })} placeholder="Monday, Wednesday" />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={tutoringForm.schedule_time} onChange={(e) => setTutoringForm({ ...tutoringForm, schedule_time: e.target.value })} placeholder="2:00-3:00" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={tutoringForm.location} onChange={(e) => setTutoringForm({ ...tutoringForm, location: e.target.value })} />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={tutoringForm.frequency} onValueChange={(v) => setTutoringForm({ ...tutoringForm, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minutes</Label>
                <Input type="number" value={tutoringForm.session_duration_minutes} onChange={(e) => setTutoringForm({ ...tutoringForm, session_duration_minutes: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={tutoringForm.notes} onChange={(e) => setTutoringForm({ ...tutoringForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTutoringModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTutoring}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Modal */}
      <Dialog open={isMonthlyReportModalOpen} onOpenChange={setIsMonthlyReportModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReport ? 'Edit' : 'New'} Monthly Report — {monthLabel}
            </DialogTitle>
          </DialogHeader>
          {reportStudent && (
            <p className="text-sm text-muted-foreground -mt-2">
              {reportStudent.student
                ? `${reportStudent.student.first_name || ''} ${reportStudent.student.last_name || ''}`.trim() || reportStudent.student.hebrew_name
                : 'Student'}
            </p>
          )}
          <div className="space-y-4 py-2">
            <div>
              <Label>What was worked on this month</Label>
              <Textarea rows={3} value={reportForm.what_was_done} onChange={(e) => setReportForm({ ...reportForm, what_was_done: e.target.value })} placeholder="Activities, subjects, sessions..." />
            </div>
            <div>
              <Label>Progress</Label>
              <Textarea rows={3} value={reportForm.progress} onChange={(e) => setReportForm({ ...reportForm, progress: e.target.value })} placeholder="What progress did the student make?" />
            </div>
            <div>
              <Label>Challenges / Concerns</Label>
              <Textarea rows={2} value={reportForm.challenges} onChange={(e) => setReportForm({ ...reportForm, challenges: e.target.value })} placeholder="Difficulties or concerns this month" />
            </div>
            <div>
              <Label>Goals for Next Month</Label>
              <Textarea rows={2} value={reportForm.goals_next_month} onChange={(e) => setReportForm({ ...reportForm, goals_next_month: e.target.value })} placeholder="What to focus on next month" />
            </div>
            <div>
              <Label>Recommendations / Notes</Label>
              <Textarea rows={2} value={reportForm.recommendations} onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMonthlyReportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMonthlyReport}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Modal */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Hebrew Name</Label>
                <Input value={staffForm.hebrew_name} onChange={(e) => setStaffForm({ ...staffForm, hebrew_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Specialization</Label>
                <Input value={staffForm.specialization} onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Certification</Label>
              <Input value={staffForm.certification} onChange={(e) => setStaffForm({ ...staffForm, certification: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={staffForm.notes} onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStaff} className="bg-orange-600 hover:bg-orange-700">{selectedStaff ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule for {selectedStaff?.hebrew_name || selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing Schedule */}
            {staffSchedules.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Current Schedule:</h4>
                {staffSchedules.map(sch => (
                  <div key={sch.id} className="p-2 bg-slate-50 rounded border text-sm flex justify-between items-center">
                    <span>{DAYS[sch.day_of_week]}: {sch.start_time} - {sch.end_time}</span>
                    <Badge variant={sch.status === 'available' || sch.status === 'in_school' ? 'default' : 'destructive'}>
                      {sch.status === 'available' ? 'Available' : sch.status === 'busy' ? 'Busy' : sch.status === 'in_school' ? 'In School' : 'Unavailable'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Add New Time Slot:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Day</Label>
                  <Select value={String(scheduleForm.day_of_week)} onValueChange={(v) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={scheduleForm.status} onValueChange={(v) => setScheduleForm({ ...scheduleForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_school">In School</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label>From</Label>
                  <Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>To</Label>
                  <Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                </div>
              </div>
              <div className="mt-2">
                <Label>Location</Label>
                <Input value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="Room number" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Close</Button>
            <Button onClick={handleSaveSchedule}>Add Time Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Log Modal */}
      <Dialog open={isSessionLogModalOpen} onOpenChange={setIsSessionLogModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Staff Member</Label>
                <Select value={sessionForm.special_ed_staff_id || 'none'} onValueChange={(v) => setSessionForm({ ...sessionForm, special_ed_staff_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Other / External</SelectItem>
                    {specEdStaff.map(s => <SelectItem key={s.id} value={s.id}>{s.hebrew_name || s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or: External Name</Label>
                <Input value={sessionForm.tutor_name} onChange={(e) => setSessionForm({ ...sessionForm, tutor_name: e.target.value })} placeholder="Name" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={sessionForm.session_time} onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })} />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={sessionForm.subject} onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })} />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={sessionForm.content} onChange={(e) => setSessionForm({ ...sessionForm, content: e.target.value })} rows={3} placeholder="What was done..." />
            </div>
            <div>
              <Label>Progress Notes</Label>
              <Textarea value={sessionForm.progress_notes} onChange={(e) => setSessionForm({ ...sessionForm, progress_notes: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Goals Worked On</Label>
              <Input value={sessionForm.goals_worked_on} onChange={(e) => setSessionForm({ ...sessionForm, goals_worked_on: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionLogModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSessionLog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={emailContext.subject}
        defaultBody={emailContext.body}
        defaultTo={emailContext.to}
        currentUser={currentUser}
      />
      {/* Notification prompt (create + update) */}
      {notifyElement}
    </div>
  );
};

export default SpecialEducationView;
