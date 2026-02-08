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
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import {
  Clock, AlertCircle, Printer, Search, Plus, Calendar, Users,
  FileText, Download, Mail, Loader2, RefreshCw
} from 'lucide-react';

const LateTrackingView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lateArrivals, setLateArrivals] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  const [formData, setFormData] = useState({
    student_id: '', arrival_time: '', minutes_late: '', reason: '', notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

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
            father_name, father_phone
          )
        `)
        .eq('date', selectedDate)
        .order('arrival_time', { ascending: false });
      setLateArrivals(lateData || []);

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
      toast({ variant: 'destructive', title: 'Error', description: 'ביטע וועל אויס א תלמיד' });
      return;
    }
    try {
      const { error } = await supabase.from('late_arrivals').insert([{
        student_id: formData.student_id,
        date: selectedDate,
        arrival_time: formData.arrival_time || null,
        minutes_late: formData.minutes_late ? parseInt(formData.minutes_late) : null,
        reason: formData.reason || null,
        notes: formData.notes || null,
        recorded_by: currentUser?.id
      }]);
      if (error) throw error;
      toast({ title: 'רעקאָרדירט', description: 'שפעט אנקומען איז רעקאָרדירט' });
      setIsModalOpen(false);
      setFormData({ student_id: '', arrival_time: '', minutes_late: '', reason: '', notes: '' });
      loadData();
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

  // Print slip for a student
  const printSlip = (late) => {
    const slipContent = `
      <html dir="rtl">
      <head><style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .field { margin: 8px 0; font-size: 14px; }
        .label { font-weight: bold; }
        .footer { border-top: 1px solid #ccc; margin-top: 20px; padding-top: 10px; text-align: center; font-size: 12px; color: #666; }
      </style></head>
      <body>
        <div class="header">
          <h2>צעטל - שפעט אנגעקומען</h2>
          <p>${new Date(selectedDate).toLocaleDateString('he-IL')}</p>
        </div>
        <div class="field"><span class="label">תלמיד:</span> ${late.student?.hebrew_name || `${late.student?.first_name} ${late.student?.last_name}`}</div>
        <div class="field"><span class="label">כיתה:</span> ${late.student?.class?.name || 'N/A'}</div>
        <div class="field"><span class="label">צייט אנגעקומען:</span> ${late.arrival_time || 'N/A'}</div>
        <div class="field"><span class="label">מינוטן שפעט:</span> ${late.minutes_late || 'N/A'}</div>
        ${late.reason ? `<div class="field"><span class="label">סיבה:</span> ${late.reason}</div>` : ''}
        <div class="footer">רעקאָרדירט דורך סגן מנהל</div>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(slipContent);
    printWindow.document.close();
    printWindow.print();
    markSlipPrinted(late.id);
  };

  // Print all slips for the day
  const printAllSlips = () => {
    const unprintedSlips = filteredLateArrivals.filter(l => !l.slip_printed);
    if (unprintedSlips.length === 0) {
      toast({ title: 'Info', description: 'אלע צעטליך זענען שוין אויסגעפרינט' });
      return;
    }

    const slipsHtml = unprintedSlips.map(late => `
      <div style="page-break-after: always; padding: 20px; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
          <h3>צעטל - שפעט אנגעקומען</h3>
          <p>${new Date(selectedDate).toLocaleDateString('he-IL')}</p>
        </div>
        <p><strong>תלמיד:</strong> ${late.student?.hebrew_name || `${late.student?.first_name} ${late.student?.last_name}`}</p>
        <p><strong>כיתה:</strong> ${late.student?.class?.name || 'N/A'}</p>
        <p><strong>צייט:</strong> ${late.arrival_time || 'N/A'} (${late.minutes_late || '?'} מינוטן שפעט)</p>
        ${late.reason ? `<p><strong>סיבה:</strong> ${late.reason}</p>` : ''}
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html dir="rtl"><head><style>body { font-family: Arial, sans-serif; }</style></head><body>${slipsHtml}</body></html>`);
    printWindow.document.close();
    printWindow.print();

    // Mark all as printed
    unprintedSlips.forEach(l => markSlipPrinted(l.id));
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
    const className = l.student?.class?.name || 'אהן קלאס';
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
          <h1 className="text-2xl font-bold text-slate-800">שפעט אנקומען</h1>
          <p className="text-slate-500">האלט חשבון אויף קינדער וואס קומען שפעט, פרינט צעטליך פאר מלמדים</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printAllSlips}>
            <Printer className="h-4 w-4 ml-2" /> פרינט אלע צעטליך
          </Button>
          <Button onClick={() => {
            setFormData({ student_id: '', arrival_time: new Date().toTimeString().slice(0,5), minutes_late: '', reason: '', notes: '' });
            setIsModalOpen(true);
          }} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 ml-2" /> צולייגן שפעט
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg"><AlertCircle className="h-6 w-6 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.length}</p><p className="text-sm text-slate-500">שפעט היינט</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg"><Printer className="h-6 w-6 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.filter(l => !l.slip_printed).length}</p><p className="text-sm text-slate-500">נישט אויסגעפרינט</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><FileText className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{lateArrivals.filter(l => l.slip_given_to_teacher).length}</p><p className="text-sm text-slate-500">געגעבן צום מלמד</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{Object.keys(lateByClass).length}</p><p className="text-sm text-slate-500">קלאסן באטראפן</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <Label>דאטום</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
            </div>
            <div className="flex-1">
              <Label>זוך</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="זוך תלמיד..." className="pr-10" />
              </div>
            </div>
            <div>
              <Label>קלאס</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">אלע קלאסן</SelectItem>
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
          <CardTitle>שפעט אנקומען - {new Date(selectedDate).toLocaleDateString('he-IL')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תלמיד</TableHead>
                <TableHead>כיתה</TableHead>
                <TableHead>צייט</TableHead>
                <TableHead>מינוטן שפעט</TableHead>
                <TableHead>סיבה</TableHead>
                <TableHead>צעטל</TableHead>
                <TableHead>אקציעס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLateArrivals.map(late => (
                <TableRow key={late.id}>
                  <TableCell className="font-medium">
                    {late.student?.hebrew_name || `${late.student?.first_name} ${late.student?.last_name}`}
                  </TableCell>
                  <TableCell><Badge variant="outline">{late.student?.class?.name || 'N/A'}</Badge></TableCell>
                  <TableCell>{late.arrival_time || '-'}</TableCell>
                  <TableCell>
                    {late.minutes_late && (
                      <Badge className={late.minutes_late > 15 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {late.minutes_late} מינוטן
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{late.reason || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {late.slip_printed ? (
                        <Badge className="bg-green-100 text-green-800">אויסגעפרינט</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">נישט</Badge>
                      )}
                      {late.slip_given_to_teacher && (
                        <Badge className="bg-blue-100 text-blue-800">געגעבן</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => printSlip(late)} title="פרינט צעטל">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {!late.slip_given_to_teacher && late.slip_printed && (
                        <Button variant="ghost" size="sm" onClick={() => markSlipGiven(late.id)} title="מארקיר אלס געגעבן">
                          <FileText className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEmailContext({
                          subject: `שפעט אנגעקומען - ${late.student?.hebrew_name || late.student?.first_name}`,
                          body: `${late.student?.hebrew_name || late.student?.first_name} ${late.student?.last_name} איז שפעט אנגעקומען ${new Date(selectedDate).toLocaleDateString('he-IL')}\n\nצייט: ${late.arrival_time || 'N/A'}\nמינוטן שפעט: ${late.minutes_late || 'N/A'}\nסיבה: ${late.reason || 'N/A'}`
                        });
                        setIsEmailModalOpen(true);
                      }}>
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLateArrivals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>קיינער איז נישט שפעט אנגעקומען {new Date(selectedDate).toLocaleDateString('he-IL')}</p>
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
                  <span>כיתה {className}</span>
                  <Badge>{lates.length} שפעט</Badge>
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
            <DialogTitle>צולייגן שפעט אנקומען</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>תלמיד *</Label>
              <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="וועל אויס תלמיד..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.hebrew_name || `${s.first_name} ${s.last_name}`} ({s.class?.name || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>צייט אנגעקומען</Label>
                <Input type="time" value={formData.arrival_time} onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })} />
              </div>
              <div>
                <Label>מינוטן שפעט</Label>
                <Input type="number" value={formData.minutes_late} onChange={(e) => setFormData({ ...formData, minutes_late: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>סיבה</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="פארוואס שפעט?" />
            </div>
            <div>
              <Label>נאטיצן</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>בטל</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">רעקאָרדיר</Button>
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
    </div>
  );
};

export default LateTrackingView;
