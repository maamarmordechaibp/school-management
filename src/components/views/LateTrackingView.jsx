import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StudentPicker from '@/components/ui/student-picker';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import {
  Clock, AlertCircle, Printer, Search, Plus, Calendar, Users,
  FileText, Download, Mail, Loader2, RefreshCw, ShieldCheck, Send,
  PenLine, Edit3, X
} from 'lucide-react';
import {
  buildLateLetterDocument,
  buildParentEscalationEmail,
  buildDailySummaryEmail
} from '@/lib/letterTemplates';
import { sendEmail } from '@/lib/emailService';
import { SCHOOL_NAME_YI, SCHOOL_SUBTITLE_YI, SCHOOL_LOGO_URL } from '@/lib/schoolConfig';

// Handwritten-look signature styles. Hebrew has very few "real handwriting"
// fonts on Google Fonts, so we offer a small curated set of visual treatments.
const SIGNATURE_STYLES = {
  signature: {
    label: 'Bold Signature',
    description: 'Thick, leaning — looks signed in pen',
    fontFamily: "'Suez One', 'Frank Ruhl Libre', 'David', cursive",
    fontSize: '24pt',
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#1e3a8a',
    rotate: '-3deg',
    letterSpacing: '0.5px',
  },
  elegant: {
    label: 'Elegant Script',
    description: 'Refined and flowing',
    fontFamily: "'Frank Ruhl Libre', 'David', serif",
    fontSize: '22pt',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#0f172a',
    rotate: '-1.5deg',
    letterSpacing: '0px',
  },
  classic: {
    label: 'Classic Italic',
    description: 'Traditional, slightly leaning',
    fontFamily: "'Bellefair', 'Frank Ruhl Libre', serif",
    fontSize: '22pt',
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#1e3a8a',
    rotate: '-1deg',
    letterSpacing: '0.3px',
  },
  marker: {
    label: 'Marker',
    description: 'Heavy, bold ink',
    fontFamily: "'Heebo', 'Suez One', sans-serif",
    fontSize: '20pt',
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#0f172a',
    rotate: '-2deg',
    letterSpacing: '0.5px',
  },
};

const sigStyleCss = (s) => ({
  fontFamily: s.fontFamily,
  fontSize: s.fontSize,
  fontWeight: s.fontWeight,
  fontStyle: s.fontStyle,
  color: s.color,
  letterSpacing: s.letterSpacing,
  transform: `rotate(${s.rotate})`,
  display: 'inline-block',
});

