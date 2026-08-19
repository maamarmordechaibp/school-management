import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Copy, Printer, Save, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { generateAIReport } from '@/lib/aiReportService';
import { sendEmail } from '@/lib/emailService';

const AUDIENCES = [
  { value: 'parents', label: 'Parents' },
  { value: 'tutor', label: 'Tutor / Mentor' },
  { value: 'staff', label: 'Staff / Teacher' },
  { value: 'principal', label: 'Principal / Admin' },
];
const LANGS = [
  { value: 'yi', label: 'Yiddish' },
  { value: 'he', label: 'Hebrew' },
  { value: 'en', label: 'English' },
];

/**
 * AI report generator (analyses the student's notes, reports, assessments,
 * communication, tutoring, cases, etc. and writes a fluent, audience-tailored
 * report — Yiddish by default).
 */
const AIReportModal = ({ open, onOpenChange, studentId, studentName, currentUser, canSensitive = false }) => {
  const { toast } = useToast();
  const [audience, setAudience] = useState('parents');
  const [language, setLanguage] = useState('yi');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [emailing, setEmailing] = useState(false);
  const rtl = language === 'yi' || language === 'he';

  const generate = async () => {
    setLoading(true);
    setReport('');
    try {
      const text = await generateAIReport({ studentId, audience, language, canSensitive });
      setReport(text || '');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not generate report', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(report); toast({ title: 'Copied' }); }
    catch { toast({ variant: 'destructive', title: 'Copy failed' }); }
  };

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) { toast({ variant: 'destructive', title: 'Popup blocked' }); return; }
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    w.document.write(`<!DOCTYPE html><html dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(studentName || 'Report')}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;color:#1e293b;max-width:800px;margin:0 auto;padding:32px;white-space:pre-wrap;font-size:15px;}h1{font-size:20px;}@media print{body{padding:0;}}</style>
      </head><body><h1>${esc(studentName || '')}</h1>${esc(report)}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  const emailToParents = async () => {
    setEmailing(true);
    try {
      const { data: s } = await supabase
        .from('students')
        .select('father_email, mother_email')
        .eq('id', studentId)
        .maybeSingle();
      const recipients = [s?.father_email, s?.mother_email].filter(Boolean);
      if (recipients.length === 0) {
        toast({ variant: 'destructive', title: 'No parent email', description: 'This student has no father/mother email on file.' });
        return;
      }
      const subject = language === 'yi' ? `באריכט וועגן ${studentName}`
        : language === 'he' ? `דו״ח על ${studentName}` : `Report about ${studentName}`;
      await sendEmail({
        to: recipients,
        subject,
        body: report,
        relatedType: 'student',
        relatedId: studentId,
        sentBy: currentUser?.id || null,
      });
      toast({ title: 'Email sent', description: `Sent to ${recipients.join(', ')}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Email failed', description: err.message });
    } finally {
      setEmailing(false);
    }
  };

  const saveToReports = async () => {
    try {
      const { error } = await supabase.from('child_reports').insert({
        student_id: studentId,
        title: `AI Report — ${AUDIENCES.find((a) => a.value === audience)?.label || audience}`,
        category: audience === 'parents' ? 'PTA' : audience === 'tutor' ? 'Academic' : 'General',
        report_date: new Date().toISOString().slice(0, 10),
        content: [{ heading: 'AI-generated report', text: report }],
        summary: report.slice(0, 200),
        status: 'draft',
        created_by: currentUser?.id || null,
        created_by_name: currentUser?.name || currentUser?.first_name || currentUser?.email || null,
      });
      if (error) throw error;
      toast({ title: 'Saved to Reports', description: 'Find it in the Reports tab (as a draft).' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" /> AI Report — {studentName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label className="text-xs">For</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={loading} className="ms-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : report ? <RefreshCw className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {report ? 'Regenerate' : 'Generate'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 rounded-xl border bg-slate-50 p-4 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Analysing everything and writing…</p>
            </div>
          ) : report ? (
            <div className={`whitespace-pre-wrap text-sm text-slate-800 leading-relaxed ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
              {report}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">
              Pick an audience and language, then Generate. The report analyses this student's notes, assessments,
              communication, tutoring, plans and cases.
            </p>
          )}
        </div>

        {report && !loading && (
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={copy}><Copy size={14} className="mr-1" /> Copy</Button>
            <Button variant="outline" size="sm" onClick={print}><Printer size={14} className="mr-1" /> Print</Button>
            <Button variant="outline" size="sm" onClick={emailToParents} disabled={emailing}>
              {emailing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Mail size={14} className="mr-1" />} Email to parents
            </Button>
            <Button variant="outline" size="sm" onClick={saveToReports}><Save size={14} className="mr-1" /> Save to Reports</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIReportModal;
