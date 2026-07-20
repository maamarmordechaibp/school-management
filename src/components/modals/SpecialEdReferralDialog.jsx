import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { sendEmail } from '@/lib/emailService';
import { SCHOOL_NAME_YI } from '@/lib/schoolConfig';

/**
 * SpecialEdReferralDialog — shown when a student declines on an aspect more
 * than once. On confirm it creates a pending special-ed evaluation request and
 * emails the special-ed team with the reason.
 *
 * Props: isOpen, onClose, student {id,name}, flagged [{label,reason,declines}],
 *        currentUser, onSent()
 */
const SpecialEdReferralDialog = ({ isOpen, onClose, student, flagged = [], currentUser, onSent }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('high');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const base = flagged.map((f) => f.reason).join(' ');
      setReason(base || 'Repeated decline detected in academic marks.');
      setPriority('high');
    }
  }, [isOpen, flagged]);

  const resolveRecipients = async () => {
    // 1) Admin-configured recipients (comma-separated) in app_settings.
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'special_ed_recipients')
        .maybeSingle();
      const list = (data?.value || '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (list.length) return list;
    } catch (e) { /* ignore */ }

    // 2) Fallback: active special-ed staff email addresses.
    try {
      const { data } = await supabase
        .from('special_ed_staff')
        .select('email')
        .eq('is_active', true);
      return (data || []).map((s) => s.email).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  const handleSend = async () => {
    if (!student?.id) return;
    setSending(true);
    try {
      // 1. Create the evaluation request (pending queue).
      const { error: reqErr } = await supabase.from('special_ed_evaluation_requests').insert([{
        student_id: student.id,
        reason: reason || null,
        priority,
        status: 'pending',
        requested_by: currentUser?.id || null,
        requested_by_name: currentUser?.name || currentUser?.first_name || null,
        notes: 'Auto-flagged from progress tracking (repeated decline).',
      }]);
      if (reqErr) throw reqErr;

      // 2. Email the special-ed team.
      const recipients = await resolveRecipients();
      if (recipients.length) {
        const body =
          `A student has been flagged for special-ed evaluation.\n\n` +
          `Student: ${student.name || ''}\n` +
          `Priority: ${priority}\n\n` +
          `Reason:\n${reason}\n\n` +
          `Flagged aspects: ${flagged.map((f) => `${f.label} (↓${f.declines})`).join(', ') || '—'}\n\n` +
          `— ${SCHOOL_NAME_YI}`;
        try {
          await sendEmail({
            to: recipients,
            subject: `Evaluation needed: ${student.name || 'student'}`,
            body,
            relatedType: 'special_ed_evaluation_request',
            relatedId: student.id,
            sentBy: currentUser?.id || null,
          });
        } catch (mailErr) {
          // Request is saved even if the email fails — surface a soft warning.
          toast({ variant: 'destructive', title: 'Request saved, email failed', description: mailErr.message || 'Could not email special ed.' });
          if (onSent) onSent();
          onClose();
          return;
        }
      }

      toast({
        title: 'Sent to Special Ed',
        description: recipients.length
          ? `Evaluation request created and ${recipients.length} recipient(s) emailed.`
          : 'Evaluation request created. No special-ed recipients configured for email.',
      });
      if (onSent) onSent();
      onClose();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to send referral' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} /> Send to Special Ed for evaluation?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{student?.name}</strong> has declined on one or more aspects more than once.
            Would you like to notify the special-ed team to evaluate this child?
          </p>

          {flagged.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {flagged.map((f) => (
                <Badge key={f.category || f.label} className="bg-red-100 text-red-800">
                  {f.label} ↓{f.declines}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="ref-reason">Reason (sent to special ed)</Label>
            <Textarea id="ref-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Not now</Button>
          <Button onClick={handleSend} disabled={sending} className="bg-amber-600 hover:bg-amber-700 text-white">
            {sending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
            Send to Special Ed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialEdReferralDialog;
