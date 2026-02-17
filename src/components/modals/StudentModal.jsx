import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const StudentModal = ({ isOpen, onClose, student, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    hebrew_name: '',
    class_id: '',
    date_of_birth: '',
    address: '',
    father_name: '',
    father_phone: '',
    father_email: '',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
    is_active: true,
    notify_on_updates: false,
    notification_emails: '',
  });

  const [selectedTutors, setSelectedTutors] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (student) {
        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          hebrew_name: student.hebrew_name || '',
          class_id: student.class_id || '',
          date_of_birth: student.date_of_birth || '',
          address: student.address || '',
          father_name: student.father_name || '',
          father_phone: student.father_phone || '',
          father_email: student.father_email || '',
          mother_name: student.mother_name || '',
          mother_phone: student.mother_phone || '',
          mother_email: student.mother_email || '',
          emergency_contact: student.emergency_contact || '',
          emergency_phone: student.emergency_phone || '',
          notes: student.notes || '',
          is_active: student.is_active !== false,
          notify_on_updates: student.notify_on_updates || false,
          notification_emails: Array.isArray(student.notification_emails) ? student.notification_emails.join(', ') : (student.notification_emails || ''),
        });
        fetchStudentTutors(student.id);
      } else {
        resetForm();
        setSelectedTutors([]);
      }
    }
  }, [student, isOpen]);

  const fetchStudentTutors = async (studentId) => {
    const { data } = await supabase
      .from('tutor_assignments')
      .select('tutor_id')
      .eq('student_id', studentId)
      .eq('is_active', true);
    if (data) setSelectedTutors(data.map(d => d.tutor_id));
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      hebrew_name: '',
      class_id: '',
      date_of_birth: '',
      address: '',
      father_name: '',
      father_phone: '',
      father_email: '',
      mother_name: '',
      mother_phone: '',
      mother_email: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
      is_active: true,
      notify_on_updates: false,
      notification_emails: '',
    });
  };

  const fetchOptions = async () => {
    try {
      // Load classes with grades
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, grade:grades(name)')
        .eq('is_active', true)
        .order('name');
      setClassesList(classesData || []);

      // Load tutors
      const { data: tutorsData } = await supabase
        .from('app_users')
        .select('id, first_name, last_name')
        .eq('role', 'tutor')
        .eq('is_active', true)
        .order('last_name');
      setTutorsList(tutorsData || []);

    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const toggleTutor = (tutorId) => {
    setSelectedTutors(prev => 
      prev.includes(tutorId) ? prev.filter(id => id !== tutorId) : [...prev, tutorId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.first_name || !formData.last_name) {
      toast({ variant: 'destructive', title: 'Error', description: 'First name and last name are required' });
      setLoading(false);
      return;
    }

    try {
      let studentId = student?.id;
      
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        hebrew_name: formData.hebrew_name || null,
        class_id: formData.class_id || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        father_name: formData.father_name || null,
        father_phone: formData.father_phone || null,
        father_email: formData.father_email || null,
        mother_name: formData.mother_name || null,
        mother_phone: formData.mother_phone || null,
        mother_email: formData.mother_email || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
        notify_on_updates: formData.notify_on_updates,
        notification_emails: formData.notification_emails
          ? formData.notification_emails.split(',').map(e => e.trim()).filter(Boolean)
          : null,
      };

      if (student) {
        const { error } = await supabase.from('students').update(payload).eq('id', studentId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('students').insert([payload]).select().single();
        if (error) throw error;
        studentId = data.id;
      }

      // Update Tutor Assignments
      // First, deactivate old assignments
      await supabase
        .from('tutor_assignments')
        .update({ is_active: false })
        .eq('student_id', studentId);
      
      // Insert new assignments
      if (selectedTutors.length > 0) {
        const tutorInserts = selectedTutors.map(tid => ({ 
          student_id: studentId, 
          tutor_id: tid,
          is_active: true
        }));
        
        // Use upsert to handle existing assignments
        for (const insert of tutorInserts) {
          await supabase
            .from('tutor_assignments')
            .upsert(insert, { onConflict: 'student_id,tutor_id' });
        }
      }

      toast({ title: 'Success', description: 'Student saved successfully' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Student Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hebrew_name">Hebrew Name</Label>
                <Input
                  id="hebrew_name"
                  value={formData.hebrew_name}
                  onChange={(e) => setFormData({ ...formData, hebrew_name: e.target.value })}
                  dir="rtl"
                  placeholder="Hebrew Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class_id">Class</Label>
                <Select value={formData.class_id || 'none'} onValueChange={(val) => setFormData({ ...formData, class_id: val === 'none' ? null : val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class</SelectItem>
                    {classesList.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.grade?.name ? `(${cls.grade.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, City, Zip"
              />
            </div>
          </div>

          {/* Father Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Father's Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={formData.father_name} 
                  onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={formData.father_phone} 
                  onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })} 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.father_email} 
                  onChange={(e) => setFormData({ ...formData, father_email: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Mother Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Mother's Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={formData.mother_name} 
                  onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={formData.mother_phone} 
                  onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })} 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.mother_email} 
                  onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input 
                  value={formData.emergency_contact} 
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} 
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input 
                  value={formData.emergency_phone} 
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Tutors */}
          {tutorsList.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Assigned Tutors</h3>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50 grid grid-cols-2 gap-2">
                {tutorsList.map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1.5 rounded">
                    <input 
                      type="checkbox" 
                      checked={selectedTutors.includes(t.id)}
                      onChange={() => toggleTutor(t.id)}
                      className="rounded border-slate-300"
                    />
                    {t.first_name} {t.last_name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Email Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2 flex items-center gap-2">
              <Bell className="h-4 w-4" /> Email Notifications
              {formData.notify_on_updates && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
            </h3>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="notify_on_updates"
                checked={formData.notify_on_updates}
                onChange={(e) => setFormData({ ...formData, notify_on_updates: e.target.checked })}
                className="rounded border-slate-300 h-4 w-4"
              />
              <Label htmlFor="notify_on_updates" className="cursor-pointer text-sm">
                <span className="font-medium">Auto-send email on every update</span>
                <span className="block text-xs text-slate-500">Automatically sends an email when issues, calls, meetings, tasks, or special ed records are created or changed for this student</span>
              </Label>
            </div>
            {formData.notify_on_updates && (
              <div>
                <Label>Notification email addresses <span className="text-xs text-slate-500">(comma-separated, leave blank to use parent emails)</span></Label>
                <Input
                  type="text"
                  value={formData.notification_emails}
                  onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                  placeholder={[formData.father_email, formData.mother_email].filter(Boolean).join(', ') || 'Enter email addresses...'}
                />
                {!formData.notification_emails && (formData.father_email || formData.mother_email) && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Will use: {[formData.father_email, formData.mother_email].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Additional Notes</h3>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this student..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {student ? 'Update Student' : 'Create Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentModal;
