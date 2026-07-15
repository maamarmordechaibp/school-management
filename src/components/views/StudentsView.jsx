import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckSquare, Upload, Filter, Grid, List, X, GraduationCap, AlertCircle, Phone, User, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchAllRows } from '@/lib/fetchAll';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import StudentModal from '@/components/modals/StudentModal';
import GradesModal from '@/components/modals/GradesModal';
import ImportStudentsModal from '@/components/modals/ImportStudentsModal';
import StudentProfileView from '@/components/views/StudentProfileView';
import FilterBar from '@/components/FilterBar';
import ExportButton from '@/components/ExportButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Export configuration — every field the user can choose to include when
// exporting the students list to PDF or Excel. Order here = column order.
const fullName = (s) => `${s.first_name || ''} ${s.last_name || ''}`.trim();
const STUDENT_EXPORT_COLUMNS = [
  { key: 'name', label: 'Student Name', accessor: fullName },
  { key: 'first_name', label: 'First Name', accessor: (s) => s.first_name },
  { key: 'last_name', label: 'Last Name', accessor: (s) => s.last_name },
  { key: 'hebrew_name', label: 'Hebrew Name', accessor: (s) => s.hebrew_name },
  { key: 'class', label: 'Class', accessor: (s) => s.class?.name },
  { key: 'grade', label: 'Grade', accessor: (s) => s.class?.grade?.name },
  { key: 'father_name', label: 'Father Name', accessor: (s) => s.father_name },
  { key: 'father_phone', label: 'Father Phone', accessor: (s) => s.father_phone, default: false },
  { key: 'mother_name', label: 'Mother Name', accessor: (s) => s.mother_name },
  { key: 'mother_phone', label: 'Mother Phone', accessor: (s) => s.mother_phone, default: false },
  { key: 'home_phone', label: 'Home Phone', accessor: (s) => s.home_phone, default: false },
  { key: 'email', label: 'Email', accessor: (s) => s.email, default: false },
  { key: 'address', label: 'Address', accessor: (s) => s.address, default: false },
  { key: 'status', label: 'Status', accessor: (s) => (s.is_active === false || s.status === 'inactive' ? 'Inactive' : 'Active'), default: false },
  { key: 'open_issues', label: 'Open Issues', accessor: (s) => s.open_issues_count ?? 0, default: false },
  // Comprehensive summary columns — everything a student has across the app.
  // Included by default so the download reflects all of a student's info.
  { key: 'agg_charged', label: 'Total Charged', accessor: (s) => (s.agg_charged ?? 0).toFixed(2), default: true },
  { key: 'agg_paid', label: 'Total Paid', accessor: (s) => (s.agg_paid ?? 0).toFixed(2), default: true },
  { key: 'agg_balance', label: 'Balance', accessor: (s) => (s.agg_balance ?? 0).toFixed(2), default: true },
  { key: 'agg_grade_average', label: 'Grade Average', accessor: (s) => (s.agg_grade_average ?? ''), default: true },
  { key: 'agg_open_todos', label: 'Open Tasks', accessor: (s) => s.agg_open_todos ?? 0, default: true },
  { key: 'agg_reminders', label: 'Reminders', accessor: (s) => s.agg_reminders ?? 0, default: true },
  { key: 'agg_lates', label: 'Late Arrivals', accessor: (s) => s.agg_lates ?? 0, default: true },
  { key: 'agg_calls', label: 'Calls', accessor: (s) => s.agg_calls ?? 0, default: true },
  { key: 'agg_meetings', label: 'Meetings', accessor: (s) => s.agg_meetings ?? 0, default: true },
  { key: 'agg_assessments', label: 'Assessments', accessor: (s) => s.agg_assessments ?? 0, default: true },
  { key: 'agg_notes', label: 'Notes', accessor: (s) => s.agg_notes ?? 0, default: true },
  { key: 'agg_plan_status', label: 'Plan Status', accessor: (s) => s.agg_plan_status || '', default: true },
  { key: 'agg_special_ed_status', label: 'Special Ed', accessor: (s) => s.agg_special_ed_status || '', default: true },
];
const STUDENT_SORT_OPTIONS = [
  { key: 'last_name', label: 'Last Name', accessor: (s) => s.last_name },
  { key: 'first_name', label: 'First Name', accessor: (s) => s.first_name },
  { key: 'hebrew_name', label: 'Hebrew Name', accessor: (s) => s.hebrew_name },
  { key: 'class', label: 'Class', accessor: (s) => s.class?.name },
  { key: 'grade', label: 'Grade', accessor: (s) => s.class?.grade?.name },
  { key: 'agg_balance', label: 'Balance', accessor: (s) => s.agg_balance ?? 0 },
  { key: 'agg_grade_average', label: 'Grade Average', accessor: (s) => s.agg_grade_average ?? 0 },
];
const STUDENT_GROUP_OPTIONS = [
  { key: 'class', label: 'Class', accessor: (s) => s.class?.name || 'No Class' },
  { key: 'grade', label: 'Grade', accessor: (s) => s.class?.grade?.name || 'No Grade' },
];

