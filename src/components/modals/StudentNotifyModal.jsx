import React, { useEffect, useMemo, useState } from 'react';
import { sendEmail } from '@/lib/emailService';
import { fetchRecipientGroups } from '@/lib/notifyRecipients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2, Users, Plus, X } from 'lucide-react';

/**
 * StudentNotifyModal — asks "who should we email about this?" after a
 * student-related record is created or updated. The user ticks recipient
 * groups (Principals, Special Ed, Teachers, Parents…), optionally adds extra
 * addresses, then sends to everyone with one click.
 *
 * Controlled by `opts` (open when truthy):
 *   {
 *     studentId, studentName,
 *     action: 'created' | 'updated',
 *     recordType: 'Issue',          // human label
 *     title: 'Missing homework',    // optional headline
 *     details: 'multi-line text',   // optional body detail
 *     relatedType, relatedId,       // for email_log linkage
 *   }
 */
const StudentNotifyModal = ({ opts, onClose, currentUser }) => {
  const { toast } = useToast();
  const isOpen = !!opts;

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState({});      // email -> true
  const [extra, setExtra] = useState(['']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const defaults = useMemo(() => {
    if (!opts) return { subject: '', body: '' };
    const action = opts.action === 'updated' ? 'updated' : 'created';
    const type = opts.recordType || 'record';
    const who = currentUser?.name || currentUser?.email || 'Staff';
    const subj = `${type} ${action}${opts.studentName ? ` — ${opts.studentName}` : ''}` +
      (opts.title ? `: ${opts.title}` : '');
    const lines = [
      `A ${type.toLowerCase()} was ${action}${opts.studentName ? ` for ${opts.studentName}` : ''}.`,
      '',
      opts.title ? `${opts.title}` : '',
      opts.details ? `${opts.details}` : '',
      '',
      `By: ${who}`,
    ].filter((l) => l !== undefined);
    return { subject: subj, body: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
  }, [opts, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    setSubject(defaults.subject);
    setBody(defaults.body);
    setSelected({});
    setExtra(['']);
    setLoading(true);
    fetchRecipientGroups(opts.studentId || null)
      .then((g) => setGroups(g))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [isOpen, defaults, opts]);

  const allEmails = useMemo(
    () => groups.flatMap((g) => g.members.map((m) => m.email)),
    [groups]
  );
  const allSelected = allEmails.length > 0 && allEmails.every((e) => selected[e]);

  const toggleEmail = (email) =>
    setSelected((prev) => ({ ...prev, [email]: !prev[email] }));

  const toggleGroup = (group) => {
    const emails = group.members.map((m) => m.email);
    const on = emails.every((e) => selected[e]);
    setSelected((prev) => {
      const next = { ...prev };
      emails.forEach((e) => { next[e] = !on; });
      return next;
    });
  };

  const toggleEveryone = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next = {};
      allEmails.forEach((e) => { next[e] = true; });
      setSelected(next);
    }
  };

  const updateExtra = (i, v) =>
    setExtra((prev) => prev.map((e, idx) => (idx === i ? v : e)));
  const addExtra = () => setExtra((prev) => [...prev, '']);
  const removeExtra = (i) => setExtra((prev) => prev.filter((_, idx) => idx !== i));

  const recipients = useMemo(() => {
    const picked = Object.entries(selected).filter(([, v]) => v).map(([e]) => e);
    const manual = extra.map((e) => e.trim()).filter((e) => e.includes('@'));
    return Array.from(new Set([...picked, ...manual]));
  }, [selected, extra]);

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast({ variant: 'destructive', title: 'No recipients', description: 'Pick at least one person or add an email.' });
      return;
    }
    if (!subject.trim()) {
      toast({ variant: 'destructive', title: 'Missing subject', description: 'Please enter a subject.' });
      return;
    }
    setSending(true);
    try {
      await sendEmail({
        to: recipients,
        subject,
        body,
        relatedType: opts.relatedType || null,
        relatedId: opts.relatedId || null,
        sentBy: currentUser?.id,
      });
      toast({ title: 'Notification sent', description: `Emailed ${recipients.length} recipient(s).` });
      onClose();
    } catch (error) {
      console.error('Notification email failed:', error);
      toast({ variant: 'destructive', title: 'Send failed', description: error.message || 'Could not send the email.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send a notification?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-slate-600">
            Choose who to notify about this update. Everyone selected gets the same email in one click.
          </p>

          {/* Recipient groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">Recipients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleEveryone}
                disabled={loading || allEmails.length === 0}
              >
                <Users className="h-4 w-4 mr-1" />
                {allSelected ? 'Clear all' : 'Select everyone'}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading recipients…
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-slate-500">No staff emails on file — add addresses below.</p>
            ) : (
              <div className="space-y-3 border rounded-lg p-3 bg-slate-50">
                {groups.map((group) => {
                  const emails = group.members.map((m) => m.email);
                  const groupOn = emails.every((e) => selected[e]);
                  return (
                    <div key={group.key}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-blue-600"
                      >
                        {group.label} {groupOn ? '✓' : ''}
                      </button>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {group.members.map((m) => (
                          <label
                            key={m.email}
                            className={`flex items-center gap-2 text-sm px-2 py-1 rounded border cursor-pointer transition-colors ${
                              selected[m.email]
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={!!selected[m.email]}
                              onChange={() => toggleEmail(m.email)}
                            />
                            {m.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Extra addresses */}
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">Add other emails</Label>
              {extra.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    value={e}
                    onChange={(ev) => updateExtra(i, ev.target.value)}
                    placeholder="email@example.com"
                    dir="ltr"
                    className="flex-1"
                  />
                  {extra.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeExtra(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addExtra}>
                <Plus className="h-4 w-4 mr-1" /> Add email
              </Button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          {/* Body */}
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Don't send</Button>
          <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
            Send to {recipients.length || 0}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentNotifyModal;
