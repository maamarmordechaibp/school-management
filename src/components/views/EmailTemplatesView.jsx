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
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
  Mail, Save, Eye, Plus, Trash2, RefreshCw, FileText, Code,
  ChevronRight, Wand2
} from 'lucide-react';

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

// Friendly labels for the standard variables used across the system.
const COMMON_VARS = [
  { name: 'parent_name',  label: 'Parent name',   sample: 'הרב כהן' },
  { name: 'student_name', label: 'Student name',  sample: 'שמעון כהן' },
  { name: 'class_name',   label: 'Class',         sample: 'ג-א' },
  { name: 'subject',      label: 'Subject line',  sample: 'מעלדונג' },
  { name: 'message',      label: 'Your message',  sample: '...' },
  { name: 'school_name',  label: 'School name',   sample: 'תלמוד תורה תולדות יעקב יוסף דחסידי סקווירא - מאנסי' },
  { name: 'date',         label: 'Date',          sample: '01/05/2026' },
];

const slugify = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Dropdown — shows the friendly variable names
const VariableInsertMenu = ({ onPick }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium flex items-center gap-1"
      >
        <Plus size={12} /> Insert
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg w-56 py-1">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-3 py-1.5 border-b">
              Personal info
            </div>
            {COMMON_VARS.map((v) => (
              <button
                key={v.name}
                onClick={() => { onPick(v.name); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-sm flex items-center justify-between gap-2"
              >
                <span>{v.label}</span>
                <code className="text-[10px] text-slate-400">{`{{${v.name}}}`}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EmailTemplatesView = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHtml, setShowHtml] = useState(false);

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

  const selected = useMemo(
    () => templates.find(t => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const select = (t) => {
    setSelectedId(t.id);
    setDraft(t);
    setShowHtml(false);
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft({ ...EMPTY_TEMPLATE });
    setShowHtml(false);
  };

  // Auto-generate key from name when creating a new template
  const handleNameChange = (name) => {
    setDraft((d) => ({
      ...d,
      name,
      key: !selectedId && !d.is_system ? slugify(name) : d.key,
    }));
  };

  const save = async () => {
    if (!draft.name?.trim()) {
      toast({ variant: 'destructive', title: 'Missing name', description: 'Please give the template a name.' });
      return;
    }
    const finalKey = draft.key?.trim() || slugify(draft.name);
    setSaving(true);
    const payload = {
      key: finalKey,
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
    toast({ title: 'Saved!', description: 'Your template is ready to use.' });
    setSelectedId(data.id);
    setDraft(data);
    load();
  };

  const remove = async () => {
    if (!selectedId) return;
    if (selected?.is_system) {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Built-in templates are protected. Edit them instead.' });
      return;
    }
    if (!confirm('Delete this template? This cannot be undone.')) return;
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

  // Insert {{var}} into the rich-text editor wherever the cursor is.
  const insertVariableIntoBody = (varName) => {
    const tag = `{{${varName}}}`;
    const active = document.activeElement;
    if (active && active.getAttribute && active.getAttribute('contenteditable') === 'true') {
      document.execCommand('insertText', false, tag);
      active.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      setDraft((d) => ({ ...d, body_html: (d.body_html || '') + tag }));
    }
  };

  const insertVariableIntoSubject = (varName) => {
    setDraft((d) => ({ ...d, subject: (d.subject || '') + `{{${varName}}}` }));
  };

  // Sample-vars map for the live preview
  const sampleVars = useMemo(() => {
    const map = {};
    COMMON_VARS.forEach(v => { map[v.name] = v.sample; });
    (draft.variables || []).forEach(v => {
      if (v?.name) map[v.name] = v.sample || `[${v.name}]`;
    });
    return map;
  }, [draft.variables]);

  const preview = useMemo(() => renderTemplate(draft, sampleVars), [draft, sampleVars]);

  // Variables actually referenced in the current template
  const referencedVars = useMemo(() => {
    const text = `${draft.subject || ''} ${draft.body_html || ''}`;
    const found = new Set();
    const re = /\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi;
    let m;
    while ((m = re.exec(text))) found.add(m[1]);
    return Array.from(found);
  }, [draft.subject, draft.body_html]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
              <Mail className="text-white" size={20} />
            </div>
            Email Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pre-written emails for parents. Click <strong>Insert</strong> to add a name, class, etc. — they fill in automatically when sent.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
          <Button onClick={startNew} className="bg-blue-600 hover:bg-blue-700"><Plus size={14} className="mr-1" /> New Template</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar: list */}
        <Card className="col-span-3 max-h-[80vh] overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {loading && <p className="text-sm text-slate-500 p-3">Loading…</p>}
            {!loading && templates.length === 0 && (
              <p className="text-sm text-slate-500 p-3">No templates yet. Click "New Template" to create one.</p>
            )}
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => select(t)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === t.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-sm truncate">{t.name}</span>
                  {selectedId === t.id && <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />}
                </div>
                {t.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t.description}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {t.is_system && <Badge variant="outline" className="text-[10px] py-0">Built-in</Badge>}
                  <Badge variant="outline" className="text-[10px] py-0">
                    {t.language === 'yi' ? 'יידיש' : t.language === 'he' ? 'עברית' : 'English'}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="col-span-6">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle className="text-base flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Edit Template</CardTitle>
            <div className="flex gap-2">
              {selectedId && !selected?.is_system && (
                <Button size="sm" variant="outline" onClick={remove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 size={14} />
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Save size={14} className="mr-1" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium">Template name</Label>
              <Input
                className="mt-1"
                value={draft.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Late arrival warning"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">When to use it (optional)</Label>
              <Input
                className="mt-1"
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="e.g. Sent when a student arrives late 3 times in a month"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Language</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { v: 'yi', l: 'יידיש', en: 'Yiddish' },
                  { v: 'he', l: 'עברית', en: 'Hebrew' },
                  { v: 'en', l: 'English', en: 'English' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDraft({ ...draft, language: opt.v })}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      draft.language === opt.v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.l} <span className="opacity-70 text-xs">({opt.en})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Subject (the email's title)</Label>
                <VariableInsertMenu onPick={(name) => insertVariableIntoSubject(name)} />
              </div>
              <Input
                className="mt-1"
                value={draft.subject || ''}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="e.g. א בריוו פון די ישיבה"
                dir={draft.language === 'en' ? 'ltr' : 'rtl'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Email message</Label>
                <div className="flex items-center gap-2">
                  <VariableInsertMenu onPick={(name) => insertVariableIntoBody(name)} />
                  <button
                    type="button"
                    onClick={() => setShowHtml((v) => !v)}
                    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                    title="Switch between visual editor and raw HTML"
                  >
                    <Code size={12} /> {showHtml ? 'Visual editor' : 'HTML'}
                  </button>
                </div>
              </div>
              {showHtml ? (
                <Textarea
                  rows={14}
                  className="font-mono text-xs"
                  value={draft.body_html || ''}
                  onChange={(e) => setDraft({ ...draft, body_html: e.target.value })}
                />
              ) : (
                <RichTextEditor
                  value={draft.body_html || ''}
                  onChange={(html) => setDraft((d) => ({ ...d, body_html: html }))}
                  dir={draft.language === 'en' ? 'ltr' : 'rtl'}
                  placeholder="Write your message here…"
                />
              )}
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Wand2 size={12} className="text-blue-500" />
                Tip: Click <strong>Insert</strong> above to drop in a parent name, student name, class, etc.
              </p>
            </div>

            {referencedVars.length > 0 && (
              <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">This template uses:</p>
                <div className="flex flex-wrap gap-1.5">
                  {referencedVars.map((v) => {
                    const known = COMMON_VARS.find(c => c.name === v);
                    return (
                      <Badge key={v} className="bg-white text-blue-700 border border-blue-200">
                        {known ? known.label : v}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="col-span-3 max-h-[80vh] overflow-y-auto">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2"><Eye size={16} className="text-purple-600" /> Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="text-xs text-slate-500">This is what parents will see (with sample data).</div>
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-slate-50 px-3 py-2 border-b">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Subject</div>
                <div className="font-medium text-sm" dir={draft.language === 'en' ? 'ltr' : 'rtl'}>
                  {preview.subject || <span className="text-slate-400">(empty)</span>}
                </div>
              </div>
              <div className="p-3" dir={draft.language === 'en' ? 'ltr' : 'rtl'}>
                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: preview.body_html || '<em class="text-slate-400">(empty)</em>' }}
                />
              </div>
            </div>
            {preview.missing.length > 0 && (
              <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-xs text-amber-900">
                <strong>Heads up:</strong> these placeholders won't fill in automatically — check the spelling:
                <div className="flex flex-wrap gap-1 mt-1">
                  {preview.missing.map(v => (
                    <code key={v} className="bg-white px-1.5 py-0.5 rounded border border-amber-200">{v}</code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplatesView;
