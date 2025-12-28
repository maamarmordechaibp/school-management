import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { User, CheckCircle, CalendarClock, RefreshCw, Loader2 } from 'lucide-react';

const MeetingModal = ({ isOpen, onClose, meeting, students, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    duration: 60,
    location: '',
    status: 'scheduled',
  });

  useEffect(() => {
    if (meeting) {
      // If meeting has ID, it's an edit. If not, it might be partial data from calendar click (new)
      const isNew = !meeting.id;
      
      const meetingDate = meeting.meeting_date ? new Date(meeting.meeting_date) : new Date();
      
      setFormData({
        student_id: meeting.student_id || '',
        title: meeting.title || '',
        description: meeting.description || '',
        meeting_date: isNew && meeting.meeting_date ? meeting.meeting_date : meetingDate.toISOString().split('T')[0],
        meeting_time: isNew && meeting.meeting_time ? meeting.meeting_time : meetingDate.toTimeString().slice(0, 5),
        duration: meeting.duration || 60,
        location: meeting.location || '',
        status: meeting.status || 'scheduled',
      });
    } else {
      // Default reset
      setFormData({
        student_id: '',
        title: '',
        description: '',
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: '09:00',
        duration: 60,
        location: '',
        status: 'scheduled',
      });
    }
  }, [meeting, isOpen]);

  // Handle student selection to auto-populate title from issues
  const handleStudentChange = async (studentId) => {
    setFormData(prev => ({ ...prev, student_id: studentId }));
    
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student && !formData.title) {
         setFormData(prev => ({ ...prev, title: `Meeting w/ ${student.name}'s Parents` }));
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    if (!formData.student_id || !formData.title || !formData.meeting_date || !formData.meeting_time) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      setLoading(false);
      return;
    }

    const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);

    const dataToSave = {
      student_id: formData.student_id,
      title: formData.title,
      description: formData.description,
      meeting_date: meetingDateTime.toISOString(),
      duration: parseInt(formData.duration),
      location: formData.location,
      status: formData.status,
    };

    const { error } = (meeting && meeting.id)
      ? await supabase.from('meetings').update(dataToSave).eq('id', meeting.id)
      : await supabase.from('meetings').insert([dataToSave]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${meeting && meeting.id ? 'update' : 'create'} meeting`,
      });
    } else {
      toast({
        title: 'Success',
        description: `Meeting ${meeting && meeting.id ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  const handleMarkCompleted = async () => {
    if (!meeting?.id) return;
    setLoading(true);
    
    const { error } = await supabase.from('meetings').update({ status: 'completed' }).eq('id', meeting.id);
    
    if (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    } else {
       toast({ title: 'Completed', description: 'Meeting marked as completed' });
       onSuccess();
       onClose();
    }
    setLoading(false);
  };

  const handleReschedule = () => {
     // Focus date picker by finding it in DOM or simply notifying user to pick new date
     setFormData(prev => ({ ...prev, status: 'scheduled' }));
     const dateInput = document.getElementById('meeting_date');
     if (dateInput) {
       dateInput.focus();
       dateInput.showPicker && dateInput.showPicker();
     }
     toast({
        title: "Rescheduling",
        description: "Please select a new date and time, then click Update."
     });
  };

  const selectedStudentData = students.find(s => s.id === formData.student_id);
  const isPastMeeting = meeting && meeting.meeting_date && new Date(meeting.meeting_date) < new Date();
  const isEditing = meeting && meeting.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="student">Student *</Label>
                  <select
                    id="student"
                    value={formData.student_id}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.class}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meeting_date">Date *</Label>
                    <input
                      id="meeting_date"
                      type="date"
                      value={formData.meeting_date}
                      onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting_time">Time *</Label>
                    <input
                      id="meeting_time"
                      type="time"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                   <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Notes / Agenda</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between pt-4 gap-2">
                  <div className="flex gap-2">
                    {isEditing && isPastMeeting && formData.status !== 'completed' && (
                        <Button type="button" variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={handleMarkCompleted}>
                           <CheckCircle size={16} className="mr-2" /> Complete
                        </Button>
                    )}
                    {isEditing && formData.status !== 'completed' && (
                        <Button type="button" variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" onClick={handleReschedule}>
                           <CalendarClock size={16} className="mr-2" /> Reschedule
                        </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-indigo-600">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (isEditing ? 'Update' : 'Schedule')}
                    </Button>
                  </div>
                </div>
              </form>
           </div>
           
           {/* Mini Student Details Sidebar */}
           <div className="border-l pl-6 hidden md:block">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                 <User size={16} /> Student Details
              </h4>
              {selectedStudentData ? (
                 <div className="space-y-4 text-sm">
                    <div>
                       <span className="text-slate-500 block text-xs uppercase">Name</span>
                       <span className="font-medium">{selectedStudentData.name}</span>
                    </div>
                    <div>
                       <span className="text-slate-500 block text-xs uppercase">Class</span>
                       <span className="font-medium">{selectedStudentData.class}</span>
                    </div>
                    <div>
                       <span className="text-slate-500 block text-xs uppercase">Parents</span>
                       <div>F: {selectedStudentData.father_name || '-'}</div>
                       <div>M: {selectedStudentData.mother_name || '-'}</div>
                    </div>
                    <div className="pt-4 border-t">
                       <p className="text-xs text-slate-400 italic">
                          Click "Update" or "Schedule" to save the meeting with this student.
                       </p>
                    </div>
                 </div>
              ) : (
                 <div className="text-slate-400 text-sm italic py-8 text-center">
                    Select a student to view details.
                 </div>
              )}
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;