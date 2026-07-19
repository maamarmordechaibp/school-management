import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Check, ArrowRight, FileText, MessageSquare, Award } from 'lucide-react';
import { useStudentNotify } from '@/hooks/useStudentNotify';
import { GRADE_SCALE, gradeSolidClass } from '@/lib/gradeColors';
import { printCertificate } from '@/lib/certificateTemplate';

const OVERALL_RATINGS = [
  { value: 'strong', label: 'Strong', he: 'חזק', cls: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'mixed', label: 'Mixed', he: 'מעורב', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'needs_reinforcement', label: 'Needs reinforcement', he: 'דארף חיזוק', cls: 'bg-red-100 text-red-800 border-red-300' },
];
const LEARNING_CRITERIA = [
  { key: 'understanding', label: 'Understanding', he: 'הבנה' },
  { key: 'listening', label: 'Listening', he: 'הקשבה' },
  { key: 'diligence', label: 'Diligence', he: 'התמדה' },
  { key: 'excellence', label: 'Excellence', he: 'הצטיינות' },
  { key: 'participation', label: 'Participation', he: 'השתתפות' },
  { key: 'review', label: 'Review', he: 'חזרה' },
  { key: 'writing', label: 'Writing', he: 'כתיבה' },
  { key: 'hebrew_reading', label: 'Hebrew reading', he: 'קריאה' },
];
const MIDOS_CRITERIA = [
  { key: 'classroom_behavior', label: 'Classroom behavior', he: 'התנהגות בכיתה' },
  { key: 'derech_eretz', label: 'Derech eretz', he: 'דרך ארץ' },
  { key: 'sociability', label: 'Sociability', he: 'חברות' },
  { key: 'joy', label: 'Joy', he: 'שמחה' },
];

const StandardHebrewForm = ({ formData, handleChange }) => (
  <div className="border border-slate-800 rounded-sm mb-6">
     {/* Row 1: Limud */}
     <div className="grid grid-cols-12 border-b border-slate-300 min-h-[80px]">
        <div className="col-span-10 p-2">
          <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="Remarks..."
            value={formData.limud_learning || ''}
            onChange={(e) => handleChange('limud_learning', e.target.value)}
          />
        </div>
        <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Learning
        </div>
     </div>

     {/* Row 2: Ivrit */}
     <div className="grid grid-cols-12 border-b border-slate-300 min-h-[80px]">
        <div className="col-span-10 p-2">
          <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="Remarks..."
            value={formData.ivri_language || ''}
            onChange={(e) => handleChange('ivri_language', e.target.value)}
          />
        </div>
        <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Hebrew
        </div>
     </div>

     {/* Row 3: Behavior */}
     <div className="grid grid-cols-12 border-b border-slate-300 min-h-[80px]">
        <div className="col-span-10 p-2">
           <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="Remarks..."
            value={formData.hitnahagut_behavior || ''}
            onChange={(e) => handleChange('hitnahagut_behavior', e.target.value)}
          />
        </div>
        <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Behavior
        </div>
     </div>

     {/* Row 4: Emotional */}
     <div className="grid grid-cols-12 border-b border-slate-300 min-h-[80px]">
        <div className="col-span-10 p-2">
           <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="Remarks..."
            value={formData.emotional || ''}
            onChange={(e) => handleChange('emotional', e.target.value)}
          />
        </div>
        <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Emotional
        </div>
     </div>

     {/* Row 5: Social */}
     <div className="grid grid-cols-12 border-b border-slate-300 min-h-[80px]">
         <div className="col-span-10 p-2">
           <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="Remarks..."
            value={formData.social || ''}
            onChange={(e) => handleChange('social', e.target.value)}
          />
         </div>
         <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Social
         </div>
     </div>

     {/* Row 6: Remarks */}
     <div className="grid grid-cols-12 min-h-[80px]">
         <div className="col-span-10 p-2">
           <textarea 
            dir="auto"
            className="w-full h-full resize-none bg-transparent outline-none text-right"
            placeholder="General notes..."
            value={formData.remarks || ''}
            onChange={(e) => handleChange('remarks', e.target.value)}
          />
         </div>
         <div className="col-span-2 bg-slate-100 p-2 flex items-center justify-end font-bold border-l border-slate-300">
           Notes / Other
         </div>
     </div>

    {/* Summary Section */}
    <div className="my-6" dir="auto">
      <h3 className="text-center font-bold mb-2 border-b-2 border-slate-800 pb-1 w-full">Summary of the Situation</h3>
      <textarea 
        className="w-full p-2 border border-slate-300 rounded min-h-[100px]"
        placeholder="Summary of the situation..."
        value={formData.summary || ''}
        onChange={(e) => handleChange('summary', e.target.value)}
      />
    </div>

    {/* Plan Section */}
    <div className="mb-8" dir="auto">
      <h3 className="text-center font-bold mb-2 border-b-2 border-slate-800 pb-1 w-full">Plan</h3>
      <textarea 
        className="w-full p-2 border border-slate-300 rounded min-h-[100px]"
        placeholder="Action plan..."
        value={formData.plan || ''}
        onChange={(e) => handleChange('plan', e.target.value)}
      />
    </div>
  </div>
);

