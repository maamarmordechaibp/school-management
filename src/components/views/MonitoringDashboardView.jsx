import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, TrendingUp, TrendingDown, CheckCircle, Clock, FileText, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowBadge } from '@/components/ui/workflow-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MonitoringDashboardView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewData, setReviewData] = useState({
    progress_rating: '',
    notes: '',
    attendance_status: '',
    concerns: '',
    action_needed: false,
    escalate_to_mz: false
  });

  useEffect(() => {
    loadActiveStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, activeTab, searchTerm]);

  const loadActiveStudents = async () => {
    // Load students in active monitoring stage
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        student_plans(id, goals, status, review_frequency, interventions),
        progress_reviews(
          id, 
          created_at, 
          progress_rating, 
          escalate_to_mz,
          reviewed_by
        )
      `)
      .eq('workflow_stage', 'active_monitoring')
      .order('name');

    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load students' });
    } else {
      // Calculate review status for each student
      const enrichedData = (data || []).map(student => {
        const lastReview = student.progress_reviews?.[0];
        const plan = student.student_plans?.[0];
        
        let reviewDue = false;
        let reviewOverdue = false;
        
        if (lastReview && plan) {
          const daysSinceReview = Math.floor((new Date() - new Date(lastReview.created_at)) / (1000 * 60 * 60 * 24));
          
          const frequency = plan.review_frequency || 'monthly';
          const daysThreshold = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;
          
          reviewDue = daysSinceReview >= daysThreshold - 2; // 2 days before
          reviewOverdue = daysSinceReview > daysThreshold;
        } else if (!lastReview) {
          reviewDue = true; // Never reviewed
        }
        
        return {
          ...student,
          reviewDue,
          reviewOverdue,
          lastReview,
          plan
        };
      });
      
      setStudents(enrichedData);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];
    
    // Tab filtering
    if (activeTab === 'needs_review') {
      filtered = filtered.filter(s => s.reviewDue || s.reviewOverdue);
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(s => s.reviewOverdue);
    } else if (activeTab === 'concerns') {
      filtered = filtered.filter(s => 
        s.progress_reviews?.some(r => r.escalate_to_mz || r.progress_rating === 'poor')
      );
    }
    
    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.father_name && s.father_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.mother_name && s.mother_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredStudents(filtered);
  };

  const handleSubmitReview = async () => {
    if (!selectedStudent || !reviewData.progress_rating) {
      toast({ variant: 'destructive', title: 'Error', description: 'Progress rating is required' });
      return;
    }

    try {
      // Insert progress review
      await supabase.from('progress_reviews').insert([{
        student_id: selectedStudent.id,
        progress_rating: reviewData.progress_rating,
        notes: reviewData.notes,
        attendance_status: reviewData.attendance_status,
        concerns: reviewData.concerns,
        action_needed: reviewData.action_needed,
        escalate_to_mz: reviewData.escalate_to_mz,
        reviewed_by: currentUser?.id,
        created_at: new Date().toISOString()
      }]);

      // If escalated or poor progress, potentially change workflow stage
      if (reviewData.escalate_to_mz || reviewData.progress_rating === 'poor') {
        await supabase
          .from('students')
          .update({ workflow_stage: 'plan_adjustment' })
          .eq('id', selectedStudent.id);
      }

      toast({ title: 'Success', description: 'Review submitted successfully' });
      setIsReviewModalOpen(false);
      setSelectedStudent(null);
      resetReviewForm();
      loadActiveStudents();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit review' });
    }
  };

  const resetReviewForm = () => {
    setReviewData({
      progress_rating: '',
      notes: '',
      attendance_status: '',
      concerns: '',
      action_needed: false,
      escalate_to_mz: false
    });
  };

  const openReviewModal = (student) => {
    setSelectedStudent(student);
    resetReviewForm();
    setIsReviewModalOpen(true);
  };

  const getProgressIcon = (rating) => {
    switch (rating) {
      case 'excellent': return <TrendingUp size={16} className="text-green-600" />;
      case 'good': return <CheckCircle size={16} className="text-blue-600" />;
      case 'fair': return <Clock size={16} className="text-yellow-600" />;
      case 'poor': return <TrendingDown size={16} className="text-red-600" />;
      default: return null;
    }
  };

  const StudentMonitoringCard = ({ student }) => {
    const interventionsCount = student.plan?.interventions?.length || 0;
    const recentReviews = student.progress_reviews?.slice(0, 3) || [];

    return (
      <Card className={`hover:shadow-lg transition-shadow ${student.reviewOverdue ? 'border-red-300 bg-red-50' : student.reviewDue ? 'border-yellow-300 bg-yellow-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <p className="text-sm text-slate-500 mt-1">{student.class}</p>
            </div>
            {student.reviewOverdue && (
              <Badge variant="destructive">Overdue Review</Badge>
            )}
            {!student.reviewOverdue && student.reviewDue && (
              <Badge className="bg-yellow-500">Review Due</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Plan Info */}
            {student.plan && (
              <div className="text-sm p-2 bg-slate-100 rounded">
                <div className="font-semibold mb-1">Active Plan</div>
                <div className="text-xs text-slate-600 line-clamp-2">{student.plan.goals}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {interventionsCount} intervention{interventionsCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {student.plan.review_frequency || 'monthly'} reviews
                  </Badge>
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {recentReviews.length > 0 && (
              <div className="text-sm">
                <div className="font-semibold mb-2">Recent Reviews</div>
                <div className="space-y-1">
                  {recentReviews.map((review, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1 bg-white rounded">
                      <div className="flex items-center gap-2">
                        {getProgressIcon(review.progress_rating)}
                        <span className="capitalize">{review.progress_rating}</span>
                      </div>
                      <span className="text-slate-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Review Info */}
            {student.lastReview && (
              <div className="text-xs text-slate-500 pt-2 border-t">
                Last reviewed {Math.floor((new Date() - new Date(student.lastReview.created_at)) / (1000 * 60 * 60 * 24))} days ago
              </div>
            )}

            {!student.lastReview && (
              <div className="text-xs text-orange-600 pt-2 border-t font-semibold">
                ⚠️ Never reviewed - Initial review needed
              </div>
            )}

            {/* Action Button */}
            <Button 
              size="sm" 
              className="w-full mt-2"
              variant={student.reviewOverdue ? 'destructive' : student.reviewDue ? 'default' : 'outline'}
              onClick={() => openReviewModal(student)}
            >
              <FileText size={14} className="mr-2" />
              Submit Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Student Monitoring Dashboard</h2>
          <p className="text-slate-600 mt-1">Track progress and conduct regular reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Active</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Reviews Due</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => s.reviewDue && !s.reviewOverdue).length}
                </p>
              </div>
              <Clock size={32} className="text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {students.filter(s => s.reviewOverdue).length}
                </p>
              </div>
              <AlertCircle size={32} className="text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Needs Attention</p>
                <p className="text-2xl font-bold text-orange-600">
                  {students.filter(s => s.progress_reviews?.some(r => r.escalate_to_mz)).length}
                </p>
              </div>
              <TrendingDown size={32} className="text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">
            All Students
            <Badge variant="secondary" className="ml-2">{students.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="needs_review">
            Needs Review
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.reviewDue || s.reviewOverdue).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            <Badge variant="destructive" className="ml-2">
              {students.filter(s => s.reviewOverdue).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="concerns">
            Concerns
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.progress_reviews?.some(r => r.escalate_to_mz)).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">All caught up!</h3>
                <p className="text-slate-500">No students match the current filter</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => (
                <StudentMonitoringCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Progress Review - {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Progress Rating *</Label>
              <Select
                value={reviewData.progress_rating}
                onValueChange={(value) => setReviewData({ ...reviewData, progress_rating: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - Exceeding goals</SelectItem>
                  <SelectItem value="good">Good - Meeting goals</SelectItem>
                  <SelectItem value="fair">Fair - Partial progress</SelectItem>
                  <SelectItem value="poor">Poor - Not making progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attendance Status</Label>
              <Select
                value={reviewData.attendance_status}
                onValueChange={(value) => setReviewData({ ...reviewData, attendance_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attendance..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - No absences</SelectItem>
                  <SelectItem value="good">Good - 1-2 absences</SelectItem>
                  <SelectItem value="fair">Fair - 3-5 absences</SelectItem>
                  <SelectItem value="poor">Poor - Many absences</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Progress Notes</Label>
              <Textarea
                value={reviewData.notes}
                onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                placeholder="Detail the student's progress, achievements, and observations..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Concerns / Issues</Label>
              <Textarea
                value={reviewData.concerns}
                onChange={(e) => setReviewData({ ...reviewData, concerns: e.target.value })}
                placeholder="Any concerns or challenges to note..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded border border-orange-200">
              <input
                type="checkbox"
                id="escalate"
                checked={reviewData.escalate_to_mz}
                onChange={(e) => setReviewData({ ...reviewData, escalate_to_mz: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="escalate" className="text-orange-900 cursor-pointer">
                <AlertCircle size={16} className="inline mr-1" />
                Escalate to M.Z. - Plan needs adjustment (progress &lt; 75%)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsReviewModalOpen(false);
                setSelectedStudent(null);
                resetReviewForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonitoringDashboardView;
