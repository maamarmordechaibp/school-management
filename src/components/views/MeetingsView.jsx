import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, List, Edit, Trash2, Clock, User, CheckCircle, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CalendarView from '@/components/views/CalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import SendEmailModal from '@/components/modals/SendEmailModal';

const MeetingsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);

  // Email notification
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    student_id: '',
    meeting_type: 'parent_teacher',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    location: '',
    participant_ids: [],
    notes: ''
  });

  useEffect(() => {
    loadMeetings();
    loadStudents();
    loadStaff();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, class:classes!class_id(name)')
      .eq('status', 'active')
      .order('last_name');
    setStudents(data || []);
  };

  const loadStaff = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, first_name, last_name, role')
      .eq('is_active', true)
      .in('role', ['teacher_hebrew', 'teacher_english', 'principal_hebrew', 'principal_english', 'principal_curriculum', 'tutor', 'admin'])
      .order('last_name');
    setStaff(data || []);
  };

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          student:students(id, first_name, last_name, class:classes!class_id(name)),
          organizer:app_users!organizer_id(id, first_name, last_name),
          meeting_participants(
            id,
            participant:app_users(id, first_name, last_name, role)
          )
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load meetings' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (meeting = null) => {
    if (meeting) {
      setSelectedMeeting(meeting);
      const datetime = meeting.scheduled_date ? new Date(meeting.scheduled_date) : new Date();
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        student_id: meeting.student_id || '',
        meeting_type: meeting.meeting_type || 'parent_teacher',
        scheduled_date: datetime.toISOString().split('T')[0],
        scheduled_time: datetime.toTimeString().slice(0, 5),
        duration_minutes: meeting.duration_minutes || 30,
        location: meeting.location || '',
        participant_ids: meeting.meeting_participants?.map(p => p.participant?.id).filter(Boolean) || [],
        notes: meeting.notes || ''
      });
    } else {
      setSelectedMeeting(null);
      setFormData({
        title: '',
        description: '',
        student_id: '',
        meeting_type: 'parent_teacher',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        duration_minutes: 30,
        location: '',
        participant_ids: [],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scheduled_date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title and date are required' });
      return;
    }

    try {
      const scheduledDatetime = new Date(`${formData.scheduled_date}T${formData.scheduled_time || '00:00'}`);
      
      const payload = {
        title: formData.title,
        description: formData.description || null,
        student_id: formData.student_id || null,
        organizer_id: currentUser?.id,
        meeting_type: formData.meeting_type,
        scheduled_date: scheduledDatetime.toISOString(),
        duration_minutes: formData.duration_minutes,
        location: formData.location || null,
        notes: formData.notes || null,
        status: 'scheduled'
      };

      let meetingId;
      
      if (selectedMeeting) {
        const { error } = await supabase.from('meetings').update(payload).eq('id', selectedMeeting.id);
        if (error) throw error;
        meetingId = selectedMeeting.id;
        
        // Remove old participants
        await supabase.from('meeting_participants').delete().eq('meeting_id', meetingId);
      } else {
        const { data, error } = await supabase.from('meetings').insert([payload]).select().single();
        if (error) throw error;
        meetingId = data.id;
      }

      // Add participants
      if (formData.participant_ids.length > 0) {
        const participantInserts = formData.participant_ids.map(pid => ({
          meeting_id: meetingId,
          participant_id: pid
        }));
        await supabase.from('meeting_participants').insert(participantInserts);
      }

      toast({ title: 'Success', description: selectedMeeting ? 'Meeting updated' : 'Meeting scheduled' });
      setIsModalOpen(false);
      loadMeetings();

      // Prompt email notification only for new meetings
      if (!selectedMeeting) {
        const student = students.find(s => s.id === formData.student_id);
        const studentName = student ? `${student.first_name} ${student.last_name}` : '';
        setEmailSubject(`Meeting Scheduled: ${formData.title}`);
        setEmailBody(
          `A new meeting has been scheduled:\n\n` +
          `Title: ${formData.title}\n` +
          `Date: ${formData.scheduled_date} at ${formData.scheduled_time || 'TBD'}\n` +
          `Duration: ${formData.duration_minutes} minutes\n` +
          `Type: ${formData.meeting_type}\n` +
          (studentName ? `Student: ${studentName}\n` : '') +
          (formData.location ? `Location: ${formData.location}\n` : '') +
          (formData.description ? `Description: ${formData.description}\n` : '') +
          `\nOrganized by: ${currentUser?.name || currentUser?.email || 'System'}`
        );
        setShowEmailPrompt(true);
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save meeting' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      await supabase.from('meeting_participants').delete().eq('meeting_id', id);
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Meeting deleted' });
      loadMeetings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete meeting' });
    }
  };
  
  const handleMarkStatus = async (meeting, status) => {
    try {
      const { error } = await supabase.from('meetings').update({ status }).eq('id', meeting.id);
      if (error) throw error;
      toast({ title: 'Status Updated', description: `Meeting marked as ${status}.` });
      loadMeetings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    }
  };

  const toggleParticipant = (participantId) => {
    setFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(participantId)
        ? prev.participant_ids.filter(id => id !== participantId)
        : [...prev.participant_ids, participantId]
    }));
  };

  const isPastMeeting = (meetingDate) => new Date(meetingDate) < new Date();

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
    }
  };

  const getMeetingTypeBadge = (type) => {
    const types = {
      parent_teacher: { label: 'Parent-Teacher', color: 'bg-purple-100 text-purple-700' },
      iep: { label: 'IEP', color: 'bg-orange-100 text-orange-700' },
      disciplinary: { label: 'Disciplinary', color: 'bg-red-100 text-red-700' },
      progress: { label: 'Progress', color: 'bg-blue-100 text-blue-700' },
      other: { label: 'Other', color: 'bg-slate-100 text-slate-700' }
    };
    const t = types[type] || types.other;
    return <Badge className={t.color}>{t.label}</Badge>;
  };

  // Stats
  const upcomingCount = meetings.filter(m => m.status === 'scheduled' && !isPastMeeting(m.scheduled_date)).length;
  const overdueCount = meetings.filter(m => m.status === 'scheduled' && isPastMeeting(m.scheduled_date)).length;
  const completedCount = meetings.filter(m => m.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meetings & Calendar</h2>
          <p className="text-slate-600 mt-1">Schedule and manage meetings</p>
        </div>
        <Button onClick={() => openModal()} className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
          <Plus size={20} className="mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-sm text-slate-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-sm text-slate-500">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{meetings.length}</p>
              <p className="text-sm text-slate-500">Total Meetings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List size={16} />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon size={16} />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => {
                  const isPast = isPastMeeting(meeting.scheduled_date);
                  const meetingDate = new Date(meeting.scheduled_date);
                  
                  return (
                    <TableRow key={meeting.id} className={isPast && meeting.status === 'scheduled' ? 'bg-red-50/50' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{meetingDate.toLocaleDateString()}</span>
                          <span className="text-xs text-slate-500">
                            {meetingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration_minutes}m)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{meeting.title}</div>
                        {meeting.location && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin size={10} /> {meeting.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.student ? (
                          <div>
                            <div className="font-medium">{meeting.student.first_name} {meeting.student.last_name}</div>
                            <div className="text-xs text-slate-500">{meeting.student.class?.name}</div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getMeetingTypeBadge(meeting.meeting_type)}</TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {meeting.meeting_participants?.slice(0, 3).map((p, i) => (
                            <div 
                              key={i}
                              className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 font-medium border-2 border-white"
                              title={`${p.participant?.first_name} ${p.participant?.last_name}`}
                            >
                              {p.participant?.first_name?.charAt(0)}{p.participant?.last_name?.charAt(0)}
                            </div>
                          ))}
                          {meeting.meeting_participants?.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 font-medium border-2 border-white">
                              +{meeting.meeting_participants.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(meeting.status)}
                          {isPast && meeting.status === 'scheduled' && (
                            <span className="text-xs text-red-600 font-medium">Overdue</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {meeting.status === 'scheduled' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                              title="Mark Completed"
                              onClick={() => handleMarkStatus(meeting, 'completed')}
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openModal(meeting)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(meeting.id)} className="hover:text-red-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {meetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">No meetings scheduled.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Meeting title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select 
                  value={String(formData.duration_minutes)} 
                  onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select value={formData.meeting_type} onValueChange={(v) => setFormData({ ...formData, meeting_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent_teacher">Parent-Teacher</SelectItem>
                    <SelectItem value="iep">IEP Meeting</SelectItem>
                    <SelectItem value="disciplinary">Disciplinary</SelectItem>
                    <SelectItem value="progress">Progress Review</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Student (optional)</Label>
              <Select value={formData.student_id || 'none'} onValueChange={(v) => setFormData({ ...formData, student_id: v === 'none' ? null : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific student</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} {s.class?.name ? `(${s.class.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Principal's Office, Room 101"
              />
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50 grid grid-cols-2 gap-2">
                {staff.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1.5 rounded">
                    <input 
                      type="checkbox" 
                      checked={formData.participant_ids.includes(s.id)}
                      onChange={() => toggleParticipant(s.id)}
                      className="rounded border-slate-300"
                    />
                    {s.first_name} {s.last_name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Meeting agenda or description"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {selectedMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Email Notification Prompt */}
      <Dialog open={showEmailPrompt} onOpenChange={setShowEmailPrompt}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" /> Send Notification?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Would you like to send an email to notify participants about this meeting?</p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmailPrompt(false)}>No, Skip</Button>
            <Button onClick={() => { setShowEmailPrompt(false); setIsEmailOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Mail className="mr-2 h-4 w-4" /> Yes, Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        defaultSubject={emailSubject}
        defaultBody={emailBody}
        currentUser={currentUser}
        relatedType="meeting"
      />
    </div>
  );
};

export default MeetingsView;