const StudentsView = ({ role, currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;
  
  // View State
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  
  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    class_id: 'all',
    grade_id: 'all',
    hasOpenIssues: 'all',
    status: 'all'
  });

  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [viewingProfileId, setViewingProfileId] = useState(() => {
    // Restore from localStorage on initial load
    const saved = localStorage.getItem('viewingStudentId');
    return saved || null;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({ date: new Date().toISOString().split('T')[0], status: 'present', note: '' });

  // Persist viewingProfileId to localStorage
  useEffect(() => {
    if (viewingProfileId) {
      localStorage.setItem('viewingStudentId', viewingProfileId);
    } else {
      localStorage.removeItem('viewingStudentId');
    }
  }, [viewingProfileId]);

  useEffect(() => {
    loadData();
    loadFilters(); // Load filters separately
  }, [role, currentUser]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // reset to first page whenever filters/data change
  }, [students, filters]);

  // Load grades and classes for filters - separate from student loading
  const loadFilters = async () => {
    try {
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade_id, grade:grades!grade_id(name)')
        .order('name');
      if (classesError) {
        console.error('Error loading classes:', classesError);
      } else {
        console.log('Loaded classes:', classesData?.length);
        setClasses(classesData || []);
      }

      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) {
        console.error('Error loading grades:', gradesError);
      } else {
        console.log('Loaded grades:', gradesData?.length);
        setGrades(gradesData || []);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Determine any role-based restriction (class IDs or student IDs) first,
      // then build a fresh query each page so fetchAllRows can page past the
      // 1000-row PostgREST cap without silently truncating the list.
      let restrict = null; // { column: 'class_id'|'id', values: [...] }

      if (role === 'teacher' || role === 'teacher_hebrew' || role === 'teacher_english') {
        // Teachers see students in their assigned class
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .or(`hebrew_teacher_id.eq.${currentUser?.id},english_teacher_id.eq.${currentUser?.id}`);

        const classIds = teacherClasses?.map(c => c.id) || [];
        if (classIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }
        restrict = { column: 'class_id', values: classIds };
      } else if (role === 'tutor') {
        // Tutors see only their assigned students
        const { data: tutorStudents } = await supabase
          .from('tutor_assignments')
          .select('student_id')
          .eq('tutor_id', currentUser?.id)
          .eq('is_active', true);

        const studentIds = tutorStudents?.map(ts => ts.student_id) || [];
        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }
        restrict = { column: 'id', values: studentIds };
      }

      const data = await fetchAllRows(() => {
        let q = supabase
          .from('students')
          .select(`
            *,
            class:classes!class_id(id, name, grade_id, grade:grades(id, name))
          `)
          .order('last_name');
        if (restrict) q = q.in(restrict.column, restrict.values);
        return q;
      });

      // Try to load issues separately (table may not exist)
      let issuesByStudent = {};
      try {
        const issuesData = await fetchAllRows(() =>
          supabase.from('student_issues').select('student_id, status')
        );
        if (issuesData) {
          issuesData.forEach(issue => {
            if (!issuesByStudent[issue.student_id]) {
              issuesByStudent[issue.student_id] = [];
            }
            issuesByStudent[issue.student_id].push(issue);
          });
        }
      } catch (e) {
        // student_issues table may not exist
      }

      // Best-effort aggregates for the export (financial, academic, tasks, etc.).
      // Each block is guarded so a missing table never breaks the students list.
      const agg = {};
      const ensureAgg = (id) => (agg[id] = agg[id] || {
        charged: 0, paid: 0, gradeSum: 0, gradeCount: 0,
        todos_open: 0, reminders: 0, lates: 0, calls: 0, meetings: 0,
        assessments: 0, notes: 0, plan_status: null, special_ed_status: null,
      });
      const OPEN_TODO = (st) => !['done', 'completed', 'cancelled', 'closed'].includes(String(st || '').toLowerCase());
      try {
        const fees = await fetchAllRows(() => supabase.from('student_fees').select('student_id, amount'));
        fees?.forEach((f) => { ensureAgg(f.student_id).charged += Number(f.amount || 0); });
      } catch (e) { /* student_fees optional */ }
      try {
        const pays = await fetchAllRows(() => supabase.from('payments').select('student_id, amount'));
        pays?.forEach((p) => { if (p.student_id) ensureAgg(p.student_id).paid += Number(p.amount || 0); });
      } catch (e) { /* payments optional */ }
      try {
        const gr = await fetchAllRows(() => supabase.from('grades').select('student_id, grade'));
        gr?.forEach((g) => { const n = parseFloat(g.grade); if (Number.isFinite(n)) { const a = ensureAgg(g.student_id); a.gradeSum += n; a.gradeCount += 1; } });
      } catch (e) { /* grades optional */ }
      try {
        const td = await fetchAllRows(() => supabase.from('todos').select('student_id, status'));
        td?.forEach((t) => { if (t.student_id && OPEN_TODO(t.status)) ensureAgg(t.student_id).todos_open += 1; });
      } catch (e) { /* todos optional */ }
      try {
        const rm = await fetchAllRows(() => supabase.from('reminders').select('related_student_id'));
        rm?.forEach((r) => { if (r.related_student_id) ensureAgg(r.related_student_id).reminders += 1; });
      } catch (e) { /* reminders optional */ }
      try {
        const la = await fetchAllRows(() => supabase.from('late_arrivals').select('student_id'));
        la?.forEach((l) => { if (l.student_id) ensureAgg(l.student_id).lates += 1; });
      } catch (e) { /* late_arrivals optional */ }
      try {
        const cl = await fetchAllRows(() => supabase.from('call_logs').select('student_id'));
        cl?.forEach((c) => { if (c.student_id) ensureAgg(c.student_id).calls += 1; });
      } catch (e) { /* call_logs optional */ }
      try {
        const mt = await fetchAllRows(() => supabase.from('meetings').select('student_id'));
        mt?.forEach((m) => { if (m.student_id) ensureAgg(m.student_id).meetings += 1; });
      } catch (e) { /* meetings optional */ }
      try {
        const pl = await fetchAllRows(() => supabase.from('student_plans').select('student_id, status, created_at').order('created_at', { ascending: false }));
        pl?.forEach((p) => { if (p.student_id) { const a = ensureAgg(p.student_id); if (a.plan_status === null) a.plan_status = p.status || 'active'; } });
      } catch (e) { /* student_plans optional */ }
      try {
        const asm = await fetchAllRows(() => supabase.from('assessments').select('student_id'));
        asm?.forEach((a) => { if (a.student_id) ensureAgg(a.student_id).assessments += 1; });
      } catch (e) { /* assessments optional */ }
      try {
        const nt = await fetchAllRows(() => supabase.from('student_notes').select('student_id, is_active'));
        nt?.forEach((n) => { if (n.student_id && n.is_active !== false) ensureAgg(n.student_id).notes += 1; });
      } catch (e) { /* student_notes optional */ }
      try {
        const sed = await fetchAllRows(() => supabase.from('special_ed_students').select('student_id, status, is_active'));
        sed?.forEach((r) => { if (r.student_id && r.is_active !== false) { const a = ensureAgg(r.student_id); if (a.special_ed_status === null) a.special_ed_status = r.status || 'active'; } });
      } catch (e) { /* special_ed_students optional */ }

      // Merge issue counts + aggregates onto each student
      const studentsWithIssues = (data || []).map(s => {
        const a = agg[s.id] || {};
        return {
          ...s,
          open_issues_count: (issuesByStudent[s.id] || []).filter(i => i.status === 'open' || i.status === 'in_progress').length,
          agg_charged: a.charged || 0,
          agg_paid: a.paid || 0,
          agg_balance: (a.charged || 0) - (a.paid || 0),
          agg_grade_average: a.gradeCount ? Math.round((a.gradeSum / a.gradeCount) * 10) / 10 : null,
          agg_open_todos: a.todos_open || 0,
          agg_reminders: a.reminders || 0,
          agg_lates: a.lates || 0,
          agg_calls: a.calls || 0,
          agg_meetings: a.meetings || 0,
          agg_assessments: a.assessments || 0,
          agg_notes: a.notes || 0,
          agg_plan_status: a.plan_status || null,
          agg_special_ed_status: a.special_ed_status || null,
        };
      });
      setStudents(studentsWithIssues);

    } catch (error) {
      console.error('Error loading students:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...students];

    // Text Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(s => 
        s.first_name?.toLowerCase().includes(q) || 
        s.last_name?.toLowerCase().includes(q) ||
        s.hebrew_name?.toLowerCase().includes(q) ||
        s.father_name?.toLowerCase().includes(q) ||
        s.mother_name?.toLowerCase().includes(q)
      );
    }

    // Class Filter
    if (filters.class_id !== 'all') {
      result = result.filter(s => s.class_id === filters.class_id);
    }

    // Grade Filter
    if (filters.grade_id !== 'all') {
      result = result.filter(s => s.class?.grade_id === filters.grade_id);
    }

    // Issues Filter
    if (filters.hasOpenIssues !== 'all') {
      result = result.filter(s => {
        const hasOpen = s.open_issues_count > 0;
        return filters.hasOpenIssues === 'yes' ? hasOpen : !hasOpen;
      });
    }

    // Status Filter (active / inactive)
    if (filters.status !== 'all') {
      result = result.filter(s => {
        const active = s.is_active !== false && s.status !== 'inactive';
        return filters.status === 'active' ? active : !active;
      });
    }

    setFilteredStudents(result);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student and EVERYTHING linked to them (issues, calls, meetings, grades, assessments, fees, payments, reminders, tasks, documents, special-ed records)? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase.rpc('delete_student_cascade', { p_student_id: id });
      if (error) throw error;
      toast({ title: 'Success', description: 'Student and all associated records deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not delete student' });
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filteredStudents.map(s => s.id));
    else setSelectedIds([]);
  };

  const toggleSelectStudent = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const submitAttendance = async () => {
    if (selectedIds.length === 0) return;
    const inserts = selectedIds.map(id => ({
      student_id: id,
      date: attendanceData.date,
      status: attendanceData.status,
      note: attendanceData.note
    }));
    const { error } = await supabase.from('attendance').insert(inserts);
    if (error) {
      console.error('Error marking attendance:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to mark attendance' });
      return;
    }
    toast({ title: 'Success', description: 'Attendance marked' });
    setIsAttendanceModalOpen(false);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      class_id: 'all',
      grade_id: 'all',
      hasOpenIssues: 'all',
      status: 'all'
    });
  };

  const getStudentDisplayName = (student) => {
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`;
    }
    return student.first_name || student.last_name || 'Unnamed';
  };

  // Pagination over the filtered result set
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  if (viewingProfileId) {
    return <StudentProfileView studentId={viewingProfileId} onBack={() => setViewingProfileId(null)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('students.title')}</h2>
          <p className="text-muted-foreground mt-1">
            {role === 'teacher' || role === 'teacher_hebrew' || role === 'teacher_english' ? 'Students in your classes' : 
             role === 'tutor' ? 'Your assigned students' : 
             `${students.length} ${t('nav.students')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            className="h-12 px-4"
            title={t('students.title')}
            filename="students"
            rows={filteredStudents}
            columns={STUDENT_EXPORT_COLUMNS}
            sortOptions={STUDENT_SORT_OPTIONS}
            groupOptions={STUDENT_GROUP_OPTIONS}
          />
          {['principal', 'principal_hebrew', 'principal_english', 'admin'].includes(role) && (
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 h-12 px-4">
              <Upload size={18} /> {t('students.import')}
            </Button>
          )}
          {['principal', 'principal_hebrew', 'principal_english', 'admin', 'teacher', 'teacher_hebrew', 'teacher_english'].includes(role) && (
            <Button onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }} className="h-12 px-5 text-base font-semibold">
              <Plus size={20} className="me-2" /> {t('students.add')}
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <FilterBar
        searchKey="search"
        searchPlaceholder={t('students.search')}
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        onClear={clearFilters}
        resultCount={filteredStudents.length}
        totalCount={students.length}
        resultNoun={t('nav.students')}
        filters={[
          {
            key: 'grade_id',
            label: t('filterLabels.grade'),
            type: 'select',
            options: grades.map(g => ({ value: g.id, label: g.name })),
          },
          {
            key: 'class_id',
            label: t('filterLabels.class'),
            type: 'select',
            options: classes.map(c => ({ value: c.id, label: `${c.name}${c.grade?.name ? ` (${c.grade.name})` : ''}` })),
          },
          {
            key: 'status',
            label: t('filterLabels.status'),
            type: 'select',
            options: [
              { value: 'active', label: t('filterLabels.active') },
              { value: 'inactive', label: t('filterLabels.inactive') },
            ],
          },
          {
            key: 'hasOpenIssues',
            label: t('filterLabels.hasOpenIssues'),
            type: 'toggle',
            onValue: 'yes',
          },
        ]}
        rightSlot={
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title={t('meetings.listView')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid"
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid size={20} />
            </button>
          </div>
        }
      />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/15 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ms-2">
            {selectedIds.length} {t('nav.students')}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsAttendanceModalOpen(true)}>
              <CheckSquare size={16} className="me-2" /> {t('students.markAttendance')}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedStudents.map((student) => (
            <div 
              key={student.id} 
              className={`bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 border ${selectedIds.includes(student.id) ? 'border-primary ring-1 ring-primary/30' : 'border-border/70'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(student.id)} 
                    onChange={() => toggleSelectStudent(student.id)} 
                    className="mt-1 w-4 h-4 rounded border-slate-300" 
                  />
                  <div className="cursor-pointer group" onClick={() => setViewingProfileId(student.id)}>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                      {getStudentDisplayName(student)}
                    </h3>
                    {student.hebrew_name && (
                      <p className="text-sm text-slate-500 font-hebrew" dir="rtl">{student.hebrew_name}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{student.class?.name || 'No Class'}</Badge>
                      {student.open_issues_count > 0 && (
                        <Badge variant="warning" className="text-xs">{student.open_issues_count} Issues</Badge>
                      )}
                      {student.notify_on_updates && (
                        <Badge variant="default" className="text-xs"><Bell className="h-3 w-3 mr-0.5" />Auto-Email</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['principal', 'principal_hebrew', 'principal_english', 'admin', 'teacher', 'teacher_hebrew', 'teacher_english'].includes(role) && (
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}>
                      <Edit size={16} />
                    </Button>
                  )}
                  {['principal', 'principal_hebrew', 'principal_english', 'admin'].includes(role) && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="hover:text-red-600">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-left mt-4 border-t pt-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <GraduationCap size={14} />
                  <span>{student.class?.grade?.name || 'No Grade'}</span>
                </div>
                {student.father_name && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} />
                    <span>{student.father_name}</span>
                    {student.father_phone && <span className="text-xs text-slate-400">({student.father_phone})</span>}
                  </div>
                )}
                {student.mother_name && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} />
                    <span>{student.mother_name}</span>
                    {student.mother_phone && <span className="text-xs text-slate-400">({student.mother_phone})</span>}
                  </div>
                )}
              </div>
              
              <Button onClick={() => setViewingProfileId(student.id)} variant="outline" className="w-full mt-4 text-sm h-8">
                View Profile
              </Button>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">No students found matching your filters.</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card border border-border/70 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input type="checkbox" className="w-4 h-4 rounded" onChange={toggleSelectAll} checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length} />
                </TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Hebrew Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Parents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id} className={selectedIds.includes(student.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelectStudent(student.id)} className="w-4 h-4 rounded" />
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => setViewingProfileId(student.id)}>
                    {getStudentDisplayName(student)}
                  </TableCell>
                  <TableCell dir="rtl" className="text-slate-600">{student.hebrew_name || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{student.class?.name || '-'}</Badge></TableCell>
                  <TableCell className="text-sm">{student.class?.grade?.name || '-'}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {student.father_name && <div>{student.father_name}</div>}
                    {student.mother_name && <div>{student.mother_name}</div>}
                  </TableCell>
                  <TableCell>
                    {student.open_issues_count > 0 && (
                      <div className="flex items-center text-amber-600 text-xs font-medium">
                        <AlertCircle size={14} className="mr-1"/> {student.open_issues_count} Open
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingProfileId(student.id)}>
                        <CheckSquare size={16}/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}>
                        <Edit size={16}/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">No results found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {filteredStudents.length > PAGE_SIZE && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-card border border-border/70 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>
            <span className="text-sm font-medium text-slate-600 px-2">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedStudent(null); }} student={selectedStudent} onSuccess={loadData} />
      <GradesModal isOpen={isGradesModalOpen} onClose={() => { setIsGradesModalOpen(false); setSelectedStudent(null); }} student={selectedStudent} />
      <ImportStudentsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={loadData} />
      
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date</Label>
              <input 
                type="date" 
                value={attendanceData.date} 
                onChange={(e) => setAttendanceData({...attendanceData, date: e.target.value})} 
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select 
                value={attendanceData.status} 
                onChange={(e) => setAttendanceData({...attendanceData, status: e.target.value})} 
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button>
            <Button onClick={submitAttendance}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsView;
