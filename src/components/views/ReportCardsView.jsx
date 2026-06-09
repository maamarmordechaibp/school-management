import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Reorder, useDragControls } from 'framer-motion';
import {
  Plus, Trash2, Save, Type, List, CheckSquare, Hash, AlignLeft, Star, Gauge,
  Heading, GripVertical, Copy, Pencil, ArrowLeft, ClipboardList, Layers, BookUser,
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'heading', label: 'Section Heading', icon: Heading },
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Comment', icon: AlignLeft },
  { value: 'number', label: 'Number / Score', icon: Hash },
  { value: 'rating', label: 'Rating (1-5)', icon: Star },
  { value: 'scale', label: 'Scale (1-N)', icon: Gauge },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Yes / No', icon: CheckSquare },
];

const fieldIcon = (type) => (FIELD_TYPES.find((t) => t.value === type)?.icon || Type);
const newField = (type = 'text') => ({
  id: crypto.randomUUID(),
  type,
  label: type === 'heading' ? 'New Section' : 'New Field',
  options: type === 'select' ? ['Excellent', 'Good', 'Needs Work'] : [],
  max: type === 'scale' ? 10 : 5,
});

const ReportCardsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState('list'); // 'list' | 'build' | 'grade'
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Builder
  const [draft, setDraft] = useState(null);

  // Grading
  const [gradeTemplate, setGradeTemplate] = useState(null);
  const [gradeClassId, setGradeClassId] = useState('');
  const [gradePeriod, setGradePeriod] = useState('Term 1');
  const [students, setStudents] = useState([]);
  const [entries, setEntries] = useState({}); // student_id -> { id, values, notes, status }
  const [gradeLoading, setGradeLoading] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, clsRes, grdRes] = await Promise.all([
        supabase.from('report_card_templates').select('*, class:classes(id, name)').order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name, grade_id').eq('is_active', true).order('name'),
        supabase.from('grades').select('id, name').order('grade_number'),
      ]);
      setTemplates(tplRes.data || []);
      setClasses(clsRes.data || []);
      setGrades(grdRes.data || []);
    } catch (e) {
      console.error('Error loading report cards:', e);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Builder ----------
  const startNew = () => {
    setDraft({ name: '', description: '', class_id: null, grade_id: null, fields: [], is_active: true });
    setMode('build');
  };

  const editTemplate = (tpl) => {
    setDraft({ ...tpl, fields: (tpl.fields || []).map((f) => ({ options: [], ...f })) });
    setMode('build');
  };

  const duplicateTemplate = (tpl) => {
    setDraft({
      name: `${tpl.name} (Copy)`,
      description: tpl.description || '',
      class_id: null,
      grade_id: tpl.grade_id || null,
      fields: (tpl.fields || []).map((f) => ({ ...f, id: crypto.randomUUID() })),
      is_active: true,
    });
    setMode('build');
    toast({ title: 'Duplicated', description: 'Adjust and assign this template to a class.' });
  };

  const addField = (type) => setDraft((d) => ({ ...d, fields: [...d.fields, newField(type)] }));
  const updateField = (id, key, value) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)) }));
  const removeField = (id) => setDraft((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) }));

  const saveTemplate = async () => {
    if (!draft.name.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Give the template a name.' });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description || null,
      class_id: draft.class_id || null,
      grade_id: draft.grade_id || null,
      fields: draft.fields,
      is_active: true,
      created_by: currentUser?.id || null,
      updated_at: new Date().toISOString(),
    };
    if (draft.id) payload.id = draft.id;
    const { error } = await supabase.from('report_card_templates').upsert(payload);
    if (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'Saved', description: 'Template saved.' });
    setMode('list');
    setDraft(null);
    loadData();
  };

  const deleteTemplate = async (id) => {
    const { error } = await supabase.from('report_card_templates').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      return;
    }
    setDeleteConfirmId(null);
    toast({ title: 'Deleted' });
    loadData();
  };

  // ---------- Grading ----------
  const startGrading = (tpl) => {
    setGradeTemplate(tpl);
    setGradeClassId(tpl.class_id || '');
    setGradePeriod('Term 1');
    setStudents([]);
    setEntries({});
    setActiveStudentId(null);
    setMode('grade');
    if (tpl.class_id) loadGradingData(tpl, tpl.class_id, 'Term 1');
  };

  const loadGradingData = async (tpl, classId, period) => {
    if (!classId) return;
    setGradeLoading(true);
    try {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class:classes!class_id(name)')
        .eq('class_id', classId)
        .order('last_name');
      const list = studentsData || [];
      setStudents(list);
      setActiveStudentId(list[0]?.id || null);

      const { data: entryData } = await supabase
        .from('report_card_entries')
        .select('*')
        .eq('template_id', tpl.id)
        .eq('period', period)
        .in('student_id', list.map((s) => s.id).length ? list.map((s) => s.id) : ['00000000-0000-0000-0000-000000000000']);

      const map = {};
      (entryData || []).forEach((e) => {
        map[e.student_id] = { id: e.id, values: e.values || {}, notes: e.notes || '', status: e.status };
      });
      setEntries(map);
    } catch (e) {
      console.error('Error loading grading data:', e);
    } finally {
      setGradeLoading(false);
    }
  };

  const setEntryValue = (studentId, fieldId, value) =>
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { values: {}, notes: '', status: 'draft' }),
        values: { ...(prev[studentId]?.values || {}), [fieldId]: value },
      },
    }));

  const setEntryNotes = (studentId, notes) =>
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { values: {}, status: 'draft' }), notes },
    }));

  const saveAllGrades = async (status = 'draft') => {
    if (!gradeTemplate || !gradeClassId) return;
    const rows = students
      .filter((s) => entries[s.id])
      .map((s) => ({
        ...(entries[s.id].id ? { id: entries[s.id].id } : {}),
        template_id: gradeTemplate.id,
        student_id: s.id,
        class_id: gradeClassId,
        period: gradePeriod,
        values: entries[s.id].values || {},
        notes: entries[s.id].notes || null,
        status,
        created_by: currentUser?.id || null,
        updated_at: new Date().toISOString(),
      }));
    if (!rows.length) {
      toast({ title: 'Nothing to save', description: 'Enter at least one mark first.' });
      return;
    }
    const { error } = await supabase
      .from('report_card_entries')
      .upsert(rows, { onConflict: 'template_id,student_id,period' });
    if (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'Saved', description: `${rows.length} report card${rows.length > 1 ? 's' : ''} ${status === 'final' ? 'finalized' : 'saved'}.` });
    loadGradingData(gradeTemplate, gradeClassId, gradePeriod);
  };

  const studentName = (s) => `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.hebrew_name || 'Student';
  const gradableFields = useMemo(
    () => (gradeTemplate?.fields || []).filter((f) => f.type !== 'heading'),
    [gradeTemplate]
  );
  const gradedCount = (studentId) => {
    const v = entries[studentId]?.values || {};
    return gradableFields.filter((f) => v[f.id] !== undefined && v[f.id] !== '' && v[f.id] !== null).length;
  };

  // ====================================================
  // RENDER: LIST
  // ====================================================
  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading report cards…</div>;
  }

  if (mode === 'list') {
    const general = templates.filter((t) => !t.class_id);
    const assigned = templates.filter((t) => t.class_id);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Report Cards</h2>
            <p className="text-muted-foreground mt-1">Build report-card templates and grade students with their teacher.</p>
          </div>
          <Button onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Template</Button>
        </div>

        <TemplateSection
          title="General Templates"
          subtitle="Reusable across any class"
          icon={Layers}
          templates={general}
          classes={classes}
          onEdit={editTemplate}
          onDuplicate={duplicateTemplate}
          onGrade={startGrading}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          onDelete={deleteTemplate}
        />

        <TemplateSection
          title="Class Templates"
          subtitle="Assigned to a specific class"
          icon={BookUser}
          templates={assigned}
          classes={classes}
          onEdit={editTemplate}
          onDuplicate={duplicateTemplate}
          onGrade={startGrading}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          onDelete={deleteTemplate}
        />
      </div>
    );
  }

  // ====================================================
  // RENDER: BUILDER
  // ====================================================
  if (mode === 'build' && draft) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => { setMode('list'); setDraft(null); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={saveTemplate}><Save className="mr-2 h-4 w-4" /> Save Template</Button>
        </div>

        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Template Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g., Mid-Year Report Card" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label>Assign to Class</Label>
              <Select value={draft.class_id || 'none'} onValueChange={(v) => setDraft({ ...draft, class_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="General (no class)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (any class)</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade (optional)</Label>
              <Select value={draft.grade_id || 'none'} onValueChange={(v) => setDraft({ ...draft, grade_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Any grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any grade</SelectItem>
                  {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Fields</h3>
            <span className="text-sm text-muted-foreground">Drag <GripVertical className="inline h-4 w-4" /> to reorder</span>
          </div>

          {draft.fields.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/40 rounded-xl border-2 border-dashed">
              No fields yet. Add one below to start building.
            </div>
          ) : (
            <Reorder.Group axis="y" values={draft.fields} onReorder={(v) => setDraft({ ...draft, fields: v })} className="space-y-3">
              {draft.fields.map((field) => (
                <FieldEditor key={field.id} field={field} onChange={updateField} onRemove={removeField} />
              ))}
            </Reorder.Group>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground">Add a field</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FIELD_TYPES.map((t) => (
                <Button key={t.value} variant="outline" size="sm" onClick={() => addField(t.value)}>
                  <t.icon className="mr-1.5 h-4 w-4" /> {t.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====================================================
  // RENDER: GRADING
  // ====================================================
  if (mode === 'grade' && gradeTemplate) {
    const activeStudent = students.find((s) => s.id === activeStudentId);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => { setMode('list'); setGradeTemplate(null); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveAllGrades('draft')}><Save className="mr-2 h-4 w-4" /> Save Draft</Button>
            <Button onClick={() => saveAllGrades('final')}>Finalize</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Template</Label>
              <div className="font-semibold mt-1">{gradeTemplate.name}</div>
              <div className="text-xs text-muted-foreground">{gradableFields.length} fields</div>
            </div>
            <div>
              <Label>Class</Label>
              <Select
                value={gradeClassId || ''}
                onValueChange={(v) => { setGradeClassId(v); loadGradingData(gradeTemplate, v, gradePeriod); }}
                disabled={!!gradeTemplate.class_id}
              >
                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grading Period</Label>
              <Input
                value={gradePeriod}
                onChange={(e) => setGradePeriod(e.target.value)}
                onBlur={() => gradeClassId && loadGradingData(gradeTemplate, gradeClassId, gradePeriod)}
                placeholder="e.g., Term 1"
              />
            </div>
          </CardContent>
        </Card>

        {!gradeClassId ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/40 rounded-xl border-2 border-dashed">
            Select a class to start grading.
          </div>
        ) : gradeLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/40 rounded-xl border-2 border-dashed">
            No students found in this class.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Roster */}
            <Card className="h-fit">
              <CardHeader><CardTitle className="text-base">Students ({students.length})</CardTitle></CardHeader>
              <CardContent className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
                {students.map((s) => {
                  const done = gradedCount(s.id);
                  const isFinal = entries[s.id]?.status === 'final';
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveStudentId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                        activeStudentId === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="truncate text-sm">{studentName(s)}</span>
                      {isFinal ? (
                        <Badge variant="success" className="shrink-0">Final</Badge>
                      ) : done > 0 ? (
                        <span className={`text-xs shrink-0 ${activeStudentId === s.id ? 'opacity-90' : 'text-muted-foreground'}`}>{done}/{gradableFields.length}</span>
                      ) : null}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Active student form */}
            {activeStudent && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{studentName(activeStudent)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{activeStudent.class?.name} · {gradePeriod}</p>
                  </div>
                  <div className="flex gap-2">
                    {students.findIndex((s) => s.id === activeStudentId) > 0 && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const i = students.findIndex((s) => s.id === activeStudentId);
                        setActiveStudentId(students[i - 1].id);
                      }}>Prev</Button>
                    )}
                    {students.findIndex((s) => s.id === activeStudentId) < students.length - 1 && (
                      <Button size="sm" onClick={() => {
                        const i = students.findIndex((s) => s.id === activeStudentId);
                        setActiveStudentId(students[i + 1].id);
                      }}>Next</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {gradeTemplate.fields.map((field) => (
                    <GradeField
                      key={field.id}
                      field={field}
                      value={entries[activeStudentId]?.values?.[field.id]}
                      onChange={(v) => setEntryValue(activeStudentId, field.id, v)}
                    />
                  ))}
                  <div>
                    <Label>Overall Notes</Label>
                    <Textarea
                      value={entries[activeStudentId]?.notes || ''}
                      onChange={(e) => setEntryNotes(activeStudentId, e.target.value)}
                      placeholder="Optional summary for this student…"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

// ---------- Template list section ----------
const TemplateSection = ({ title, subtitle, icon: Icon, templates, onEdit, onDuplicate, onGrade, deleteConfirmId, setDeleteConfirmId, onDelete }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="text-sm text-muted-foreground">· {subtitle}</span>
    </div>
    {templates.length === 0 ? (
      <div className="text-sm text-muted-foreground bg-muted/40 rounded-xl border-2 border-dashed px-4 py-6 text-center">
        No {title.toLowerCase()} yet.
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{tpl.name}</CardTitle>
                {tpl.class?.name && <Badge variant="secondary" className="shrink-0">{tpl.class.name}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{tpl.description || `${tpl.fields?.length || 0} fields`}</p>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground">{tpl.fields?.length || 0} fields configured</p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onGrade(tpl)}><ClipboardList className="mr-1.5 h-4 w-4" /> Grade</Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(tpl)}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => onDuplicate(tpl)} title="Use as template for another class"><Copy className="h-4 w-4" /></Button>
              {deleteConfirmId === tpl.id ? (
                <span className="flex gap-1">
                  <Button size="sm" variant="destructive" onClick={() => onDelete(tpl.id)}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                </span>
              ) : (
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirmId(tpl.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    )}
  </div>
);

// ---------- Draggable field editor ----------
const FieldEditor = ({ field, onChange, onRemove }) => {
  const controls = useDragControls();
  const Icon = fieldIcon(field.type);
  const isHeading = field.type === 'heading';
  return (
    <Reorder.Item value={field} dragListener={false} dragControls={controls} className="list-none">
      <Card className={isHeading ? 'bg-muted/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onPointerDown={(e) => controls.start(e)}
              className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <Label className="text-xs flex items-center gap-1"><Icon className="h-3 w-3" /> {isHeading ? 'Section title' : 'Field label'}</Label>
                <Input value={field.label} onChange={(e) => onChange(field.id, 'label', e.target.value)} />
              </div>
              {!isHeading && (
                <div className="md:col-span-4">
                  <Label className="text-xs">Type</Label>
                  <Select value={field.type} onValueChange={(v) => onChange(field.id, 'type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.filter((t) => t.value !== 'heading').map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2"><t.icon className="h-3.5 w-3.5" /> {t.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="md:col-span-2 flex items-end justify-end">
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => onRemove(field.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {field.type === 'select' && (
                <div className="md:col-span-12">
                  <Label className="text-xs text-muted-foreground">Options (comma separated)</Label>
                  <Input
                    value={(field.options || []).join(', ')}
                    onChange={(e) => onChange(field.id, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="Excellent, Good, Needs Work"
                  />
                </div>
              )}
              {field.type === 'scale' && (
                <div className="md:col-span-4">
                  <Label className="text-xs text-muted-foreground">Max value</Label>
                  <Input type="number" min={2} max={100} value={field.max || 10} onChange={(e) => onChange(field.id, 'max', parseInt(e.target.value, 10) || 10)} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Reorder.Item>
  );
};

// ---------- Grading input per field ----------
const GradeField = ({ field, value, onChange }) => {
  if (field.type === 'heading') {
    return <div className="pt-2 border-b font-semibold text-primary">{field.label}</div>;
  }
  return (
    <div>
      <Label className="mb-1 block">{field.label}</Label>
      {field.type === 'text' && <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />}
      {field.type === 'textarea' && <Textarea rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)} />}
      {field.type === 'number' && <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="max-w-[160px]" />}
      {field.type === 'checkbox' && (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={value === true ? 'default' : 'outline'} onClick={() => onChange(true)}>Yes</Button>
          <Button type="button" size="sm" variant={value === false ? 'default' : 'outline'} onClick={() => onChange(false)}>No</Button>
        </div>
      )}
      {field.type === 'select' && (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {(field.options || []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {(field.type === 'rating' || field.type === 'scale') && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: field.type === 'rating' ? 5 : (field.max || 10) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? null : n)}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                value === n ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportCardsView;
