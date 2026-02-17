import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Filter, AlertTriangle, CheckCircle, Clock, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';
import SendEmailModal from '@/components/modals/SendEmailModal';

const IssuesView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    student_id: '',
    title: '',
    description: '',
    category: 'academic',
    severity: 'medium',
    assigned_to: ''
  });

  // Email notification
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Detail/Comment Modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const categories = [
    { value: 'academic', label: 'Academic' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'social', label: 'Social' },
    { value: 'health', label: 'Health' },
    { value: 'other', label: 'Other' }
  ];

  const severities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: 'Closed', color: 'bg-slate-100 text-slate-700' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load issues with related data
      const { data: issuesData, error: issuesError } = await supabase
        .from('student_issues')
        .select(`
          *,
          student:students(id, first_name, last_name, class_id),
          reporter:app_users!reported_by(id, first_name, last_name),
          assignee:app_users!assigned_to(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (issuesError) throw issuesError;
      setIssues(issuesData || []);

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('last_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load users (for assignment)
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, first_name, last_name, role')
        .eq('is_active', true)
        .order('last_name');
      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load issues' });
    } finally {
      setLoading(false);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const studentName = `${issue.student?.first_name || ''} ${issue.student?.last_name || ''}`.toLowerCase();
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const openCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;

  // Modal functions
  const openModal = (issue = null) => {
    if (issue) {
      setEditingIssue(issue);
      setIssueForm({
        student_id: issue.student_id || '',
        title: issue.title || '',
        description: issue.description || '',
        category: issue.category || 'academic',
        severity: issue.severity || 'medium',
        assigned_to: issue.assigned_to || ''
      });
    } else {
      setEditingIssue(null);
      setIssueForm({
        student_id: '', title: '', description: '',
        category: 'academic', severity: 'medium', assigned_to: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!issueForm.student_id || !issueForm.title || !issueForm.description) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields' });
      return;
    }

    try {
      const payload = {
        student_id: issueForm.student_id,
        title: issueForm.title,
        description: issueForm.description,
        category: issueForm.category,
        severity: issueForm.severity,
        assigned_to: issueForm.assigned_to || null
      };

      if (editingIssue) {
        const { error } = await supabase
          .from('student_issues')
          .update(payload)
          .eq('id', editingIssue.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Issue updated' });
      } else {
        payload.reported_by = currentUser?.id;
        payload.status = 'open';
        const { error } = await supabase
          .from('student_issues')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Issue created' });
        
        // Prompt email notification
        const student = students.find(s => s.id === payload.student_id);
        const studentName = student ? `${student.first_name} ${student.last_name}` : '';
        setEmailSubject(`New Issue Reported: ${payload.title}`);
        setEmailBody(
          `A new issue has been reported:\n\n` +
          `Title: ${payload.title}\n` +
          `Student: ${studentName}\n` +
          `Category: ${payload.category}\n` +
          `Severity: ${payload.severity}\n` +
          (payload.description ? `Description: ${payload.description}\n` : '') +
          `\nReported by: ${currentUser?.name || currentUser?.email || 'System'}`
        );
        setIsModalOpen(false);
        loadData();
        setShowEmailPrompt(true);
        return;
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving issue:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save issue' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const { error } = await supabase
        .from('student_issues')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Issue deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete issue' });
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = currentUser?.id;
      }
      
      const { error } = await supabase
        .from('student_issues')
        .update(updateData)
        .eq('id', issueId);
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Status updated' });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    }
  };

  // Comments
  const openDetail = async (issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
    
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*, user:app_users(first_name, last_name)')
        .eq('issue_id', issue.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedIssue) return;

    try {
      const { error } = await supabase
        .from('issue_comments')
        .insert([{
          issue_id: selectedIssue.id,
          user_id: currentUser?.id,
          comment: newComment.trim()
        }]);
      if (error) throw error;
      
      setNewComment('');
      // Reload comments
      const { data } = await supabase
        .from('issue_comments')
        .select('*, user:app_users(first_name, last_name)')
        .eq('issue_id', selectedIssue.id)
        .order('created_at', { ascending: true });
      setComments(data || []);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add comment' });
    }
  };

  const getSeverityColor = (severity) => {
    return severities.find(s => s.value === severity)?.color || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.value === status)?.color || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Issues</h1>
          <p className="text-slate-500">Track and resolve student concerns</p>
        </div>
        <Button onClick={() => openModal()} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-sm text-slate-500">Open Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-slate-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{criticalCount}</p>
              <p className="text-sm text-slate-500">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issues.filter(i => i.status === 'resolved').length}</p>
              <p className="text-sm text-slate-500">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by title or student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No issues found</p>
              <p className="text-sm">Click "Report Issue" to create a new issue</p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(issue)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{issue.title}</h3>
                      <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                      <Badge className={getStatusColor(issue.status)}>{issue.status?.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {issue.student?.first_name} {issue.student?.last_name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="capitalize">{issue.category}</span>
                      <span className="text-slate-400">•</span>
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{issue.description}</p>
                    {issue.assignee && (
                      <p className="text-xs text-slate-400 mt-2">
                        Assigned to: {issue.assignee.first_name} {issue.assignee.last_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Select value={issue.status} onValueChange={(v) => handleStatusChange(issue.id, v)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => openModal(issue)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(issue.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Issue Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIssue ? 'Edit Issue' : 'Report New Issue'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={issueForm.student_id} onValueChange={(v) => setIssueForm({ ...issueForm, student_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={issueForm.category} onValueChange={(v) => setIssueForm({ ...issueForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={issueForm.severity} onValueChange={(v) => setIssueForm({ ...issueForm, severity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={issueForm.assigned_to || 'none'} onValueChange={(v) => setIssueForm({ ...issueForm, assigned_to: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={issueForm.description}
                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                placeholder="Detailed description of the issue..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              {editingIssue ? 'Update Issue' : 'Report Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Badge className={getSeverityColor(selectedIssue.severity)}>{selectedIssue.severity}</Badge>
                <Badge className={getStatusColor(selectedIssue.status)}>{selectedIssue.status?.replace('_', ' ')}</Badge>
                <Badge variant="outline" className="capitalize">{selectedIssue.category}</Badge>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Student</p>
                <p className="text-slate-600">{selectedIssue.student?.first_name} {selectedIssue.student?.last_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-slate-600">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Reported By</p>
                  <p className="text-slate-600">
                    {selectedIssue.reporter?.first_name} {selectedIssue.reporter?.last_name}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Assigned To</p>
                  <p className="text-slate-600">
                    {selectedIssue.assignee ? `${selectedIssue.assignee.first_name} ${selectedIssue.assignee.last_name}` : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-slate-600">{new Date(selectedIssue.created_at).toLocaleString()}</p>
                </div>
                {selectedIssue.resolved_at && (
                  <div>
                    <p className="font-medium">Resolved</p>
                    <p className="text-slate-600">{new Date(selectedIssue.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedIssue.resolution && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Resolution</p>
                  <p className="text-slate-600">{selectedIssue.resolution}</p>
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {comment.user?.first_name} {comment.user?.last_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600">{comment.comment}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  />
                  <Button onClick={addComment}>Add</Button>
                </div>
              </div>
            </div>
          )}
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
          <p className="text-sm text-slate-600">Would you like to send an email to notify someone about this issue?</p>
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
        relatedType="issue"
      />
    </div>
  );
};

export default IssuesView;