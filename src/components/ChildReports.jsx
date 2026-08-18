import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Printer, Trash2, Edit, ArrowLeft, Save } from 'lucide-react';

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ChildReports = ({ studentId, student, currentUser }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // the report being written/edited
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tpl, rep] = await Promise.all([
        supabase.from('child_report_templates').select('*').eq('is_active', true).order('created_at', { ascending: true }),
        supabase.from('child_reports').select('*').eq('student_id', studentId).order('report_date', { ascending: false }),
      ]);
      setTemplates(tpl.data || []);
      setReports(rep.data || []);
    } catch (e) {
      console.error('child_reports not available yet', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const startNew = (template) => {
    const sections = (template?.sections || []).map((s) => ({ heading: s.heading, prompt: s.prompt, text: '' }));
    setEditing({
      id: null,
      template_id: template?.id || null,
      title: template?.name || 'Report',
      category: template?.category || null,
      report_date: new Date().toISOString().slice(0, 10),
      content: sections.length ? sections : [{ heading: 'באריכט · Report', prompt: '', text: '' }],
      summary: '',
      status: 'draft',
    });
  };

  const startEdit = (report) => {
    setEditing({
      id: report.id,
      template_id: report.template_id,
      title: report.title || 'Report',
      category: report.category || null,
      report_date: (report.report_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      content: Array.isArray(report.content) && report.content.length ? report.content : [{ heading: 'באריכט · Report', prompt: '', text: '' }],
      summary: report.summary || '',
      status: report.status || 'draft',
    });
  };

  const updateSection = (idx, text) => {
    setEditing((e) => ({ ...e, content: e.content.map((s, i) => (i === idx ? { ...s, text } : s)) }));
  };

  const save = async (status) => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      student_id: studentId,
      template_id: editing.template_id,
      title: editing.title || 'Report',
      category: editing.category || null,
      report_date: editing.report_date,
      content: editing.content.map(({ heading, text }) => ({ heading, text })),
      summary: editing.summary || null,
      status: status || editing.status || 'draft',
      created_by: currentUser?.id || null,
      created_by_name: currentUser?.name || currentUser?.first_name || currentUser?.email || null,
    };
    try {
      let error;
      if (editing.id) {
        ({ error } = await supabase.from('child_reports').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id));
      } else {
        ({ error } = await supabase.from('child_reports').insert(payload));
      }
      if (error) throw error;
      toast({ title: 'Saved', description: 'Report saved.' });
      setEditing(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not save report.' });
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    const { error } = await supabase.from('child_reports').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    load();
  };

  const printReport = (report) => {
    const win = window.open('', '_blank');
    if (!win) {
      toast({ variant: 'destructive', title: 'Popup blocked', description: 'Allow popups to print.' });
      return;
    }
    const sections = (report.content || [])
      .filter((s) => (s.text || '').trim())
      .map((s) => `<h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.text).replace(/\n/g, '<br>')}</p>`)
      .join('');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(student?.name || 'Report')}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color:#1e293b; margin:0; padding:32px; line-height:1.6; }
        h1 { font-size:22px; margin:0 0 2px; }
        .meta { color:#64748b; font-size:12px; margin-bottom:18px; }
        h2 { font-size:15px; color:#4f46e5; border-bottom:2px solid #e2e8f0; padding-bottom:4px; margin:20px 0 6px; }
        p { margin:0 0 8px; white-space:pre-wrap; }
        @media print { body { padding:0; } }
      </style></head><body>
        <h1>${escapeHtml(student?.name || '')}${student?.hebrew_name ? ` · ${escapeHtml(student.hebrew_name)}` : ''}</h1>
        <div class="meta">${escapeHtml(report.title || 'Report')} · ${escapeHtml((report.report_date || '').slice(0, 10))}${student?.class ? ` · ${escapeHtml(student.class)}` : ''}</div>
        ${report.summary ? `<p><strong>${escapeHtml(report.summary)}</strong></p>` : ''}
        ${sections || '<p style="color:#94a3b8">No content.</p>'}
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  // ---------- Editor view ----------
  if (editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> {editing.id ? 'Edit report' : 'New report'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={editing.title} onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={editing.report_date} onChange={(e) => setEditing((s) => ({ ...s, report_date: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={editing.category || 'none'} onValueChange={(v) => setEditing((s) => ({ ...s, category: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  <SelectItem value="PTA">PTA</SelectItem>
                  <SelectItem value="Special-Ed">Special-Ed</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editing.content.map((sec, idx) => (
            <div key={idx}>
              <Label className="text-indigo-700">{sec.heading}</Label>
              <Textarea
                rows={4}
                placeholder={sec.prompt || ''}
                value={sec.text}
                onChange={(e) => updateSection(idx, e.target.value)}
                dir="rtl"
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => save('draft')} disabled={saving}>
              <Save size={16} className="mr-1" /> Save draft
            </Button>
            <Button onClick={() => save('final')} disabled={saving}>
              <Save size={16} className="mr-1" /> Save as final
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------- List view ----------
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" /> New report from template
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No templates yet. Run migration 051 to seed ready-made templates.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startNew(t)}
                  className="text-right p-3 rounded-lg border hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <p className="font-semibold text-slate-800">{t.name}</p>
                  {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{(t.sections || []).length} sections</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={18} className="text-slate-600" /> Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No reports written yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 truncate">{r.title}</p>
                    {r.category && (
                      <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                    )}
                    <Badge variant={r.status === 'final' ? 'default' : 'outline'} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {(r.report_date || '').slice(0, 10)}{r.created_by_name ? ` · ${r.created_by_name}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printReport(r)} title="Print">
                  <Printer size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(r)} title="Edit">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(r.id)} title="Delete">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildReports;
