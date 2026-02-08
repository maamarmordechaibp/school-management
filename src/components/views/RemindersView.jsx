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
import {
  Bell, Plus, Edit, Trash2, Mail, Calendar, Clock, Search,
  CheckCircle, Filter, Loader2, AlertCircle
} from 'lucide-react';

const REMINDER_TYPES = [
  { value: 'general', label: 'כללי' },
  { value: 'meeting', label: 'געשפרעך/מיטינג' },
  { value: 'call', label: 'אנרוף' },
  { value: 'deadline', label: 'דעדליין' },
  { value: 'follow_up', label: 'נאכפאלגן' },
  { value: 'evaluation', label: 'עוואלואציע' },
  { value: 'payment', label: 'צאלונג' },
  { value: 'other', label: 'אנדערע' },
];

const RemindersView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('active'); // active, completed, overdue, all
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    reminder_type: 'general',
    reminder_date: '',
    reminder_time: '09:00',
    send_email: false,
    email_recipients: '',
    priority: 'normal',
    related_student_id: null,
    related_student_name: '',
  });

  // Students for linking
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    loadReminders();
    loadStudents();
  }, [filter]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('is_active', true)
        .order('reminder_date', { ascending: true });

      const today = new Date().toISOString().split('T')[0];

      if (filter === 'active') {
        query = query.eq('is_completed', false);
      } else if (filter === 'completed') {
        query = query.eq('is_completed', true);
      } else if (filter === 'overdue') {
        query = query.eq('is_completed', false).lt('reminder_date', today);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, hebrew_name')
      .eq('is_active', true)
      .order('last_name');
    setStudents(data || []);
  };

  const handleSave = async () => {
    if (!form.title || !form.reminder_date) {
      toast({ variant: 'destructive', title: 'פעלער', description: 'ביטע פיל אויס טיטל און דאטום' });
      return;
    }
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        reminder_type: form.reminder_type,
        reminder_date: `${form.reminder_date}T${form.reminder_time || '09:00'}:00`,
        send_email: form.send_email,
        email_recipients: form.send_email ? form.email_recipients : null,
        priority: form.priority,
        related_student_id: form.related_student_id || null,
        related_student_name: form.related_student_name || null,
        created_by: currentUser?.id,
        created_by_name: currentUser?.name || currentUser?.first_name,
      };

      if (editingReminder) {
        const { error } = await supabase.from('reminders').update(payload).eq('id', editingReminder.id);
        if (error) throw error;
        toast({ title: 'אפדעיטעד', description: 'רימיינדער איז געטוישט געווארן' });
      } else {
        const { error } = await supabase.from('reminders').insert([payload]);
        if (error) throw error;
        toast({ title: 'צוגעלייגט', description: 'רימיינדער איז צוגעלייגט געווארן' });
      }

      // If send_email is on, log the email
      if (form.send_email && form.email_recipients) {
        await supabase.from('email_log').insert([{
          to_addresses: form.email_recipients.split(',').map(e => e.trim()),
          subject: `רימיינדער: ${form.title}`,
          body: `${form.description || form.title}\n\nדאטום: ${form.reminder_date} ${form.reminder_time}`,
          related_type: 'reminder',
          sent_by: currentUser?.id,
          sent_by_name: currentUser?.name || currentUser?.first_name,
        }]);
        // Open mailto
        const mailtoLink = `mailto:${form.email_recipients}?subject=${encodeURIComponent('רימיינדער: ' + form.title)}&body=${encodeURIComponent(form.description || form.title)}`;
        window.open(mailtoLink);
      }

      setIsModalOpen(false);
      setEditingReminder(null);
      loadReminders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'פעלער', description: error.message });
    }
  };

  const handleComplete = async (id) => {
    try {
      const { error } = await supabase.from('reminders').update({
        is_completed: true,
        completed_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      toast({ title: 'פערטיג', description: 'רימיינדער איז מסוים געווארן' });
      loadReminders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('reminders').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      toast({ title: 'אויסגעמעקט', description: 'רימיינדער איז אויסגעמעקט געווארן' });
      loadReminders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setForm({
      title: '', description: '', reminder_type: 'general',
      reminder_date: '', reminder_time: '09:00', send_email: false,
      email_recipients: '', priority: 'normal', related_student_id: null, related_student_name: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingReminder(r);
    const dt = r.reminder_date ? new Date(r.reminder_date) : null;
    setForm({
      title: r.title,
      description: r.description || '',
      reminder_type: r.reminder_type || 'general',
      reminder_date: dt ? dt.toISOString().split('T')[0] : '',
      reminder_time: dt ? dt.toTimeString().slice(0, 5) : '09:00',
      send_email: r.send_email || false,
      email_recipients: r.email_recipients || '',
      priority: r.priority || 'normal',
      related_student_id: r.related_student_id,
      related_student_name: r.related_student_name || '',
    });
    setIsModalOpen(true);
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return new Date(date).toDateString() === new Date().toDateString();
  };

  const filteredReminders = reminders.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.related_student_name?.toLowerCase().includes(q) ||
      r.title?.includes(searchQuery);
  });

  // Count stats
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = reminders.filter(r => !r.is_completed && isOverdue(r.reminder_date)).length;
  const todayCount = reminders.filter(r => !r.is_completed && isToday(r.reminder_date)).length;

  const filteredStudentSearch = students.filter(s => {
    if (!studentSearch) return false;
    const q = studentSearch.toLowerCase();
    return s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.hebrew_name?.includes(studentSearch);
  }).slice(0, 5);

  const getPriorityBadge = (p) => {
    if (p === 'high') return <Badge className="bg-red-100 text-red-800">הויך</Badge>;
    if (p === 'low') return <Badge className="bg-slate-100 text-slate-600">נידעריג</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">נארמאל</Badge>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-600" /> רימיינדערס
          </h1>
          <p className="text-slate-500">אלע רימיינדערס - מיט אימעיל אפציע</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 ml-2" /> נייער רימיינדער
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={`cursor-pointer ${filter === 'active' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setFilter('active')}>
          <CardContent className="p-4 text-center">
            <Bell className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{reminders.length}</p>
            <p className="text-xs text-slate-500">אקטיוו</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${filter === 'overdue' ? 'ring-2 ring-red-400' : ''}`} onClick={() => setFilter('overdue')}>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-slate-500">פארפאלן</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{todayCount}</p>
            <p className="text-xs text-slate-500">הייַנט</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${filter === 'completed' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setFilter('completed')}>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">✓</p>
            <p className="text-xs text-slate-500">ערלעדיגט</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="זוך רימיינדער..." className="pr-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">אקטיוו</SelectItem>
            <SelectItem value="overdue">פארפאלן</SelectItem>
            <SelectItem value="completed">ערלעדיגט</SelectItem>
            <SelectItem value="all">אלע</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>קיין רימיינדערס נישט געפונען</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map(r => {
            const overdue = !r.is_completed && isOverdue(r.reminder_date);
            const todayItem = isToday(r.reminder_date);
            return (
              <Card key={r.id} className={`${overdue ? 'border-red-300 bg-red-50/50' : todayItem ? 'border-amber-300 bg-amber-50/50' : ''} ${r.is_completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-bold text-lg ${r.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{r.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {REMINDER_TYPES.find(t => t.value === r.reminder_type)?.label || r.reminder_type}
                        </Badge>
                        {getPriorityBadge(r.priority)}
                        {overdue && <Badge className="bg-red-500 text-white">פארפאלן!</Badge>}
                        {todayItem && !r.is_completed && <Badge className="bg-amber-500 text-white">הייַנט</Badge>}
                        {r.send_email && <Badge className="bg-purple-100 text-purple-800"><Mail className="h-3 w-3 ml-1" /> אימעיל</Badge>}
                      </div>
                      {r.description && <p className="text-sm text-slate-600 mb-1">{r.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {r.reminder_date && new Date(r.reminder_date).toLocaleDateString('he-IL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.reminder_date && new Date(r.reminder_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {r.related_student_name && (
                          <span>תלמיד: {r.related_student_name}</span>
                        )}
                        {r.created_by_name && <span>דורך: {r.created_by_name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!r.is_completed && (
                        <Button variant="ghost" size="sm" onClick={() => handleComplete(r.id)} title="סיים">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(r)} title="עדיט">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} title="מחק">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'טוישן רימיינדער' : 'נייער רימיינדער'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>טיטל *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="וועגן וואס?" />
            </div>
            <div>
              <Label>באשרייבונג</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="מער דעטאלן..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טיפ</Label>
                <Select value={form.reminder_type} onValueChange={(v) => setForm({ ...form, reminder_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>דרינגלעכקייט</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">הויך</SelectItem>
                    <SelectItem value="normal">נארמאל</SelectItem>
                    <SelectItem value="low">נידעריג</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>דאטום *</Label>
                <Input type="date" value={form.reminder_date} onChange={(e) => setForm({ ...form, reminder_date: e.target.value })} />
              </div>
              <div>
                <Label>צייט</Label>
                <Input type="time" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
              </div>
            </div>
            {/* Student Link */}
            <div>
              <Label>פארבינד מיט א תלמיד (אפציאנאל)</Label>
              {form.related_student_name ? (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <span>{form.related_student_name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, related_student_id: null, related_student_name: '' })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="זוך תלמיד..." />
                  {filteredStudentSearch.length > 0 && (
                    <div className="mt-1 border rounded-md shadow-sm max-h-32 overflow-y-auto">
                      {filteredStudentSearch.map(s => (
                        <div key={s.id} className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                          onClick={() => {
                            setForm({
                              ...form,
                              related_student_id: s.id,
                              related_student_name: s.hebrew_name || `${s.first_name} ${s.last_name}`
                            });
                            setStudentSearch('');
                          }}>
                          {s.hebrew_name || `${s.first_name} ${s.last_name}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="send_email" checked={form.send_email}
                  onChange={(e) => setForm({ ...form, send_email: e.target.checked })} className="rounded" />
                <Label htmlFor="send_email" className="cursor-pointer">שיק אימעיל נאטיפיקעישאן</Label>
              </div>
              {form.send_email && (
                <div>
                  <Label>אימעיל אדרעסן (קאמע-געטרענט)</Label>
                  <Input type="email" value={form.email_recipients}
                    onChange={(e) => setForm({ ...form, email_recipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>בטל</Button>
            <Button onClick={handleSave}>
              {editingReminder ? 'אפדעיט' : 'צולייגן'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RemindersView;
