import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { EmptyState, ErrorState } from '@/components/ui/states';

const fmt = (d) => (d ? new Date(d).toLocaleString() : '');

const TYPE_META = {
  call: { icon: Phone, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Call' },
  meeting: { icon: Calendar, cls: 'text-indigo-600 bg-indigo-50 border-indigo-200', label: 'Meeting' },
  email: { icon: Mail, cls: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Email' },
};

/**
 * Unified student communication history (Phase 12) — merges calls, meetings and
 * emails into one chronological read model without duplicating the underlying
 * records. Calls and meetings are passed in (already loaded by the profile);
 * emails are fetched here (by student link or parent-email match).
 */
const StudentCommunicationLog = ({ studentId, student, calls = [], meetings = [] }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    const parentEmails = [student?.father_email, student?.mother_email].filter(Boolean);
    const byId = supabase.from('email_log')
      .select('id, subject, body, recipients, sent_at, status, related_type')
      .eq('related_id', studentId);
    const queries = [byId];
    for (const em of parentEmails) {
      queries.push(
        supabase.from('email_log')
          .select('id, subject, body, recipients, sent_at, status, related_type')
          .contains('recipients', [em])
      );
    }
    try {
      const results = await Promise.all(queries.map((q) => q.limit(50)));
      const firstErr = results.find((r) => r.error);
      if (firstErr) throw firstErr.error;
      const map = new Map();
      for (const r of results) for (const row of r.data || []) map.set(row.id, row);
      setEmails([...map.values()]);
    } catch (err) {
      console.error('Failed to load emails:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, student?.father_email, student?.mother_email]);

  const items = [
    ...calls.map((c) => ({
      id: `call-${c.id}`, type: 'call',
      date: c.call_date || c.created_at,
      title: c.subject || c.contact_person || 'Phone call',
      subtitle: [c.contact_person, c.outcome].filter(Boolean).join(' · ') || c.summary || '',
    })),
    ...meetings.map((m) => ({
      id: `meeting-${m.id}`, type: 'meeting',
      date: m.scheduled_date || m.meeting_date,
      title: m.title || 'Meeting',
      subtitle: [m.meeting_type, m.status].filter(Boolean).join(' · '),
    })),
    ...emails.map((e) => ({
      id: `email-${e.id}`, type: 'email',
      date: e.sent_at,
      title: e.subject || 'Email',
      subtitle: (e.recipients || []).join(', '),
    })),
  ]
    .filter((i) => i.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" /> All Communication
        </h3>
        <span className="text-xs text-slate-500">{items.length} entries</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
      ) : error ? (
        <ErrorState title="Couldn't load communication" description="There was a problem fetching emails." onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No communication yet" description="Calls, meetings and emails for this student will appear here." />
      ) : (
        <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {items.map((it) => {
            const meta = TYPE_META[it.type];
            const Icon = meta.icon;
            return (
              <li key={it.id} className="flex gap-3 px-4 py-2.5">
                <span className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">{it.title}</span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">{fmt(it.date)}</span>
                  </div>
                  {it.subtitle && <p className="text-xs text-slate-500 truncate">{it.subtitle}</p>}
                </div>
                <span className={`text-[10px] font-semibold self-center px-1.5 py-0.5 rounded ${meta.cls}`}>{meta.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StudentCommunicationLog;
