import React, { useState, useEffect } from 'react';
import { sendEmail, renderTemplate } from '@/lib/emailService';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Plus, X, Loader2 } from 'lucide-react';

const SendEmailModal = ({ isOpen, onClose, defaultSubject = '', defaultBody = '', currentUser, relatedType, relatedId }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formData, setFormData] = useState({
    recipients: [''],
    subject: defaultSubject,
    body: defaultBody
  });

  // Reset form when modal opens with new defaults
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        recipients: [''],
        subject: defaultSubject || '',
        body: defaultBody || ''
      });
      setSelectedTemplateId('');
    }
  }, [isOpen, defaultSubject, defaultBody]);

  // Load templates once on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data } = await supabase.from('email_templates').select('id, key, name, subject, body_html, variables').order('name');
      setTemplates(data || []);
    })();
  }, [isOpen]);

  const applyTemplate = (id) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    // Build sample-vars from each variable's `sample` so the user sees placeholder text rather than literal {{name}}.
    const sampleVars = {};
    (tpl.variables || []).forEach(v => { if (v?.name) sampleVars[v.name] = v.sample || ''; });
    const rendered = renderTemplate(tpl, sampleVars);
    setFormData(prev => ({
      ...prev,
      subject: rendered.subject || prev.subject,
      body: rendered.body_html || prev.body,
    }));
  };

  const addRecipient = () => {
    setFormData(prev => ({ ...prev, recipients: [...prev.recipients, ''] }));
  };

  const removeRecipient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index, value) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  const handleSend = async () => {
    const validRecipients = formData.recipients.filter(r => r.trim() && r.includes('@'));
    
    if (validRecipients.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one email address' });
      return;
    }

    if (!formData.subject.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a subject' });
      return;
    }

    setSending(true);
    try {
      // Send email via backend API (handles sending + logging)
      await sendEmail({
        to: validRecipients,
        subject: formData.subject,
        body: formData.body,
        relatedType: relatedType || null,
        relatedId: relatedId || null,
        sentBy: currentUser?.id
      });

      toast({ title: 'Email Sent', description: `Email sent successfully to ${validRecipients.length} recipient(s)` });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({ variant: 'destructive', title: 'Email Failed', description: error.message || 'Failed to send email. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template picker */}
          {templates.length > 0 && (
            <div>
              <Label>Insert Template (optional)</Label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option value="">-- pick a template --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Recipients */}
          <div className="space-y-2">
            <Label>To (email addresses)</Label>
            {formData.recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  value={recipient}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                  dir="ltr"
                />
                {formData.recipients.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeRecipient(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRecipient}>
              <Plus className="h-4 w-4 ml-1" /> Add Email
            </Button>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>

          {/* Body */}
          <div>
            <Label>Content</Label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={6}
              placeholder="Write the email content here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Mail className="h-4 w-4 ml-2" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
