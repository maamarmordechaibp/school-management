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
import StudentProfileView from '@/components/views/StudentProfileView';
import {
  Users, Plus, Edit, FileText, School, MessageSquare, Mail,
  Calendar, Search, ChevronRight, Loader2, ArrowRight
} from 'lucide-react';

const NOTE_TYPES = [
  { value: 'general', label: 'כללי' },
  { value: 'teacher_meeting', label: 'געזעסן מיט מלמד' },
  { value: 'discipline', label: 'דיסציפלין' },
  { value: 'academic', label: 'לערנען' },
  { value: 'behavioral', label: 'אויפפירונג' },
  { value: 'parent_feedback', label: 'פידבעק פון עלטערן' },
  { value: 'other', label: 'אנדערע' },
];

const ClassDetailView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [classNotes, setClassNotes] = useState([]);
  const [studentNotes, setStudentNotes] = useState({});
  const [viewingProfileId, setViewingProfileId] = useState(null);
  
  // Modals
  const [isClassNoteModalOpen, setIsClassNoteModalOpen] = useState(false);
  const [isStudentNoteModalOpen, setIsStudentNoteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  
  // Note form
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: '', content: '', note_type: 'general', edit_mode: 'update'
  });
  const [classNoteForm, setClassNoteForm] = useState({
    title: '', content: '', edit_mode: 'update'
  });
  const [editingNote, setEditingNote] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassData(selectedClass.id);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('classes')
        .select(`
          *,
          grade:grades(id, name, grade_number),
          hebrew_staff:staff_members!hebrew_staff_id(id, first_name, last_name, hebrew_name),
          english_staff:staff_members!english_staff_id(id, first_name, last_name),
          students:students!class_id(id)
        `)
        .eq('is_active', true)
        .order('name');
      setClasses((data || []).map(c => ({ ...c, student_count: c.students?.length || 0 })));
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async (classId) => {
    try {
      // Load students in class
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          *,
          class:classes!class_id(name, grade:grades(name))
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('last_name');
      setStudents(studentsData || []);

      // Load class notes
      const { data: notesData } = await supabase
        .from('class_notes')
        .select('*')
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setClassNotes(notesData || []);

      // Load student notes for all students in class
      const studentIds = (studentsData || []).map(s => s.id);
      if (studentIds.length > 0) {
        const { data: sNotesData } = await supabase
          .from('student_notes')
          .select('*')
          .in('student_id', studentIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100);
        
        // Group by student
        const notesByStudent = {};
        (sNotesData || []).forEach(note => {
          if (!notesByStudent[note.student_id]) notesByStudent[note.student_id] = [];
          notesByStudent[note.student_id].push(note);
        });
        setStudentNotes(notesByStudent);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    }
  };

  // Save class note
  const handleSaveClassNote = async () => {
    if (!classNoteForm.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'ביטע שרייב אינהאלט' });
      return;
    }
    try {
      if (editingNote && classNoteForm.edit_mode === 'edit') {
        // EDIT mode: replace content, save old to previous_content
        const { error } = await supabase.from('class_notes').update({
          title: classNoteForm.title,
          content: classNoteForm.content,
          previous_content: editingNote.content,
          edit_mode: 'edit',
          updated_at: new Date().toISOString()
        }).eq('id', editingNote.id);
        if (error) throw error;
        toast({ title: 'עדיטעד', description: 'נאטיץ איז געטוישט געווארן' });
      } else {
        // UPDATE mode: add new note
        const { error } = await supabase.from('class_notes').insert([{
          class_id: selectedClass.id,
          title: classNoteForm.title || null,
          content: classNoteForm.content,
          edit_mode: 'update',
          created_by: currentUser?.id,
          created_by_name: currentUser?.name || currentUser?.first_name
        }]);
        if (error) throw error;
        toast({ title: 'צוגעלייגט', description: 'נאטיץ איז צוגעלייגט געווארן' });
      }
      setIsClassNoteModalOpen(false);
      setEditingNote(null);
      loadClassData(selectedClass.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Save student note
  const handleSaveStudentNote = async () => {
    if (!noteForm.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'ביטע שרייב אינהאלט' });
      return;
    }
    try {
      if (editingNote && noteForm.edit_mode === 'edit') {
        // EDIT mode
        const { error } = await supabase.from('student_notes').update({
          title: noteForm.title,
          content: noteForm.content,
          note_type: noteForm.note_type,
          previous_content: editingNote.content,
          edit_mode: 'edit',
          updated_at: new Date().toISOString()
        }).eq('id', editingNote.id);
        if (error) throw error;
        toast({ title: 'עדיטעד', description: 'נאטיץ איז געטוישט געווארן (פריערדיגע איז געבליבן אלס רעקארד)' });
      } else {
        // UPDATE mode
        const { error } = await supabase.from('student_notes').insert([{
          student_id: selectedStudent.id,
          title: noteForm.title || null,
          content: noteForm.content,
          note_type: noteForm.note_type,
          edit_mode: 'update',
          created_by: currentUser?.id,
          created_by_name: currentUser?.name || currentUser?.first_name
        }]);
        if (error) throw error;
        toast({ title: 'צוגעלייגט', description: 'נאטיץ איז צוגעלייגט געווארן ביי דעם קינד' });
      }
      setIsStudentNoteModalOpen(false);
      setEditingNote(null);
      loadClassData(selectedClass.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Filter students by search
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.hebrew_name?.includes(searchQuery) ||
      s.father_name?.toLowerCase().includes(q);
  });

  if (viewingProfileId) {
    return <StudentProfileView studentId={viewingProfileId} onBack={() => setViewingProfileId(null)} />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  // Class selection screen
  if (!selectedClass) {
    return (
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">קלאסן - דעטאל וויו</h1>
          <p className="text-slate-500">עפן א קלאס צו זען אלע תלמידים מיט אלע אינפארמאציע און קענען אריינפילן</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-200"
              onClick={() => setSelectedClass(cls)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-slate-800">{cls.name}</h3>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <Badge variant="outline" className="mb-3">{cls.grade?.name}</Badge>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>תלמידים:</span>
                    <Badge variant="secondary">{cls.student_count}</Badge>
                  </div>
                  {cls.hebrew_staff && (
                    <div className="flex justify-between">
                      <span>מלמד:</span>
                      <span>{cls.hebrew_staff.hebrew_name || `${cls.hebrew_staff.first_name} ${cls.hebrew_staff.last_name}`}</span>
                    </div>
                  )}
                  {cls.english_staff && (
                    <div className="flex justify-between">
                      <span>ענגליש:</span>
                      <span>{cls.english_staff.first_name} {cls.english_staff.last_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Class detail view
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedClass(null)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">כיתה {selectedClass.name}</h1>
            <p className="text-slate-500">
              {selectedClass.grade?.name} | {students.length} תלמידים
              {selectedClass.hebrew_staff && ` | מלמד: ${selectedClass.hebrew_staff.hebrew_name || selectedClass.hebrew_staff.first_name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setEditingNote(null);
            setClassNoteForm({ title: '', content: '', edit_mode: 'update' });
            setIsClassNoteModalOpen(true);
          }}>
            <FileText className="h-4 w-4 ml-2" /> נאטיץ פאר קלאס
          </Button>
          <Button variant="outline" onClick={() => {
            setEmailContext({
              subject: `כיתה ${selectedClass.name} - אפדעיט`,
              body: `אפדעיט וועגן כיתה ${selectedClass.name}\n\n`
            });
            setIsEmailModalOpen(true);
          }}>
            <Mail className="h-4 w-4 ml-2" /> שיק אימעיל
          </Button>
        </div>
      </div>

      {/* Class Notes */}
      {classNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              נאטיצן פון קלאס ({classNotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {classNotes.map(note => (
                <div key={note.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      {note.title && <span className="font-bold">{note.title}</span>}
                      {note.edit_mode === 'edit' && <Badge className="bg-orange-100 text-orange-800 text-xs">עדיטעד</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleDateString('he-IL')}</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingNote(note);
                        setClassNoteForm({ title: note.title || '', content: note.content, edit_mode: 'edit' });
                        setIsClassNoteModalOpen(true);
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-700">{note.content}</p>
                  {note.previous_content && (
                    <details className="mt-2">
                      <summary className="text-xs text-orange-600 cursor-pointer">פריערדיגע ווערזיע</summary>
                      <p className="text-xs text-slate-400 mt-1 p-2 bg-white rounded">{note.previous_content}</p>
                    </details>
                  )}
                  {note.created_by_name && <p className="text-xs text-slate-400 mt-1">דורך: {note.created_by_name}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="זוך תלמיד אין קלאס..." className="pr-10" />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStudents.map(student => (
          <Card key={student.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4">
              {/* Student Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="cursor-pointer" onClick={() => setViewingProfileId(student.id)}>
                  <h3 className="font-bold text-lg text-slate-800 hover:text-blue-600 transition-colors">
                    {student.hebrew_name || `${student.first_name} ${student.last_name}`}
                  </h3>
                  {student.hebrew_name && (
                    <p className="text-sm text-slate-500">{student.first_name} {student.last_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedStudent(student);
                    setEditingNote(null);
                    setNoteForm({ title: '', content: '', note_type: 'general', edit_mode: 'update' });
                    setIsStudentNoteModalOpen(true);
                  }} title="צולייגן נאטיץ">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEmailContext({
                      subject: `וועגן ${student.hebrew_name || student.first_name} ${student.last_name}`,
                      body: `אינפארמאציע וועגן ${student.hebrew_name || student.first_name} ${student.last_name}\nכיתה: ${selectedClass.name}\n\n`
                    });
                    setIsEmailModalOpen(true);
                  }} title="שיק אימעיל">
                    <Mail className="h-4 w-4 text-green-600" />
                  </Button>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 mb-3">
                {student.father_name && (
                  <div><span className="font-medium">טאטע:</span> {student.father_name}</div>
                )}
                {student.father_phone && (
                  <div><span className="font-medium">טעל:</span> <a href={`tel:${student.father_phone}`} className="text-blue-600">{student.father_phone}</a></div>
                )}
                {student.mother_name && (
                  <div><span className="font-medium">מאמע:</span> {student.mother_name}</div>
                )}
                {student.mother_phone && (
                  <div><span className="font-medium">טעל:</span> <a href={`tel:${student.mother_phone}`} className="text-blue-600">{student.mother_phone}</a></div>
                )}
                {student.address && (
                  <div className="col-span-2"><span className="font-medium">אדרעס:</span> {student.address}</div>
                )}
                {student.date_of_birth && (
                  <div><span className="font-medium">געבורטסטאג:</span> {new Date(student.date_of_birth).toLocaleDateString('he-IL')}</div>
                )}
                {student.emergency_contact && (
                  <div><span className="font-medium">נויטפאל:</span> {student.emergency_contact} {student.emergency_phone}</div>
                )}
              </div>

              {/* Notes */}
              {student.notes && (
                <div className="p-2 bg-yellow-50 rounded text-sm text-yellow-800 mb-2">
                  {student.notes}
                </div>
              )}

              {/* Student Notes (communication log) */}
              {studentNotes[student.id] && studentNotes[student.id].length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    נאטיצן ({studentNotes[student.id].length}):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {studentNotes[student.id].slice(0, 3).map(note => (
                      <div key={note.id} className="p-2 bg-slate-50 rounded text-xs border">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0">
                              {NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type}
                            </Badge>
                            {note.title && <span className="font-medium">{note.title}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">{new Date(note.created_at).toLocaleDateString('he-IL')}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => {
                              setSelectedStudent(student);
                              setEditingNote(note);
                              setNoteForm({
                                title: note.title || '',
                                content: note.content,
                                note_type: note.note_type,
                                edit_mode: 'edit'
                              });
                              setIsStudentNoteModalOpen(true);
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-600 mt-1">{note.content}</p>
                      </div>
                    ))}
                    {studentNotes[student.id].length > 3 && (
                      <p className="text-xs text-blue-600 cursor-pointer" onClick={() => setViewingProfileId(student.id)}>
                        + {studentNotes[student.id].length - 3} מער נאטיצן...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>קיין תלמידים נישט געפונען אין דעם קלאס</p>
        </div>
      )}

      {/* Class Note Modal */}
      <Dialog open={isClassNoteModalOpen} onOpenChange={setIsClassNoteModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'עדיט קלאס נאטיץ' : 'נייע נאטיץ פאר כיתה ' + selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editingNote && (
              <div>
                <Label>מאָדע</Label>
                <Select value={classNoteForm.edit_mode} onValueChange={(v) => setClassNoteForm({ ...classNoteForm, edit_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">UPDATE - לאז פריערדיגע, לייג צו נייע</SelectItem>
                    <SelectItem value="edit">EDIT - טוישט וואס עס שטייט (האלט רעקארד)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>טיטל (אפציאנאל)</Label>
              <Input value={classNoteForm.title} onChange={(e) => setClassNoteForm({ ...classNoteForm, title: e.target.value })} placeholder="קורצע באשרייבונג" />
            </div>
            <div>
              <Label>אינהאלט *</Label>
              <Textarea value={classNoteForm.content} onChange={(e) => setClassNoteForm({ ...classNoteForm, content: e.target.value })} rows={5} placeholder="שרייבט דא..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassNoteModalOpen(false)}>בטל</Button>
            <Button onClick={handleSaveClassNote}>
              {editingNote && classNoteForm.edit_mode === 'edit' ? 'EDIT - טוישן' : 'UPDATE - צולייגן'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Note Modal */}
      <Dialog open={isStudentNoteModalOpen} onOpenChange={setIsStudentNoteModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'עדיט נאטיץ' : 'נייע נאטיץ'} - {selectedStudent?.hebrew_name || selectedStudent?.first_name}
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
              <Label>אינהאלט * (יעדע מאל וואס מ'רעדט מיט/וועגן דעם קינד)</Label>
              <Textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} rows={5} placeholder="וואס איז גערעדט געווארן..." />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setEmailContext({
                subject: `נאטיץ - ${selectedStudent?.hebrew_name || selectedStudent?.first_name}`,
                body: `${noteForm.title ? noteForm.title + '\n\n' : ''}${noteForm.content}`
              });
              setIsEmailModalOpen(true);
            }}>
              <Mail className="h-4 w-4 ml-1" /> שיק אימעיל
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsStudentNoteModalOpen(false)}>בטל</Button>
              <Button onClick={handleSaveStudentNote}>
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
        currentUser={currentUser}
      />
    </div>
  );
};

export default ClassDetailView;
