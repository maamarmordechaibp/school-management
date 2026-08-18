import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Loader2, ChevronDown, ChevronRight, CheckCircle2, Trash2, Send, Briefcase,
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/ui/states';
import {
  fetchCases, createCase, closeCase, deleteCase, fetchCaseEntries, addCaseEntry,
} from '@/lib/caseService';

const CASE_TYPES = ['general', 'academic', 'behavioral', 'attendance', 'social', 'special_ed'];
const ENTRY_TYPES = ['concern', 'evaluation', 'intervention', 'communication', 'followup', 'outcome', 'note'];

const STATUS_STYLE = {
  open: 'bg-blue-100 text-blue-700',
  monitoring: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};
const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-slate-100 text-slate-600',
  low: 'bg-slate-100 text-slate-400',
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '');

/**
 * Per-student support/case management (Phase 16). Broad cases with a workflow
 * trail (concern → evaluation → intervention → communication → follow-up →
 * outcome). Links to special-ed optionally; never duplicates special-ed data.
 */
const StudentSupportCases = ({ studentId, currentUser, canEdit = true }) => {
  const { toast } = useToast();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [entries, setEntries] = useState({});
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', case_type: 'general', priority: 'medium', summary: '' });
  const [entryDraft, setEntryDraft] = useState({ entry_type: 'note', content: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setCases(await fetchCases(studentId));
    setLoading(false);
  }, [studentId]);

  useEffect(() => { if (studentId) load(); }, [studentId, load]);

  const toggle = async (c) => {
    if (expanded === c.id) { setExpanded(null); return; }
    setExpanded(c.id);
    if (!entries[c.id]) {
      const rows = await fetchCaseEntries(c.id);
      setEntries((e) => ({ ...e, [c.id]: rows }));
    }
  };

  const handleCreate = async () => {
    if (!draft.title.trim()) { toast({ variant: 'destructive', title: 'Title required' }); return; }
    const { error } = await createCase({ studentId, ...draft, user: currentUser });
    if (error) { toast({ variant: 'destructive', title: 'Could not create case', description: error.message }); return; }
    setDraft({ title: '', case_type: 'general', priority: 'medium', summary: '' });
    setCreating(false);
    toast({ title: 'Case opened' });
    load();
  };

  const handleAddEntry = async (caseId) => {
    if (!entryDraft.content.trim()) return;
    const ok = await addCaseEntry({ caseId, ...entryDraft, user: currentUser });
    if (ok) {
      const rows = await fetchCaseEntries(caseId);
      setEntries((e) => ({ ...e, [caseId]: rows }));
      setEntryDraft({ entry_type: 'note', content: '' });
    }
  };

  const handleClose = async (c) => {
    const outcome = window.prompt('Outcome / resolution note (optional):', c.outcome || '');
    if (outcome === null) return;
    const ok = await closeCase(c.id, outcome);
    if (ok) { toast({ title: 'Case closed' }); load(); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete the case "${c.title}" and its entries?`)) return;
    const ok = await deleteCase(c.id);
    if (ok) { toast({ title: 'Case deleted' }); load(); }
  };

  if (loading) return <LoadingState label="Loading cases…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase size={18} className="text-primary" /> Support Cases
        </h3>
        {canEdit && !creating && (
          <Button size="sm" onClick={() => setCreating(true)}><Plus size={15} className="mr-1" /> New Case</Button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. Reading support & home follow-up" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={draft.case_type} onValueChange={(v) => setDraft((d) => ({ ...d, case_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea rows={2} value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Open Case</Button>
          </div>
        </div>
      )}

      {cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No support cases"
          description="Open a case to track a concern through evaluation, intervention, communication and follow-up."
        />
      ) : (
        <div className="space-y-2">
          {cases.map((c) => {
            const isOpen = expanded === c.id;
            const rows = entries[c.id] || [];
            return (
              <div key={c.id} className="rounded-xl border border-slate-200">
                <button type="button" onClick={() => toggle(c)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 truncate">{c.title}</span>
                      <Badge className={`text-[10px] ${STATUS_STYLE[c.status] || ''}`}>{c.status}</Badge>
                      <Badge className={`text-[10px] ${PRIORITY_STYLE[c.priority] || ''}`}>{c.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">{c.case_type}</Badge>
                    </div>
                    {c.summary && <p className="text-xs text-slate-500 truncate mt-0.5">{c.summary}</p>}
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">{fmt(c.opened_at)}</span>
                </button>

                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-3 bg-slate-50/40">
                    {rows.length === 0 ? (
                      <p className="text-xs text-slate-400">No entries yet. Add the first concern or action below.</p>
                    ) : (
                      <ul className="space-y-2">
                        {rows.map((r) => (
                          <li key={r.id} className="flex gap-2 text-sm">
                            <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0 capitalize">{r.entry_type}</Badge>
                            <div className="min-w-0">
                              <p className="text-slate-700 whitespace-pre-wrap">{r.content}</p>
                              <p className="text-[11px] text-slate-400">{r.created_by_name || 'Staff'} · {fmt(r.occurred_on || r.created_at)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {canEdit && c.status !== 'closed' && (
                      <div className="flex items-end gap-2 pt-1">
                        <div className="w-40">
                          <Select value={entryDraft.entry_type} onValueChange={(v) => setEntryDraft((d) => ({ ...d, entry_type: v }))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>{ENTRY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          rows={1}
                          className="resize-none min-h-9"
                          placeholder="Add an entry…"
                          value={entryDraft.content}
                          onChange={(e) => setEntryDraft((d) => ({ ...d, content: e.target.value }))}
                        />
                        <Button size="icon" onClick={() => handleAddEntry(c.id)} disabled={!entryDraft.content.trim()}>
                          <Send size={16} />
                        </Button>
                      </div>
                    )}

                    {canEdit && (
                      <div className="flex justify-end gap-2 pt-1">
                        {c.status !== 'closed' && (
                          <Button variant="outline" size="sm" onClick={() => handleClose(c)}>
                            <CheckCircle2 size={14} className="mr-1" /> Close case
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(c)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                    {c.outcome && (
                      <p className="text-xs text-emerald-700 border-t pt-2"><strong>Outcome:</strong> {c.outcome}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSupportCases;
