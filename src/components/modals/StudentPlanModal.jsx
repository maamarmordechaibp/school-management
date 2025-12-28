import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StudentPlanModal = ({ isOpen, onClose, studentId, plan, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [tutorsList, setTutorsList] = useState([]);

  const [formData, setFormData] = useState({
    goals: '',
    social_emotional_notes: '',
    kriah_notes: '',
    limud_notes: '',
    interventions: [
      { type: 'tutor', description: '', frequency: '', tutor_id: '', goals: '' }
    ],
    review_frequency: 'weekly',
    created_by: '',
    reviewed_by: '',
    status: 'draft'
  });

  useEffect(() => {
    if (isOpen) {
      loadStudent();
      loadTutors();
      if (plan) {
        setFormData({
          ...plan,
          interventions: plan.interventions || [{ type: 'tutor', description: '', frequency: '', tutor_id: '', goals: '' }]
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, plan, studentId]);

  const loadStudent = async () => {
    const { data } = await supabase.from('students').select('*').eq('id', studentId).single();
    setStudent(data);
  };

  const loadTutors = async () => {
    const { data } = await supabase.from('app_users').select('id, name').eq('role', 'tutor').order('name');
    setTutorsList(data || []);
  };

  const resetForm = () => {
    setFormData({
      goals: '',
      social_emotional_notes: '',
      kriah_notes: '',
      limud_notes: '',
      interventions: [{ type: 'tutor', description: '', frequency: '', tutor_id: '', goals: '' }],
      review_frequency: 'weekly',
      created_by: '',
      reviewed_by: '',
      status: 'draft'
    });
  };

  const addIntervention = () => {
    setFormData({
      ...formData,
      interventions: [...formData.interventions, { type: 'tutor', description: '', frequency: '', tutor_id: '', goals: '' }]
    });
  };

  const removeIntervention = (index) => {
    setFormData({
      ...formData,
      interventions: formData.interventions.filter((_, i) => i !== index)
    });
  };

  const updateIntervention = (index, field, value) => {
    const updated = [...formData.interventions];
    updated[index][field] = value;
    setFormData({ ...formData, interventions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        student_id: studentId,
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (plan) {
        await supabase.from('student_plans').update(payload).eq('id', plan.id);
      } else {
        payload.created_at = new Date().toISOString();
        await supabase.from('student_plans').insert([payload]);
      }

      toast({ title: 'Success', description: 'Plan saved successfully' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save plan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Student Plan' : 'Create Student Plan'} 
            {student && ` - ${student.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">Overall Goals & Objectives</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="What are the main goals for this student?"
              rows={3}
              required
            />
          </div>

          {/* Assessment Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="social">Social/Emotional Notes</Label>
              <Textarea
                id="social"
                value={formData.social_emotional_notes}
                onChange={(e) => setFormData({ ...formData, social_emotional_notes: e.target.value })}
                placeholder="Assessment findings..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kriah">Kriah (Reading) Notes</Label>
              <Textarea
                id="kriah"
                value={formData.kriah_notes}
                onChange={(e) => setFormData({ ...formData, kriah_notes: e.target.value })}
                placeholder="Assessment findings..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limud">Limud (Learning) Notes</Label>
              <Textarea
                id="limud"
                value={formData.limud_notes}
                onChange={(e) => setFormData({ ...formData, limud_notes: e.target.value })}
                placeholder="Assessment findings..."
                rows={3}
              />
            </div>
          </div>

          {/* Interventions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Interventions (Tutors/Therapists/Mentors)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addIntervention}>
                <Plus size={16} className="mr-1" /> Add Intervention
              </Button>
            </div>

            {formData.interventions.map((intervention, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Intervention #{index + 1}</Label>
                  {formData.interventions.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeIntervention(index)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={intervention.type}
                      onValueChange={(value) => updateIntervention(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutor">Tutor</SelectItem>
                        <SelectItem value="therapist">Therapist</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="other">Other Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign to Tutor</Label>
                    <Select
                      value={intervention.tutor_id}
                      onValueChange={(value) => updateIntervention(index, 'tutor_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tutorsList.map(tutor => (
                          <SelectItem key={tutor.id} value={tutor.id}>{tutor.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={intervention.description}
                      onChange={(e) => updateIntervention(index, 'description', e.target.value)}
                      placeholder="e.g., Reading support"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      value={intervention.frequency}
                      onChange={(e) => updateIntervention(index, 'frequency', e.target.value)}
                      placeholder="e.g., 2x weekly"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Specific Goals for this Intervention</Label>
                    <Textarea
                      value={intervention.goals}
                      onChange={(e) => updateIntervention(index, 'goals', e.target.value)}
                      placeholder="What should this intervention achieve?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Review Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Review Frequency</Label>
              <Select
                value={formData.review_frequency}
                onValueChange={(value) => setFormData({ ...formData, review_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="needs_adjustment">Needs Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Plan</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentPlanModal;
