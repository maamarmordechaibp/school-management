import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, History, Send, Loader2, User as UserIcon } from 'lucide-react';
import {
  fetchTaskComments,
  addTaskComment,
  fetchTaskActivity,
} from '@/lib/taskActivityService';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const ACTION_LABEL = {
  created: 'created the task',
  assigned: 'reassigned the task',
  status: 'changed status',
  comment: 'commented',
  edited: 'edited the task',
  completed: 'completed the task',
};

/**
 * Task detail modal (Phase 5) — shows comments and the activity history for a
 * todo, and lets staff add comments. Read/write against migration 060 tables.
 */
const TaskDetailModal = ({ todo, currentUser, open, onOpenChange }) => {
  const [tab, setTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!todo?.id) return;
    setLoading(true);
    const [c, a] = await Promise.all([fetchTaskComments(todo.id), fetchTaskActivity(todo.id)]);
    setComments(c);
    setActivity(a);
    setLoading(false);
  }, [todo?.id]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const submit = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const ok = await addTaskComment(todo.id, draft, currentUser);
    setSending(false);
    if (ok) { setDraft(''); load(); }
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-lg">{todo.title}</DialogTitle>
        </DialogHeader>

        <div className="px-5 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
          {todo.student_name && <span>Student: <strong>{todo.student_name}</strong></span>}
          {todo.priority && <span>Priority: {todo.priority}</span>}
          {todo.due_date && <span>Due: {todo.due_date}</span>}
          {todo.status && <span>Status: {todo.status}</span>}
        </div>

        <div className="px-5 mt-3 flex gap-1 border-b">
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 ${tab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
          >
            <MessageSquare size={15} /> Comments {comments.length > 0 && `(${comments.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 ${tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
          >
            <History size={15} /> History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[160px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
          ) : tab === 'comments' ? (
            comments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the conversation below.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <UserIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        <strong className="text-slate-700">{c.created_by_name || 'Staff'}</strong> · {fmt(c.created_at)}
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : activity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No history recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="text-sm text-slate-600 flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700">{a.actor_name || 'Staff'}</strong>{' '}
                    {ACTION_LABEL[a.action] || a.action}
                    {a.detail && <span className="text-slate-500"> — {a.detail}</span>}
                    <span className="block text-[11px] text-slate-400">{fmt(a.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {tab === 'comments' && (
          <div className="border-t p-3 flex gap-2 items-end">
            <Textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="resize-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            />
            <Button size="icon" onClick={submit} disabled={sending || !draft.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
