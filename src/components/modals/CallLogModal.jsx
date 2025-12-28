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
import { useLanguage } from '@/contexts/LanguageContext';

const CallLogModal = ({ isOpen, onClose, callLog, students, onSuccess }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [showNewContact, setShowNewContact] = useState(false);
  
  const [formData, setFormData] = useState({
    student_id: '',
    contact_id: '',
    contact_person: '', 
    phone_number: '',
    notes: '',
    follow_up_date: '',
    completed: false,
    relation: '', 
  });

  useEffect(() => {
    if (callLog) {
      setFormData({
        student_id: callLog.student_id,
        contact_id: callLog.contact_id || '',
        contact_person: callLog.contact_person,
        phone_number: callLog.phone_number,
        notes: callLog.notes || '',
        follow_up_date: callLog.follow_up_date || '',
        completed: callLog.completed,
      });
      if (callLog.student_id) fetchContacts(callLog.student_id);
    } else {
      setFormData({
        student_id: '',
        contact_id: '',
        contact_person: '',
        phone_number: '',
        notes: '',
        follow_up_date: '',
        completed: false,
        relation: '',
      });
    }
  }, [callLog, isOpen]);

  const fetchContacts = async (studentId) => {
    const { data } = await supabase.from('contacts').select('*').eq('student_id', studentId);
    setContacts(data || []);
  };

  const handleStudentChange = (e) => {
    const sId = e.target.value;
    setFormData(prev => ({ ...prev, student_id: sId, contact_id: '', contact_person: '', phone_number: '' }));
    if (sId) fetchContacts(sId);
    else setContacts([]);
  };

  const handleContactSelect = (value) => {
    if (value === 'new') {
      setShowNewContact(true);
      setFormData(prev => ({ ...prev, contact_id: '', contact_person: '', phone_number: '' }));
    } else {
      setShowNewContact(false);
      const contact = contacts.find(c => c.id === value);
      if (contact) {
        setFormData(prev => ({
          ...prev,
          contact_id: contact.id,
          contact_person: contact.name,
          phone_number: contact.phone
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student_id || (!formData.contact_id && !formData.contact_person)) {
      toast({ variant: 'destructive', title: 'Error', description: t('forms.required') });
      return;
    }

    let finalContactId = formData.contact_id;
    let finalContactPerson = formData.contact_person;
    let finalPhone = formData.phone_number;

    if (showNewContact) {
      const { data: newContact, error: contactError } = await supabase.from('contacts').insert([{
        student_id: formData.student_id,
        name: formData.contact_person,
        phone: formData.phone_number,
        relation: formData.relation || 'Other'
      }]).select().single();

      if (!contactError && newContact) {
         finalContactId = newContact.id;
      }
    }

    const payload = {
      student_id: formData.student_id,
      contact_id: finalContactId || null,
      contact_person: finalContactPerson,
      phone_number: finalPhone,
      notes: formData.notes,
      follow_up_date: formData.follow_up_date || null,
      completed: formData.completed
    };

    const { error } = callLog
      ? await supabase.from('call_logs').update(payload).eq('id', callLog.id)
      : await supabase.from('call_logs').insert([payload]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed' });
    } else {
      toast({ title: t('actions.confirm'), description: 'Success' });
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl text-left" dir="ltr">
        <DialogHeader>
          <DialogTitle>{callLog ? t('actions.edit') : t('calls.add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('forms.selectStudent')}</Label>
            <select
              value={formData.student_id}
              onChange={handleStudentChange}
              className="w-full px-3 py-2 border rounded-lg bg-white"
              required
              disabled={!!callLog}
            >
              <option value="">-- {t('forms.selectStudent')} --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name} - {student.class}</option>
              ))}
            </select>
          </div>

          {formData.student_id && (
            <div>
              <Label>{t('calls.contact')}</Label>
              <select
                onChange={(e) => handleContactSelect(e.target.value)}
                value={showNewContact ? 'new' : formData.contact_id}
                className="w-full px-3 py-2 border rounded-lg bg-white mb-2"
              >
                <option value="">-- Select Contact --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.relation}: {c.name} ({c.phone})</option>
                ))}
                <option value="new">+ Add New Contact...</option>
              </select>

              {showNewContact && (
                <div className="bg-slate-50 p-3 rounded border space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder={t('forms.name')} 
                        className="p-2 border rounded"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      />
                      <input 
                        placeholder={t('forms.relation')}
                        className="p-2 border rounded"
                        value={formData.relation}
                        onChange={(e) => setFormData({...formData, relation: e.target.value})}
                      />
                   </div>
                   <input 
                      placeholder={t('students.phone')}
                      className="w-full p-2 border rounded"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                   />
                </div>
              )}
            </div>
          )}

          <div>
            <Label>{t('calls.notes')}</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>{t('calls.followUp')}</Label>
               <input
                 type="date"
                 value={formData.follow_up_date}
                 onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                 className="w-full px-3 py-2 border rounded-lg"
               />
               <p className="text-xs text-slate-500 mt-1">Will appear on the calendar</p>
             </div>
             <div className="flex items-center gap-2 pt-6">
               <input
                 type="checkbox"
                 checked={formData.completed}
                 onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                 className="w-4 h-4"
               />
               <Label>{t('calls.completed')}</Label>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t('actions.cancel')}</Button>
            <Button type="submit">{t('actions.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CallLogModal;