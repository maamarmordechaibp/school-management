import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckSquare, Upload, Filter, Grid, List, X, GraduationCap, AlertCircle, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import StudentModal from '@/components/modals/StudentModal';
import GradesModal from '@/components/modals/GradesModal';
import ImportStudentsModal from '@/components/modals/ImportStudentsModal';
import StudentProfileView from '@/components/views/StudentProfileView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const StudentsView = ({ role, currentUser }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    class_id: 'all',
    grade_id: 'all',
    hasOpenIssues: 'all'
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
  }, [role, currentUser]);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students with related data
      // Use !inner to specify the class_id foreign key (not previous_class_id)
      let query = supabase
        .from('students')
        .select(`
          *,
          class:classes!class_id(id, name, grade_id, grade:grades(id, name))
        `);
      
      // Role based filtering
      if (role === 'teacher_hebrew' || role === 'teacher_english') {
        // Teachers see students in their assigned class
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .or(`hebrew_teacher_id.eq.${currentUser?.id},english_teacher_id.eq.${currentUser?.id}`);
        
        const classIds = teacherClasses?.map(c => c.id) || [];
        if (classIds.length > 0) {
          query = query.in('class_id', classIds);
        } else {
          setStudents([]);
          setLoading(false);
          return;
        }
      } else if (role === 'tutor') {
        // Tutors see only their assigned students
        const { data: tutorStudents } = await supabase
          .from('tutor_assignments')
          .select('student_id')
          .eq('tutor_id', currentUser?.id)
          .eq('is_active', true);
        
        const studentIds = tutorStudents?.map(ts => ts.student_id) || [];
        if (studentIds.length > 0) {
          query = query.in('id', studentIds);
        } else {
          setStudents([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order('last_name');
      if (error) throw error;
      
      // Try to load issues separately (table may not exist)
      let issuesByStudent = {};
      try {
        const { data: issuesData } = await supabase
          .from('student_issues')
          .select('student_id, status');
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
      
      // Add open issues count
      const studentsWithIssues = (data || []).map(s => ({
        ...s,
        open_issues_count: (issuesByStudent[s.id] || []).filter(i => i.status === 'open' || i.status === 'in_progress').length
      }));
      setStudents(studentsWithIssues);

      // Load classes and grades for filters
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade_id, grade:grades!grade_id(name)')
        .order('name');
      if (classesError) {
        console.error('Error loading classes:', classesError);
      } else {
        setClasses(classesData || []);
      }

      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) {
        console.error('Error loading grades:', gradesError);
      } else {
        setGrades(gradesData || []);
      }

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

    setFilteredStudents(result);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Student deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete student' });
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
    await supabase.from('attendance').insert(inserts);
    toast({ title: 'Success', description: 'Attendance marked' });
    setIsAttendanceModalOpen(false);
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      class_id: 'all',
      grade_id: 'all',
      hasOpenIssues: 'all'
    });
  };

  const getStudentDisplayName = (student) => {
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`;
    }
    return student.first_name || student.last_name || 'Unnamed';
  };

  if (viewingProfileId) {
    return <StudentProfileView studentId={viewingProfileId} onBack={() => setViewingProfileId(null)} />;
  }

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Students</h2>
          <p className="text-slate-600 mt-1">
            {role === 'teacher_hebrew' || role === 'teacher_english' ? 'Students in your classes' : 
             role === 'tutor' ? 'Your assigned students' : 
             `${students.length} students registered`}
          </p>
        </div>
        <div className="flex gap-2">
          {['principal', 'principal_hebrew', 'principal_english', 'admin'].includes(role) && (
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2">
              <Upload size={18} /> Import
            </Button>
          )}
          {['principal', 'principal_hebrew', 'principal_english', 'admin', 'teacher_hebrew', 'teacher_english'].includes(role) && (
            <Button onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }} className="bg-gradient-to-r from-blue-500 to-blue-600">
              <Plus size={20} className="mr-2" /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <Select value={filters.grade_id} onValueChange={(val) => setFilters(prev => ({ ...prev, grade_id: val }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.class_id} onValueChange={(val) => setFilters(prev => ({ ...prev, class_id: val }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.grade?.name})</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.hasOpenIssues} onValueChange={(val) => setFilters(prev => ({ ...prev, hasOpenIssues: val }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Issues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="yes">Has Open Issues</SelectItem>
                <SelectItem value="no">No Open Issues</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters" className="text-slate-500">
              <X size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
         
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-100 animate-in slide-in-from-top-2">
            <span className="text-sm font-medium text-blue-800 ml-2">
              {selectedIds.length} students selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white text-blue-700 hover:bg-blue-50 border-blue-200" onClick={() => setIsAttendanceModalOpen(true)}>
                <CheckSquare size={16} className="mr-2" /> Mark Attendance
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border-2 ${selectedIds.includes(student.id) ? 'border-blue-500 bg-blue-50/10' : 'border-transparent'}`}
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
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {getStudentDisplayName(student)}
                    </h3>
                    {student.hebrew_name && (
                      <p className="text-sm text-slate-500" dir="rtl">{student.hebrew_name}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{student.class?.name || 'No Class'}</Badge>
                      {student.open_issues_count > 0 && (
                        <Badge variant="destructive" className="text-xs">{student.open_issues_count} Issues</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['principal', 'principal_hebrew', 'principal_english', 'admin', 'teacher_hebrew', 'teacher_english'].includes(role) && (
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className={selectedIds.includes(student.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelectStudent(student.id)} className="w-4 h-4 rounded" />
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer hover:text-blue-600" onClick={() => setViewingProfileId(student.id)}>
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