const LateTrackingView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const { open: openProfile } = useStudentProfile();
  const [loading, setLoading] = useState(true);
  const [lateArrivals, setLateArrivals] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  // Monthly counts: { [studentId]: { unexcused_count, total_count } }
  const [monthlyCounts, setMonthlyCounts] = useState({});
  const [settings, setSettings] = useState({
    late_escalation_threshold: 3,
    late_summary_recipients: '',
    signature_name: '',          // saved permanent signature (e.g. "הרב משה כהן")
    signature_role: 'סגן המנהל', // saved permanent role line under the signature
    signature_style: 'signature' // visual style id (see SIGNATURE_STYLES below)
  });

  // Today-only signature override (resets on reload)
  const [todaySignature, setTodaySignature] = useState(null); // { name, role, style } | null
  const [signatureEditOpen, setSignatureEditOpen] = useState(false);
  const [sigDraft, setSigDraft] = useState({ name: '', role: 'סגן המנהל', style: 'signature' });

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  const [escalationPrompt, setEscalationPrompt] = useState(null); // { late, count }
  const [sendingSummary, setSendingSummary] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '', arrival_time: new Date().toTimeString().slice(0,5), minutes_late: '', reason: '', notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['late_escalation_threshold', 'late_summary_recipients', 'signature_name', 'signature_role', 'signature_style']);
      if (data) {
        const map = {};
        for (const row of data) map[row.key] = row.value;
        setSettings((prev) => ({
          ...prev,
          late_escalation_threshold: parseInt(map.late_escalation_threshold || '3', 10) || 3,
          late_summary_recipients: map.late_summary_recipients || '',
          signature_name: map.signature_name || '',
          signature_role: map.signature_role || prev.signature_role,
          signature_style: SIGNATURE_STYLES[map.signature_style] ? map.signature_style : prev.signature_style
        }));
      }
    } catch (e) {
      console.error('Failed to load late-tracking settings:', e);
    }
  };

  // Persist a new permanent signature
  const savePermanentSignature = async () => {
    const name = (sigDraft.name || '').trim();
    const role = (sigDraft.role || '').trim() || 'סגן המנהל';
    const style = SIGNATURE_STYLES[sigDraft.style] ? sigDraft.style : 'signature';
    try {
      const rows = [
        { key: 'signature_name', value: name },
        { key: 'signature_role', value: role },
        { key: 'signature_style', value: style }
      ];
      // Upsert one at a time (key is PK)
      for (const r of rows) {
        await supabase.from('app_settings').upsert(r, { onConflict: 'key' });
      }
      setSettings((prev) => ({ ...prev, signature_name: name, signature_role: role, signature_style: style }));
      setTodaySignature(null); // clear any temp override
      setSignatureEditOpen(false);
      toast({ title: 'Signature saved', description: name ? `Letters will be signed by ${name}` : 'Signature cleared' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    }
  };

  const loadMonthlyCounts = async (lateData) => {
    const studentIds = [...new Set((lateData || []).map(l => l.student_id))];
    if (studentIds.length === 0) {
      setMonthlyCounts({});
      return;
    }
    const monthStart = new Date(selectedDate);
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('late_arrivals')
      .select('student_id, excused')
      .in('student_id', studentIds)
      .gte('date', monthStartStr)
      .lt('date', nextMonthStr);

    if (error) {
      console.error('Failed to load monthly counts:', error);
      return;
    }
    const counts = {};
    for (const row of data || []) {
      if (!counts[row.student_id]) counts[row.student_id] = { total: 0, unexcused: 0 };
      counts[row.student_id].total += 1;
      if (!row.excused) counts[row.student_id].unexcused += 1;
    }
    setMonthlyCounts(counts);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load late arrivals for selected date
      const { data: lateData } = await supabase
        .from('late_arrivals')
        .select(`
          *,
          student:students(id, first_name, last_name, hebrew_name, class_id,
            class:classes!class_id(name, grade:grades(name)),
            father_name, father_phone, father_email,
            mother_name, mother_phone, mother_email
          )
        `)
        .eq('date', selectedDate)
        .order('arrival_time', { ascending: false });
      setLateArrivals(lateData || []);
      loadMonthlyCounts(lateData || []);

      // Load students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, hebrew_name, class_id, class:classes!class_id(name)')
        .eq('status', 'active')
        .order('last_name');
      setStudents(studentsData || []);

      // Load classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, grade:grades(name)')
        .order('name');
      setClasses(classesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.student_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a student' });
      return;
    }
    try {
      const { data: inserted, error } = await supabase.from('late_arrivals').insert([{
        student_id: formData.student_id,
        date: selectedDate,
        arrival_time: formData.arrival_time || null,
        minutes_late: formData.minutes_late ? parseInt(formData.minutes_late) : null,
        reason: formData.reason || null,
        notes: formData.notes || null,
        recorded_by: currentUser?.id
      }]).select(`
        *,
        student:students(id, first_name, last_name, hebrew_name, class_id,
          class:classes!class_id(name, grade:grades(name)),
          father_name, father_phone, father_email,
          mother_name, mother_phone, mother_email
        )
      `);
      if (error) throw error;
      toast({ title: 'Recorded', description: 'Late arrival has been recorded' });
      setIsModalOpen(false);
      setFormData({ student_id: '', arrival_time: new Date().toTimeString().slice(0,5), minutes_late: '', reason: '', notes: '' });

      const newRecord = inserted && inserted[0];
      // Reload + then print + check escalation
      await loadData();

      if (newRecord) {
        // Compute monthly count for this student (after insert, including this one)
        const studentId = newRecord.student_id;
        const monthStart = new Date(selectedDate);
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const nextMonth = new Date(monthStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        const { data: monthData } = await supabase
          .from('late_arrivals')
          .select('id, excused')
          .eq('student_id', studentId)
          .gte('date', monthStartStr)
          .lt('date', nextMonthStr);
        const unexcused = (monthData || []).filter(r => !r.excused).length;

        // Auto-print the new letter
        printSlip(newRecord, unexcused);

        // Trigger escalation prompt if threshold reached
        const threshold = settings.late_escalation_threshold || 3;
        const alreadyNotified = !!newRecord.parent_notified_at;
        if (!alreadyNotified && unexcused >= threshold) {
          setEscalationPrompt({ late: newRecord, count: unexcused });
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const markSlipPrinted = async (id) => {
    await supabase.from('late_arrivals').update({ slip_printed: true }).eq('id', id);
    loadData();
  };

  const markSlipGiven = async (id) => {
    await supabase.from('late_arrivals').update({ slip_given_to_teacher: true }).eq('id', id);
    loadData();
  };

  const toggleExcused = async (late) => {
    const next = !late.excused;
    const { error } = await supabase
      .from('late_arrivals')
      .update({ excused: next })
      .eq('id', late.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    toast({ title: next ? 'Marked excused' : 'Excused removed' });
    loadData();
  };

  // Print slip for a student (Yiddish letter, school letterhead)
  const printSlip = (late, repeatCount) => {
    const count = repeatCount ?? monthlyCounts[late.student_id]?.unexcused;
    const sig = todaySignature || { name: settings.signature_name, role: settings.signature_role, style: settings.signature_style };
    const html = buildLateLetterDocument(late, {
      schoolName: SCHOOL_NAME_YI,
      schoolSubtitle: SCHOOL_SUBTITLE_YI,
      logoUrl: SCHOOL_LOGO_URL,
      signatureName: sig.name,
      signatureRole: sig.role,
      signatureStyle: SIGNATURE_STYLES[sig.style] || SIGNATURE_STYLES.signature,
      repeatCounts: count ? { [late.id]: count } : {}
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: 'destructive', title: 'Pop-up blocked', description: 'Allow pop-ups to print letters.' });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // The HTML auto-calls window.print() + window.close() on load.
    markSlipPrinted(late.id);
  };

  // Print all letters for the day
  const printAllSlips = () => {
    const unprintedSlips = filteredLateArrivals.filter(l => !l.slip_printed);
    if (unprintedSlips.length === 0) {
      toast({ title: 'Info', description: 'All letters have already been printed' });
      return;
    }
    const repeatCounts = {};
    for (const l of unprintedSlips) {
      const c = monthlyCounts[l.student_id]?.unexcused;
      if (c) repeatCounts[l.id] = c;
    }
    const sig = todaySignature || { name: settings.signature_name, role: settings.signature_role, style: settings.signature_style };
    const html = buildLateLetterDocument(unprintedSlips, {
      schoolName: SCHOOL_NAME_YI,
      schoolSubtitle: SCHOOL_SUBTITLE_YI,
      logoUrl: SCHOOL_LOGO_URL,
      signatureName: sig.name,
      signatureRole: sig.role,
      signatureStyle: SIGNATURE_STYLES[sig.style] || SIGNATURE_STYLES.signature,
      repeatCounts
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: 'destructive', title: 'Pop-up blocked', description: 'Allow pop-ups to print letters.' });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // The HTML auto-calls window.print() + window.close() on load.

    // Mark all as printed
    unprintedSlips.forEach(l => markSlipPrinted(l.id));
  };

  // Send the parent escalation email (after AP confirms)
  const confirmEscalationEmail = async () => {
    if (!escalationPrompt) return;
    const { late, count } = escalationPrompt;
    const parentEmail = late.student?.father_email || late.student?.mother_email;
    if (!parentEmail) {
      toast({
        variant: 'destructive',
        title: 'No parent email on file',
        description: 'Add a parent email to the student record before sending escalation notices.'
      });
      setEscalationPrompt(null);
      return;
    }
    try {
      const html = buildParentEscalationEmail(late, { repeatCount: count });
      const subject = `התראה: ${late.student?.hebrew_name || late.student?.first_name} איז שפעט אנגעקומען (${count} מאל דעם חודש)`;
      await sendEmail({
        to: parentEmail,
        subject,
        body: html,
        relatedType: 'late_arrival',
        relatedId: late.id,
        sentBy: currentUser?.id
      });
      await supabase
        .from('late_arrivals')
        .update({ parent_notified_at: new Date().toISOString() })
        .eq('id', late.id);
      toast({ title: 'Parent notified', description: `Escalation email sent to ${parentEmail}` });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Email failed', description: e.message });
    } finally {
      setEscalationPrompt(null);
      loadData();
    }
  };

  // Send daily summary to principal / configured recipients
  const sendDailySummary = async () => {
    const recipientStr = (settings.late_summary_recipients || '').trim();
    if (!recipientStr) {
      toast({
        variant: 'destructive',
        title: 'No recipients configured',
        description: 'Set "late_summary_recipients" in Settings (comma-separated emails).'
      });
      return;
    }
    const recipients = recipientStr.split(',').map(s => s.trim()).filter(Boolean);

    setSendingSummary(true);
    try {
      const repeatCounts = {};
      for (const l of filteredLateArrivals) {
        const c = monthlyCounts[l.student_id]?.unexcused;
        if (c) repeatCounts[l.id] = c;
      }
      const html = buildDailySummaryEmail(selectedDate, filteredLateArrivals, { repeatCounts });
      const subject = `Daily Late Arrivals — ${new Date(selectedDate).toLocaleDateString('en-GB')} (${filteredLateArrivals.length})`;
      await sendEmail({
        to: recipients,
        subject,
        body: html,
        relatedType: 'late_summary',
        sentBy: currentUser?.id
      });
      toast({ title: 'Summary sent', description: `Sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Send failed', description: e.message });
    } finally {
      setSendingSummary(false);
    }
  };

  // Filter
  const filteredLateArrivals = lateArrivals.filter(l => {
    const matchesClass = selectedClass === 'all' || l.student?.class_id === selectedClass;
    const matchesSearch = !searchQuery ||
      l.student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.student?.hebrew_name?.includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  // Group by class for teacher distribution
  const lateByClass = {};
  filteredLateArrivals.forEach(l => {
    const className = l.student?.class?.name || 'No Class';
    if (!lateByClass[className]) lateByClass[className] = [];
    lateByClass[className].push(l);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Late Arrivals</h1>
          <p className="text-slate-500">Track students who arrive late, print slips for teachers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendDailySummary} disabled={sendingSummary || filteredLateArrivals.length === 0}>
            {sendingSummary ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
            Email Daily Summary
          </Button>
          <Button variant="outline" onClick={printAllSlips}>
            <Printer className="h-4 w-4 ml-2" /> Print All Letters
          </Button>
          <Button onClick={() => {
            setFormData({ student_id: '', arrival_time: new Date().toTimeString().slice(0,5), minutes_late: '', reason: '', notes: '' });
            setIsModalOpen(true);
          }} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 ml-2" /> Add Late Arrival
          </Button>
        </div>
      </div>

      {/* Signature bar */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3" dir="ltr">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <PenLine className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Letters will be signed by</div>
              {(() => {
                const sig = todaySignature || { name: settings.signature_name, role: settings.signature_role, style: settings.signature_style };
                const style = SIGNATURE_STYLES[sig.style] || SIGNATURE_STYLES.signature;
                return (
                  <div className="flex items-center gap-2">
                    <span
                      dir="rtl"
                      className="font-semibold text-slate-800"
                      style={{ ...sigStyleCss(style), fontSize: '20pt' }}
                    >
                      {sig.name || <span className="text-slate-400 italic text-sm">Not set yet — click "Set signature"</span>}
                    </span>
                    {sig.name && (
                      <span className="text-xs text-slate-500" dir="rtl">— {sig.role}</span>
                    )}
                    {todaySignature && (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">Today only</Badge>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todaySignature && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTodaySignature(null)}
                className="text-amber-700"
              >
                <X className="h-4 w-4 mr-1" /> Clear today's override
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSigDraft({
                  name: (todaySignature?.name) || settings.signature_name || '',
                  role: (todaySignature?.role) || settings.signature_role || 'סגן המנהל',
                  style: (todaySignature?.style) || settings.signature_style || 'signature'
                });
                setSignatureEditOpen(true);
              }}
            >
              <Edit3 className="h-4 w-4 mr-1" /> {settings.signature_name ? 'Change signature' : 'Set signature'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg"><AlertCircle className="h-6 w-6 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.length}</p><p className="text-sm text-slate-500">Late Today</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg"><Printer className="h-6 w-6 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.filter(l => !l.slip_printed).length}</p><p className="text-sm text-slate-500">Not Printed</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><FileText className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.filter(l => l.slip_given_to_teacher).length}</p><p className="text-sm text-slate-500">Given to Teacher</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{Object.keys(lateByClass).length}</p><p className="text-sm text-slate-500">Classes Affected</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
            </div>
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search student..." className="pr-10" />
              </div>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Late Arrivals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Late Arrivals - {new Date(selectedDate).toLocaleDateString('en-US')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>This Month</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLateArrivals.map(late => {
                const counts = monthlyCounts[late.student_id];
                const monthCount = counts?.unexcused || 0;
                const threshold = settings.late_escalation_threshold || 3;
                const overThreshold = monthCount >= threshold;
                return (
                <TableRow key={late.id} className={late.excused ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <span className="hover:text-blue-600 cursor-pointer" onClick={() => late.student_id && openProfile(late.student_id)}>
                      {late.student?.hebrew_name || `${late.student?.first_name} ${late.student?.last_name}`}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline">{late.student?.class?.name || 'N/A'}</Badge></TableCell>
                  <TableCell>
                    {monthCount > 0 ? (
                      <Badge className={overThreshold ? 'bg-red-100 text-red-800 font-bold' : 'bg-blue-100 text-blue-800'}>
                        {monthCount}×{overThreshold ? ' ⚠' : ''}
                      </Badge>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </TableCell>
                  <TableCell>{late.arrival_time || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{late.reason || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {late.excused && <Badge className="bg-purple-100 text-purple-800">Excused</Badge>}
                      {late.slip_printed ? (
                        <Badge className="bg-green-100 text-green-800">Printed</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">Not printed</Badge>
                      )}
                      {late.slip_given_to_teacher && (
                        <Badge className="bg-blue-100 text-blue-800">Given</Badge>
                      )}
                      {late.parent_notified_at && (
                        <Badge className="bg-orange-100 text-orange-800">Parent emailed</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => printSlip(late)} title="Print Letter">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {!late.slip_given_to_teacher && late.slip_printed && (
                        <Button variant="ghost" size="sm" onClick={() => markSlipGiven(late.id)} title="Mark as Given">
                          <FileText className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExcused(late)}
                        title={late.excused ? 'Remove excused' : 'Mark excused (won’t count toward escalation)'}
                      >
                        <ShieldCheck className={`h-4 w-4 ${late.excused ? 'text-purple-600' : 'text-slate-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEmailContext({
                          subject: `Late Arrival - ${late.student?.hebrew_name || late.student?.first_name}`,
                          body: `${late.student?.hebrew_name || late.student?.first_name} ${late.student?.last_name} arrived late on ${new Date(selectedDate).toLocaleDateString('en-US')}\n\nTime: ${late.arrival_time || 'N/A'}\nReason: ${late.reason || 'N/A'}`
                        });
                        setIsEmailModalOpen(true);
                      }}>
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );})}
              {filteredLateArrivals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No one arrived late on {new Date(selectedDate).toLocaleDateString('en-US')}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* By Class Summary */}
      {Object.keys(lateByClass).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(lateByClass).map(([className, lates]) => (
            <Card key={className}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Class {className}</span>
                  <Badge>{lates.length} late</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {lates.map(l => (
                    <div key={l.id} className="text-sm flex justify-between items-center py-1 border-b last:border-0">
                      <span>{l.student?.hebrew_name || l.student?.first_name}</span>
                      <span className="text-slate-400">{l.arrival_time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Late Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>Record Late Arrival</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <StudentPicker
                students={students}
                value={formData.student_id}
                onChange={(id) => setFormData({ ...formData, student_id: id })}
                placeholder="Search student..."
              />
            </div>
            <div>
              <Label>Arrival Time</Label>
              <Input type="time" value={formData.arrival_time} onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })} />
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Why late?" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={emailContext.subject}
        defaultBody={emailContext.body}
        currentUser={currentUser}
      />

      {/* Escalation Prompt */}
      <Dialog open={!!escalationPrompt} onOpenChange={(open) => !open && setEscalationPrompt(null)}>
        <DialogContent dir="ltr">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Repeat Lateness — Notify Parents?
            </DialogTitle>
          </DialogHeader>
          {escalationPrompt && (
            <div className="space-y-3 py-2 text-sm">
              <p>
                <strong>
                  {escalationPrompt.late.student?.hebrew_name ||
                    `${escalationPrompt.late.student?.first_name} ${escalationPrompt.late.student?.last_name}`}
                </strong>{' '}
                has been late{' '}
                <strong className="text-red-700">{escalationPrompt.count} times</strong>{' '}
                this month (unexcused).
              </p>
              <p className="text-slate-600">
                This is at or above the escalation threshold ({settings.late_escalation_threshold}).
                Send an email notice to the parent(s)?
              </p>
              <div className="bg-slate-50 border rounded p-3 text-xs">
                <div><strong>Father:</strong> {escalationPrompt.late.student?.father_email || <span className="text-slate-400">no email</span>}</div>
                <div><strong>Mother:</strong> {escalationPrompt.late.student?.mother_email || <span className="text-slate-400">no email</span>}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalationPrompt(null)}>Skip</Button>
            <Button onClick={confirmEscalationEmail} className="bg-red-600 hover:bg-red-700">
              <Mail className="h-4 w-4 mr-2" /> Send Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Edit Dialog */}
      <Dialog open={signatureEditOpen} onOpenChange={setSignatureEditOpen}>
        <DialogContent dir="ltr" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-blue-600" /> Letter Signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              This name is printed at the bottom of every late slip in elegant Hebrew script.
              Set it once — it'll be remembered.
            </p>

            <div>
              <Label className="text-sm">Name (in Hebrew/Yiddish)</Label>
              <Input
                value={sigDraft.name}
                onChange={(e) => setSigDraft({ ...sigDraft, name: e.target.value })}
                placeholder="הרב משה כהן"
                dir="rtl"
                className="text-lg"
                style={{ fontFamily: "'Suez One', 'Frank Ruhl Libre', cursive", color: '#1e3a8a', fontStyle: 'italic' }}
              />
            </div>

            <div>
              <Label className="text-sm">Title (line under the signature)</Label>
              <Input
                value={sigDraft.role}
                onChange={(e) => setSigDraft({ ...sigDraft, role: e.target.value })}
                placeholder="סגן המנהל"
                dir="rtl"
              />
            </div>

            {/* Style picker */}
            <div>
              <Label className="text-sm">Signature style</Label>
              <p className="text-[11px] text-slate-500 mb-2">
                Pick the look you like best. (Hebrew handwriting fonts are limited on the web —
                if none feels right, ask me to wire up "upload a real signature image" next.)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SIGNATURE_STYLES).map(([id, s]) => {
                  const selected = sigDraft.style === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSigDraft({ ...sigDraft, style: id })}
                      className={`text-left rounded-lg border-2 p-3 transition ${
                        selected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {s.label}
                      </div>
                      <div
                        dir="rtl"
                        className="min-h-[32px]"
                        style={{ ...sigStyleCss(s), fontSize: '16pt' }}
                      >
                        {sigDraft.name || 'הרב משה'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{s.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview */}
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-white">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Preview on the printed slip</div>
              {(() => {
                const s = SIGNATURE_STYLES[sigDraft.style] || SIGNATURE_STYLES.signature;
                return (
                  <>
                    <div dir="rtl" style={sigStyleCss(s)}>
                      {sigDraft.name || <span className="text-slate-300 text-base not-italic">(your name)</span>}
                    </div>
                    <div className="border-t border-slate-700 w-40 mx-auto mt-1" />
                    <div className="text-xs text-slate-600 mt-1" dir="rtl">{sigDraft.role || 'סגן המנהל'}</div>
                  </>
                );
              })()}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                // Today-only override — does not save to DB
                setTodaySignature({
                  name: (sigDraft.name || '').trim(),
                  role: (sigDraft.role || '').trim() || 'סגן המנהל',
                  style: SIGNATURE_STYLES[sigDraft.style] ? sigDraft.style : 'signature'
                });
                setSignatureEditOpen(false);
                toast({ title: 'Today only', description: 'This signature applies until you reload the page.' });
              }}
              className="text-amber-700 border-amber-300"
            >
              Use today only
            </Button>
            <Button onClick={savePermanentSignature} className="bg-blue-600 hover:bg-blue-700">
              <PenLine className="h-4 w-4 mr-2" /> Save permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LateTrackingView;
