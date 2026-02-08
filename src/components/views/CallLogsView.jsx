import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, Phone, Calendar, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CallLogsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [callLogs, setCallLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const [formData, setFormData] = useState({
    student_id: '',
    contact_type: 'father',
    contact_person: '',
    phone_number: '',
    call_type: 'outgoing',
    purpose: '',
    notes: '',
    outcome: '',
    follow_up_needed: false,
    follow_up_date: '',
    direction: 'outgoing',
    reminder_date: '',
    reminder_email: '',
    duration_minutes: ''
  });

  useEffect(() => {
    loadCallLogs();
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, father_name, father_phone, mother_name, mother_phone')
      .eq('is_active', true)
      .order('last_name');
    setStudents(data || []);
  };

  const loadCallLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          student:students(id, first_name, last_name),
          caller:app_users!caller_id(id, first_name, last_name)
        `)
        .order('call_date', { ascending: false });

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load call logs',
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (log = null) => {
    if (log) {
      setSelectedLog(log);
      setFormData({
        student_id: log.student_id || '',
        contact_type: log.contact_type || 'father',
        contact_person: log.contact_person || '',
        phone_number: log.phone_number || '',
        call_type: log.call_type || 'outgoing',
        purpose: log.purpose || '',
        notes: log.notes || '',
        outcome: log.outcome || '',
        follow_up_needed: log.follow_up_needed || false,
        follow_up_date: log.follow_up_date || '',
        direction: log.direction || log.call_type || 'outgoing',
        reminder_date: log.reminder_date ? log.reminder_date.split('T')[0] : '',
        reminder_email: log.reminder_email || '',
        duration_minutes: log.duration_minutes || ''
      });
    } else {
      setSelectedLog(null);
      setFormData({
        student_id: '',
        contact_type: 'father',
        contact_person: '',
        phone_number: '',
        call_type: 'outgoing',
        purpose: '',
        notes: '',
        outcome: '',
        follow_up_needed: false,
        follow_up_date: '',
        direction: 'outgoing',
        reminder_date: '',
        reminder_email: '',
        duration_minutes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const contact = formData.contact_type === 'father' 
        ? { name: student.father_name, phone: student.father_phone }
        : { name: student.mother_name, phone: student.mother_phone };
      
      setFormData({
        ...formData,
        student_id: studentId,
        contact_person: contact.name || '',
        phone_number: contact.phone || ''
      });
    }
  };

  const handleContactTypeChange = (type) => {
    const student = students.find(s => s.id === formData.student_id);
    if (student) {
      const contact = type === 'father' 
        ? { name: student.father_name, phone: student.father_phone }
        : { name: student.mother_name, phone: student.mother_phone };
      
      setFormData({
        ...formData,
        contact_type: type,
        contact_person: contact.name || '',
        phone_number: contact.phone || ''
      });
    } else {
      setFormData({ ...formData, contact_type: type });
    }
  };

  const handleSave = async () => {
    if (!formData.student_id || !formData.contact_person) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a student and contact person' });
      return;
    }

    try {
      const payload = {
        student_id: formData.student_id,
        caller_id: currentUser?.id,
        contact_type: formData.contact_type,
        contact_person: formData.contact_person,
        phone_number: formData.phone_number,
        call_type: formData.call_type,
        purpose: formData.purpose,
        notes: formData.notes,
        outcome: formData.outcome,
        follow_up_needed: formData.follow_up_needed,
        follow_up_date: formData.follow_up_date || null,
        call_date: selectedLog?.call_date || new Date().toISOString(),
        direction: formData.direction || formData.call_type,
        reminder_date: formData.reminder_date || null,
        reminder_email: formData.reminder_email || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
      };

      if (selectedLog) {
        const { error } = await supabase.from('call_logs').update(payload).eq('id', selectedLog.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Call log updated' });
      } else {
        const { error } = await supabase.from('call_logs').insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Call log created' });
      }

      setIsModalOpen(false);
      loadCallLogs();
    } catch (error) {
      console.error('Error saving call log:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save call log' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return;

    try {
      const { error } = await supabase.from('call_logs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Call log deleted' });
      loadCallLogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete call log' });
    }
  };

  const toggleFollowUp = async (log) => {
    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ follow_up_needed: !log.follow_up_needed })
        .eq('id', log.id);
      if (error) throw error;
      loadCallLogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update' });
    }
  };

  // Filter logs
  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = 
      log.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'follow_up') return matchesSearch && log.follow_up_needed;
    if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return matchesSearch && log.call_date?.split('T')[0] === today;
    }
    return matchesSearch;
  });

  // Stats
  const todayCount = callLogs.filter(l => l.call_date?.split('T')[0] === new Date().toISOString().split('T')[0]).length;
  const followUpCount = callLogs.filter(l => l.follow_up_needed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Call Logs</h2>
          <p className="text-slate-600 mt-1">Track communication with parents and guardians</p>
        </div>
        <Button onClick={() => openModal()} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
          <Plus size={20} className="mr-2" />
          Log Call
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{callLogs.length}</p>
              <p className="text-sm text-slate-500">Total Calls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-slate-500">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{followUpCount}</p>
              <p className="text-sm text-slate-500">Need Follow-up</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(callLogs.map(l => l.student_id)).size}</p>
              <p className="text-sm text-slate-500">Students Contacted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by student, contact, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="follow_up">Follow-up Needed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className={log.follow_up_needed ? 'border-l-4 border-l-amber-400' : ''}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">
                      {log.student?.first_name} {log.student?.last_name}
                    </h3>
                    <Badge variant={log.call_type === 'outgoing' ? 'default' : 'secondary'}>
                      {log.call_type === 'outgoing' || log.direction === 'outgoing' ? '📤 Outgoing' : '📥 Incoming'}
                    </Badge>
                    {log.duration_minutes && (
                      <Badge variant="outline" className="text-slate-500">
                        {log.duration_minutes} min
                      </Badge>
                    )}
                    {log.follow_up_needed && (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">
                        Follow-up Needed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Contact:</span>{' '}
                      <span className="font-medium">{log.contact_person}</span>
                      <span className="text-slate-400 ml-1">({log.contact_type})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>{' '}
                      <span className="font-medium">{log.phone_number || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Purpose:</span>{' '}
                      <span className="font-medium">{log.purpose || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>{' '}
                      <span className="font-medium">{new Date(log.call_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{log.notes}</p>
                  )}

                  {log.outcome && (
                    <p className="text-sm text-slate-600"><span className="text-slate-500">Outcome:</span> {log.outcome}</p>
                  )}

                  {log.follow_up_date && (
                    <p className="text-sm text-amber-600">
                      Follow-up scheduled: {new Date(log.follow_up_date).toLocaleDateString()}
                    </p>
                  )}

                  {log.reminder_date && (
                    <p className="text-sm text-purple-600">
                      🔔 Reminder: {new Date(log.reminder_date).toLocaleDateString()}
                      {log.reminder_email && ` → ${log.reminder_email}`}
                    </p>
                  )}

                  {log.caller && (
                    <p className="text-xs text-slate-400 mt-2">
                      Logged by: {log.caller.first_name} {log.caller.last_name}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFollowUp(log)}
                    className={log.follow_up_needed ? 'text-amber-600 hover:bg-amber-50' : 'hover:bg-slate-100'}
                    title="Toggle follow-up"
                  >
                    <CheckCircle size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openModal(log)} className="hover:bg-slate-100">
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No call logs found</p>
              <p className="text-sm">Start logging calls to track parent communication</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLog ? 'Edit Call Log' : 'Log New Call'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={formData.student_id} onValueChange={handleStudentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Type</Label>
                <Select value={formData.contact_type} onValueChange={handleContactTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Call Type</Label>
                <Select value={formData.call_type} onValueChange={(v) => setFormData({ ...formData, call_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Attendance, Progress update, Behavior"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Details of the conversation..."
              />
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <Input
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="Result or action items from the call"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={formData.direction} onValueChange={(v) => setFormData({ ...formData, direction: v, call_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">📤 Outgoing</SelectItem>
                    <SelectItem value="incoming">📥 Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reminder Date</Label>
                <Input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reminder Email</Label>
                <Input
                  type="email"
                  value={formData.reminder_email}
                  onChange={(e) => setFormData({ ...formData, reminder_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.follow_up_needed}
                  onChange={(e) => setFormData({ ...formData, follow_up_needed: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">Follow-up needed</span>
              </label>
              
              {formData.follow_up_needed && (
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-40"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              {selectedLog ? 'Update' : 'Save Call Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallLogsView;
