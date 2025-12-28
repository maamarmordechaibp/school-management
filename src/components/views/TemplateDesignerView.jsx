import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Save, Type, List, CheckSquare, Calendar, Hash, AlignLeft } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

const TemplateDesignerView = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    description: '',
    schema: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('assessment_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setTemplates(data || []);
  };

  const handleAddField = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      schema: [
        ...prev.schema,
        { 
          id: crypto.randomUUID(), 
          type: 'text', 
          label: 'New Question', 
          required: false,
          options: []
        }
      ]
    }));
  };

  const handleRemoveField = (index) => {
    const newSchema = [...currentTemplate.schema];
    newSchema.splice(index, 1);
    setCurrentTemplate(prev => ({ ...prev, schema: newSchema }));
  };

  const handleFieldChange = (index, key, value) => {
    const newSchema = [...currentTemplate.schema];
    newSchema[index] = { ...newSchema[index], [key]: value };
    setCurrentTemplate(prev => ({ ...prev, schema: newSchema }));
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name) {
      toast({ variant: "destructive", title: "Error", description: "Template name is required" });
      return;
    }

    const { error } = await supabase.from('assessment_templates').upsert([
      currentTemplate
    ]);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save template" });
    } else {
      toast({ title: "Success", description: "Template saved successfully" });
      setIsEditing(false);
      setCurrentTemplate({ name: '', description: '', schema: [] });
      fetchTemplates();
    }
  };

  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setIsEditing(true);
  };

  const handleDeleteTemplate = async (id) => {
    const { error } = await supabase.from('assessment_templates').delete().eq('id', id);
    if (!error) {
      toast({ title: "Deleted", description: "Template removed" });
      setDeleteConfirmId(null);
      fetchTemplates();
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Assessment Templates</h2>
            <p className="text-slate-600 mt-1">Create and manage custom evaluation forms</p>
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create New Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <p className="text-sm text-slate-500">{template.description || "No description"}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">{template.schema?.length || 0} fields configured</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>Edit</Button>
                {deleteConfirmId === template.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteTemplate(template.id)}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirmId(template.id)}>Delete</Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {templates.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed">
                No templates found. Create one to get started.
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{currentTemplate.id ? 'Edit Template' : 'New Template'}</h2>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
           <Button onClick={handleSaveTemplate}><Save className="mr-2 h-4 w-4"/> Save Template</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
           <div>
             <Label>Template Name</Label>
             <Input 
                value={currentTemplate.name} 
                onChange={(e) => setCurrentTemplate(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Weekly Gemara Assessment"
             />
           </div>
           <div>
             <Label>Description</Label>
             <Input 
                value={currentTemplate.description} 
                onChange={(e) => setCurrentTemplate(prev => ({...prev, description: e.target.value}))}
                placeholder="Brief description of this template"
             />
           </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
         {currentTemplate.schema.map((field, index) => (
           <Card key={field.id} className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 rounded-l-lg group-hover:bg-blue-500 transition-colors" />
              <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                       <span className="text-xs font-mono">#{index + 1}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleRemoveField(index)}>
                       <Trash2 size={16} />
                    </Button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                       <Label>Field Label / Question</Label>
                       <Input 
                         value={field.label} 
                         onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                         placeholder="Enter question here..."
                       />
                    </div>
                    <div className="md:col-span-4">
                       <Label>Field Type</Label>
                       <Select 
                         value={field.type} 
                         onValueChange={(val) => handleFieldChange(index, 'type', val)}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {FIELD_TYPES.map(type => (
                             <SelectItem key={type.value} value={type.value}>
                               <div className="flex items-center gap-2">
                                 <type.icon size={14} /> {type.label}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="md:col-span-2 flex items-center pt-6">
                       <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          Required
                       </label>
                    </div>

                    {field.type === 'select' && (
                       <div className="md:col-span-12 bg-slate-50 p-3 rounded-md">
                          <Label className="text-xs text-slate-500">Options (comma separated)</Label>
                          <Input 
                             value={field.options?.join(', ') || ''}
                             onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                             placeholder="Option 1, Option 2, Option 3"
                          />
                       </div>
                    )}
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <Button variant="outline" className="w-full py-8 border-dashed" onClick={handleAddField}>
         <Plus className="mr-2 h-4 w-4" /> Add Field
      </Button>
    </div>
  );
};

export default TemplateDesignerView;