import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { renderTemplate } from '@/lib/emailService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Save, Eye, Plus, Trash2, RefreshCw, FileText } from 'lucide-react';

const EMPTY_TEMPLATE = {
  key: '',
  name: '',
  description: '',
  subject: '',
  body_html: '',
  language: 'yi',
  variables: [],
  is_system: false,
};

const EmailTemplatesView = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name');
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to load', description: error.message });
    } else {
      setTemplates(data || []);
      if ((data || []).length && !selectedId) {
        setSelectedId(data[0].id);
        setDraft(data[0]);
      }
    }
    setLoading(false);
  };

  const selected = useMemo(() => templates.find(t => t.id === selectedId) || null, [templates, selectedId]);

  const select = (t) => {
    setSelectedId(t.id);
    setDraft(t);
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft({ ...EMPTY_TEMPLATE });
  };

  const save = async () => {
    if (!draft.key?.trim() || !draft.name?.trim()) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Key and name are required.' });
      return;
    }
    setSaving(true);
    const payload = {
      key: draft.key.trim(),
      name: draft.name.trim(),
      description: draft.description || '',
      subject: draft.subject || '',
      body_html: draft.body_html || '',
      language: draft.language || 'yi',
      variables: draft.variables || [],
      is_system: !!draft.is_system,
    };
    const query = selectedId
      ? supabase.from('email_templates').update(payload).eq('id', selectedId).select().single()
      : supabase.from('email_templates').insert(payload).select().single();
    const { data, error } = await query;
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'Template saved' });
    setSelectedId(data.id);
    setDraft(data);
    load();
  };

  const remove = async () => {
    if (!selectedId) return;
    if (selected?.is_system) {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'System templates are protected. Edit them instead.' });
      return;
    }
    if (!confirm('Delete this template?')) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', selectedId);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      return;
    }
    toast({ title: 'Template deleted' });
    setSelectedId(null);
    setDraft(EMPTY_TEMPLATE);
    load();
  };

  // Build sample-vars map from the variables list for live preview
  const sampleVars = useMemo(() => {
    const map = {};
    (draft.variables || []).forEach(v => {
      if (v?.name) map[v.name] = v.sample || `[${v.name}]`;
    });
    return map;
  }, [draft.variables]);

  const preview = useMemo(() => renderTemplate(draft, sampleVars), [draft, sampleVars]);

  const updateVariable = (idx, patch) => {
    const next = [...(draft.variables || [])];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, variables: next });
  };
  const addVariable = () => {
    setDraft({ ...draft, variables: [...(draft.variables || []), { name: '', label: '', sample: '' }] });
  };
  const removeVariable = (idx) => {
    setDraft({ ...draft, variables: (draft.variables || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="text-blue-600" /> Email Templates</h1>
          <p className="text-sm text-slate-500">Reusable templates for parent emails. Use <code className="bg-slate-100 px-1 rounded">{'{{variable}}'}</code> placeholders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
          <Button onClick={startNew}><Plus size={14} className="mr-1" /> New Template</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar: list */}
        <Card className="col-span-3 max-h-[80vh] overflow-y-auto">
          <CardContent className="p-2 space-y-1">
            {loading && <p className="text-sm text-slate-500 p-3">Loading…</p>}
            {!loading && templates.length === 0 && (
              <p className="text-sm text-slate-500 p-3">No templates yet. Click “New Template”.</p>
            )}
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => select(t)}
                className={`w-full text-left p-3 rounded border ${selectedId === t.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-sm truncate">{t.name}</span>
                  {t.is_system && <Badge variant="outline" className="text-[10px]">System</Badge>}
                </div>
                <code className="text-[11px] text-slate-500">{t.key}</code>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><FileText size={16} /> Editor</CardTitle>
            <div className="flex gap-2">
              {selectedId && !selected?.is_system && (
                <Button size="sm" variant="outline" onClick={remove}><Trash2 size={14} /></Button>
              )}
              <Button size="sm" onClick={save} disabled={saving}>
                <Save size={14} className="mr-1" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Key (unique, snake_case)</Label>
                <Input
                  value={draft.key || ''}
                  onChange={(e) => setDraft({ ...draft, key: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase() })}
                  placeholder="e.g. late_letter"
                  disabled={!!selected?.is_system}
                />
              </div>
              <div>
                <Label>Display name</Label>
                <Input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Language</Label>
                <select
                  className="w-full border rounded px-2 py-2 text-sm"
                  value={draft.language || 'yi'}
                  onChange={(e) => setDraft({ ...draft, language: e.target.value })}
                >
                  <option value="yi">Yiddish</option>
                  <option value="he">Hebrew</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={draft.subject || ''} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </div>
            <div>
              <Label>Body (HTML)</Label>
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={draft.body_html || ''}
                onChange={(e) => setDraft({ ...draft, body_html: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Variables</Label>
                <Button size="sm" variant="outline" onClick={addVariable}><Plus size={12} /> Add</Button>
              </div>
              <div className="space-y-2">
                {(draft.variables || []).map((v, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-3" placeholder="name" value={v.name || ''} onChange={(e) => updateVariable(idx, { name: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase() })} />
                    <Input className="col-span-4" placeholder="Label" value={v.label || ''} onChange={(e) => updateVariable(idx, { label: e.target.value })} />
                    <Input className="col-span-4" placeholder="Sample value" value={v.sample || ''} onChange={(e) => updateVariable(idx, { sample: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={() => removeVariable(idx)} className="col-span-1"><Trash2 size={12} /></Button>
                  </div>
                ))}
                {(!draft.variables || draft.variables.length === 0) && (
                  <p className="text-xs text-slate-500">No variables defined.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="col-span-4 max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Eye size={16} /> Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-slate-500">Rendered with sample values from the variables list.</div>
            <div className="border rounded p-2 bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Subject</div>
              <div className="font-medium text-sm">{preview.subject || <span className="text-slate-400">(empty)</span>}</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Body</div>
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: preview.body_html || '<em class="text-slate-400">(empty)</em>' }}
              />
            </div>
            {preview.missing.length > 0 && (
              <div className="border border-amber-300 bg-amber-50 rounded p-2 text-xs text-amber-900">
                <strong>Unresolved variables:</strong> {preview.missing.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplatesView;