const CustomTemplateForm = ({ schema, customData, onChange }) => {
  return (
    <div className="space-y-6 mb-8">
      {schema.map(field => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          
          {field.type === 'text' && (
            <Input 
              value={customData[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="Your answer..."
            />
          )}

          {field.type === 'number' && (
            <Input 
              type="number"
              value={customData[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="0"
            />
          )}

          {field.type === 'date' && (
            <Input 
              type="date"
              value={customData[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
            />
          )}
          
          {field.type === 'textarea' && (
            <textarea 
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              rows={4}
              value={customData[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'select' && (
            <Select 
              value={customData[field.id] || ''}
              onValueChange={(val) => onChange(field.id, val)}
            >
               <SelectTrigger>
                 <SelectValue placeholder="Select an option" />
               </SelectTrigger>
               <SelectContent>
                 {field.options?.map((opt, i) => (
                   <SelectItem key={i} value={opt}>{opt}</SelectItem>
                 ))}
               </SelectContent>
            </Select>
          )}

          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input 
                 type="checkbox"
                 className="w-4 h-4 rounded border-slate-300"
                 checked={!!customData[field.id]}
                 onChange={(e) => onChange(field.id, e.target.checked)}
              />
              <span className="text-sm text-slate-600">Yes</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AssessmentForm = ({ student, assessment = null, onSave, onCancel, currentUser }) => {
  const { toast } = useToast();
  const { notify, notifyElement } = useStudentNotify(currentUser);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  const [formData, setFormData] = useState({
    teacher_name: '',
    date: new Date().toISOString().split('T')[0],
    limud_learning: '',
    ivri_language: '',
    hitnahagut_behavior: '',
    emotional: '',
    social: '',
    remarks: '',
    summary: '',
    plan: '',
    status: 'draft',
    custom_data: {}
  });

  useEffect(() => {
    fetchTemplates();
    
    if (assessment) {
      setFormData(assessment);
      if (assessment.template_id) {
        setSelectedTemplateId(assessment.template_id);
      }
    } else if (student) {
      setFormData(prev => ({
        ...prev,
        teacher_name: student.teacher || ''
      }));
    }
  }, [student, assessment]);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('assessment_templates').select('*');
    setTemplates(data || []);
  };

  useEffect(() => {
    if (assessment?.id) loadNotes();
  }, [assessment?.id]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('assessment_notes')
      .select('*')
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: true });
    setNotes(data || []);
  };

  const addNote = async () => {
    if (!newNote.trim() || !assessment?.id) return;
    setSavingNote(true);
    try {
      const { error } = await supabase.from('assessment_notes').insert([{
        assessment_id: assessment.id,
        note: newNote.trim(),
        author_id: currentUser?.id || null,
        author_name: currentUser?.name || currentUser?.first_name || currentUser?.email || 'Unknown',
      }]);
      if (error) throw error;
      setNewNote('');
      loadNotes();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to add note' });
    } finally {
      setSavingNote(false);
    }
  };

  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'standard') {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(tmpl);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomDataChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        [fieldId]: value
      }
    }));
  };

  // Evaluation criteria live under custom_data.evaluation so they never clash
  // with a custom template's own fields.
  const evaluation = formData.custom_data?.evaluation || {};
  const setEvaluation = (patch) => {
    setFormData(prev => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        evaluation: { ...(prev.custom_data?.evaluation || {}), ...patch },
      },
    }));
  };
  const setCriterion = (group, key, value) => {
    const cur = evaluation[group] || {};
    setEvaluation({ [group]: { ...cur, [key]: cur[key] === value ? undefined : value } });
  };

  const handleGenerateCertificate = () => {
    const rating = OVERALL_RATINGS.find((r) => r.value === evaluation.overall_rating);
    printCertificate(student, {
      title: 'תעודת הצטיינות',
      bodyText: evaluation.strengths || formData.summary || undefined,
      ratingLabel: rating ? rating.he : '',
      signatureName: currentUser?.name || '',
    });
  };

  const handleSubmit = async (status) => {
    if (!student?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing student.' });
      return;
    }
    const dataToSave = {
      teacher_name: formData.teacher_name || null,
      date: formData.date || null,
      // also write the legacy assessment_date column so old reports keep working
      assessment_date: formData.date || null,
      limud_learning: formData.limud_learning || null,
      ivri_language: formData.ivri_language || null,
      hitnahagut_behavior: formData.hitnahagut_behavior || null,
      emotional: formData.emotional || null,
      social: formData.social || null,
      remarks: formData.remarks || null,
      summary: formData.summary || null,
      plan: formData.plan || null,
      custom_data: formData.custom_data || {},
      status,
      student_id: student.id,
      template_id: selectedTemplateId === 'standard' ? null : selectedTemplateId
    };

    let result;
    if (assessment?.id) {
      result = await supabase
        .from('assessments')
        .update(dataToSave)
        .eq('id', assessment.id);
    } else {
      result = await supabase
        .from('assessments')
        .insert([{
          ...dataToSave,
          created_by: currentUser?.id || null,
          created_by_name: currentUser?.name || currentUser?.first_name || currentUser?.email || null,
        }]);
    }

    if (result.error) {
      console.error('Assessment save error:', result.error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error.message || 'Failed to save assessment'
      });
    } else {
      toast({
        title: status === 'final' ? 'Assessment Finalized' : 'Draft Saved',
        description: `Assessment for ${student.name} has been saved.`
      });

      if (onSave) onSave();
      notify({
        studentId: student.id,
        studentName: student.name,
        action: assessment?.id ? 'updated' : 'created',
        recordType: 'Assessment',
        title: selectedTemplate ? selectedTemplate.name : 'Standard Assessment',
        details:
          (formData.summary ? `Summary: ${formData.summary}\n` : '') +
          (formData.plan ? `Plan: ${formData.plan}` : '') +
          `Status: ${status}`,
        relatedType: 'assessment',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm max-w-4xl mx-auto p-8 font-sans animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-start mb-6">
         <div>
            <h2 className="text-2xl font-bold mb-1">
              {selectedTemplate ? selectedTemplate.name : 'Standard Assessment'}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedTemplate ? selectedTemplate.description : 'Official Special Education Form'}
            </p>
         </div>
         
         {!assessment && (
           <div className="w-64">
             <Label>Select Template</Label>
             <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                       <FileText size={14}/> Standard Hebrew Form
                    </div>
                 </SelectItem>
                 {templates.map(t => (
                   <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         )}
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-right bg-slate-50 p-4 rounded-md border" dir="auto">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <span className="font-bold">Student Name:</span>
            <span>{student.name}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold">Son of Rabbi:</span>
            <span>{student.father_name || '_________'}</span>
          </div>
        </div>
        <div className="space-y-2">
           <div className="flex gap-2 items-center">
            <span className="font-bold">Class:</span>
            <span className="ml-4">{student.class}</span>
            <span className="font-bold">Teacher:</span>
            <input 
               className="border-b border-slate-300 bg-transparent focus:outline-none"
               value={formData.teacher_name}
               onChange={(e) => handleChange('teacher_name', e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
             <span className="font-bold">Date:</span>
             <input 
               type="date" 
               className="border-b border-slate-300 bg-transparent focus:outline-none"
               value={formData.date}
               onChange={(e) => handleChange('date', e.target.value)}
             />
          </div>
        </div>
      </div>
      
      {/* Dynamic Form Rendering */}
      {selectedTemplateId === 'standard' ? (
        <StandardHebrewForm formData={formData} handleChange={handleChange} />
      ) : (
        selectedTemplate && (
          <CustomTemplateForm 
             schema={selectedTemplate.schema} 
             customData={formData.custom_data || {}} 
             onChange={handleCustomDataChange} 
          />
        )
      )}

      {/* Evaluation & Certificate */}
      <div className="mb-8 border rounded-lg p-4" dir="auto">
        <h3 className="font-bold flex items-center gap-2 mb-4"><Award size={16} /> Evaluation</h3>

        {/* Overall rating */}
        <div className="mb-5">
          <Label className="mb-1 block">Overall rating</Label>
          <div className="flex flex-wrap gap-2">
            {OVERALL_RATINGS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setEvaluation({ overall_rating: evaluation.overall_rating === r.value ? undefined : r.value })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  evaluation.overall_rating === r.value ? r.cls : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.he} · {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Criteria grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Learning</p>
            <div className="space-y-1.5">
              {LEARNING_CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{c.he} <span className="text-slate-400">/ {c.label}</span></span>
                  <div className="flex gap-1">
                    {GRADE_SCALE.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setCriterion('learning', c.key, g.value)}
                        className={`h-6 w-6 rounded text-xs font-bold border transition ${
                          evaluation.learning?.[c.key] === g.value ? gradeSolidClass(g.value) + ' border-transparent' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >{g.value}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Midos</p>
            <div className="space-y-1.5">
              {MIDOS_CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{c.he} <span className="text-slate-400">/ {c.label}</span></span>
                  <div className="flex gap-1">
                    {GRADE_SCALE.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setCriterion('midos', c.key, g.value)}
                        className={`h-6 w-6 rounded text-xs font-bold border transition ${
                          evaluation.midos?.[c.key] === g.value ? gradeSolidClass(g.value) + ' border-transparent' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >{g.value}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Free text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div>
            <Label className="text-sm">Strengths</Label>
            <textarea className="w-full p-2 border border-slate-300 rounded min-h-[70px] text-sm"
              value={evaluation.strengths || ''} onChange={(e) => setEvaluation({ strengths: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Notes</Label>
            <textarea className="w-full p-2 border border-slate-300 rounded min-h-[70px] text-sm"
              value={evaluation.notes || ''} onChange={(e) => setEvaluation({ notes: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Recommendations</Label>
            <textarea className="w-full p-2 border border-slate-300 rounded min-h-[70px] text-sm"
              value={evaluation.recommendations || ''} onChange={(e) => setEvaluation({ recommendations: e.target.value })} />
          </div>
        </div>

        <div className="mt-4">
          <Button type="button" variant="outline" onClick={handleGenerateCertificate} className="flex items-center gap-2">
            <Award size={16} /> Generate Certificate
          </Button>
        </div>
      </div>

      {/* Notes & Comments — available once the assessment is saved */}
      {assessment?.id && (
        <div className="mb-8 border rounded-lg p-4 bg-slate-50">
          <h3 className="font-bold flex items-center gap-2 mb-3"><MessageSquare size={16} /> Notes &amp; Comments</h3>
          <div className="space-y-3 mb-4">
            {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet. Add the first comment below.</p>}
            {notes.map(n => (
              <div key={n.id} className="bg-white border rounded-md p-3">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.note}</p>
                <p className="text-xs text-slate-400 mt-1">{n.author_name || 'Unknown'} &bull; {new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              className="flex-1 p-2 border border-slate-300 rounded-md text-sm"
              rows={2}
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button onClick={addNote} disabled={savingNote || !newNote.trim()} className="self-end">Add</Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white pb-2">
        <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
          <ArrowRight size={16} /> Cancel
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => handleSubmit('draft')} className="flex items-center gap-2">
            <Save size={16} /> Save Draft
          </Button>
          <Button onClick={() => handleSubmit('final')} className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Check size={16} /> Finalize Assessment
          </Button>
        </div>
      </div>
      {notifyElement}
    </div>
  );
};

export default AssessmentForm;