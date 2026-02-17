import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, CheckCircle2, Circle, Clock, Loader2, Trash2, Search, 
  AlertCircle, CalendarDays, User, Filter, ChevronDown, ChevronUp, 
  Mail, CheckSquare, ListTodo, ArrowUp, ArrowRight, ArrowDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', color: 'bg-slate-100 text-slate-700' },
  { value: 'academic', label: 'Academic', color: 'bg-blue-100 text-blue-700' },
  { value: 'behavioral', label: 'Behavioral', color: 'bg-orange-100 text-orange-700' },
  { value: 'special_ed', label: 'Special Ed', color: 'bg-purple-100 text-purple-700' },
  { value: 'administrative', label: 'Administrative', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'communication', label: 'Communication', color: 'bg-green-100 text-green-700' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-slate-500', icon: ArrowDown },
  { value: 'normal', label: 'Normal', color: 'text-blue-500', icon: ArrowRight },
  { value: 'high', label: 'High', color: 'text-orange-500', icon: ArrowUp },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600', icon: AlertCircle },
];

const TodoListView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // Create/Edit dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    student_id: '',
    student_name: '',
    category: 'general',
    priority: 'normal',
    due_date: '',
    assigned_to: '',
    notes: '',
  });

  // Email notification
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [pendingEmailTodo, setPendingEmailTodo] = useState(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    Promise.all([fetchTodos(), fetchUsers(), fetchStudents()]);
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load to-do items.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('app_users').select('id, name, email, role');
      setUsers(data || []);
    } catch (e) { /* ignore */ }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase.from('students').select('id, first_name, last_name');
      setStudents(data || []);
    } catch (e) { /* ignore */ }
  };

  const openCreate = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      student_id: '',
      student_name: '',
      category: role === 'special_ed' ? 'special_ed' : 'general',
      priority: 'normal',
      due_date: '',
      assigned_to: currentUser?.id || '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title || '',
      description: todo.description || '',
      student_id: todo.student_id || '',
      student_name: todo.student_name || '',
      category: todo.category || 'general',
      priority: todo.priority || 'normal',
      due_date: todo.due_date || '',
      assigned_to: todo.assigned_to || '',
      notes: todo.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title is required.' });
      return;
    }
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        student_id: formData.student_id || null,
        student_name: formData.student_name || null,
        category: formData.category,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || currentUser?.id,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (editingTodo) {
        const { error } = await supabase.from('todos').update(payload).eq('id', editingTodo.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'To-do item updated.' });
      } else {
        payload.created_by = currentUser?.id;
        payload.status = 'pending';
        const { data, error } = await supabase.from('todos').insert([payload]).select();
        if (error) throw error;
        toast({ title: 'Created', description: 'New to-do item created.' });
        
        // Prompt to send email notification
        const savedTodo = data?.[0] || payload;
        promptEmailNotification(savedTodo);
      }
      
      setIsModalOpen(false);
      fetchTodos();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const promptEmailNotification = (todo) => {
    setPendingEmailTodo(todo);
    setShowEmailPrompt(true);
  };

  const sendNotificationEmail = () => {
    if (!pendingEmailTodo) return;
    const todo = pendingEmailTodo;
    const studentInfo = todo.student_name ? ` (Student: ${todo.student_name})` : '';
    setEmailSubject(`New Task: ${todo.title}`);
    setEmailBody(
      `A new task has been created:\n\n` +
      `Title: ${todo.title}\n` +
      `Category: ${todo.category}\n` +
      `Priority: ${todo.priority}\n` +
      (todo.description ? `Description: ${todo.description}\n` : '') +
      (todo.student_name ? `Student: ${todo.student_name}\n` : '') +
      (todo.due_date ? `Due: ${todo.due_date}\n` : '') +
      `\nCreated by: ${currentUser?.name || currentUser?.email || 'System'}`
    );
    setShowEmailPrompt(false);
    setIsEmailOpen(true);
  };

  const toggleStatus = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      const updatePayload = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      if (newStatus === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
        updatePayload.completed_by = currentUser?.id;
      } else {
        updatePayload.completed_at = null;
        updatePayload.completed_by = null;
      }
      const { error } = await supabase.from('todos').update(updatePayload).eq('id', todo.id);
      if (error) throw error;
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, ...updatePayload } : t));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('Delete this to-do item?')) return;
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Deleted', description: 'To-do removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  // Derived data
  const myTodos = useMemo(() => todos.filter(t => t.assigned_to === currentUser?.id), [todos, currentUser]);
  const allTodos = todos;

  const isAdmin = ['principal', 'principal_hebrew', 'principal_english', 'admin'].includes(role);

  const filterTodos = (list) => {
    return list.filter(t => {
      if (!showCompleted && t.status === 'completed') return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (t.title || '').toLowerCase().includes(q) ||
               (t.student_name || '').toLowerCase().includes(q) ||
               (t.description || '').toLowerCase().includes(q) ||
               (t.notes || '').toLowerCase().includes(q);
      }
      return true;
    });
  };

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u?.name || u?.email || 'Unknown';
  };

  const getPriorityIcon = (priority) => {
    const opt = PRIORITY_OPTIONS.find(p => p.value === priority);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon className={`h-4 w-4 ${opt.color}`} />;
  };

  const getCategoryBadge = (category) => {
    const opt = CATEGORY_OPTIONS.find(c => c.value === category);
    if (!opt) return <Badge variant="outline">{category}</Badge>;
    return <Badge className={opt.color}>{opt.label}</Badge>;
  };

  // Stats
  const pendingCount = myTodos.filter(t => t.status === 'pending').length;
  const urgentCount = myTodos.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const dueToday = myTodos.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return t.due_date === new Date().toISOString().split('T')[0];
  }).length;
  const overdue = myTodos.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return t.due_date < new Date().toISOString().split('T')[0];
  }).length;

  const renderTodoItem = (todo) => {
    const isCompleted = todo.status === 'completed';
    const isOverdue = todo.due_date && !isCompleted && todo.due_date < new Date().toISOString().split('T')[0];
    
    return (
      <div 
        key={todo.id} 
        className={`group flex items-start gap-3 p-4 border rounded-xl transition-all hover:shadow-sm ${
          isCompleted ? 'bg-slate-50 opacity-60' : 
          isOverdue ? 'bg-red-50 border-red-200' : 
          todo.priority === 'urgent' ? 'bg-amber-50 border-amber-200' : 
          'bg-white border-slate-200'
        }`}
      >
        {/* Checkbox */}
        <button onClick={() => toggleStatus(todo)} className="mt-0.5 flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className={`h-6 w-6 ${todo.priority === 'urgent' ? 'text-red-400' : 'text-slate-300'} hover:text-green-400 transition-colors`} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {todo.title}
            </span>
            {getPriorityIcon(todo.priority)}
            {getCategoryBadge(todo.category)}
            {isOverdue && <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>}
          </div>
          
          {todo.description && (
            <p className={`text-sm mt-1 ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
            {todo.student_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {todo.student_name}
              </span>
            )}
            {todo.due_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                <CalendarDays className="h-3 w-3" /> {todo.due_date}
              </span>
            )}
            {todo.assigned_to && todo.assigned_to !== currentUser?.id && (
              <span className="flex items-center gap-1">
                Assigned to: {getUserName(todo.assigned_to)}
              </span>
            )}
            {isCompleted && todo.completed_at && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Done {new Date(todo.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => openEdit(todo)} title="Edit">
            <ListTodo className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">To-Do List</h2>
          <p className="text-slate-600 mt-1">Track tasks, follow-ups, and action items</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><ListTodo className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-xs text-slate-500">Urgent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><CalendarDays className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{dueToday}</p>
              <p className="text-xs text-slate-500">Due Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-red-600">{overdue}</p>
              <p className="text-xs text-slate-500">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITY_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant={showCompleted ? 'default' : 'outline'} 
              onClick={() => setShowCompleted(!showCompleted)}
              className="whitespace-nowrap"
            >
              <CheckSquare className="mr-1 h-4 w-4" />
              {showCompleted ? 'Hide Done' : 'Show Done'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-todos">
            My Tasks ({filterTodos(myTodos).length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="all-todos">
              All Tasks ({filterTodos(allTodos).length})
            </TabsTrigger>
          )}
          <TabsTrigger value="by-student">
            By Student
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-todos">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : (
            <div className="space-y-2">
              {filterTodos(myTodos).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <CheckSquare className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No pending tasks</p>
                    <p className="text-slate-400 text-sm mt-1">Create a new task to get started</p>
                  </CardContent>
                </Card>
              ) : (
                filterTodos(myTodos).map(renderTodoItem)
              )}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all-todos">
            <div className="space-y-2">
              {filterTodos(allTodos).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <CheckSquare className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No tasks found</p>
                  </CardContent>
                </Card>
              ) : (
                filterTodos(allTodos).map(renderTodoItem)
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="by-student">
          {(() => {
            const studentTodos = {};
            filterTodos(activeTab === 'by-student' && isAdmin ? allTodos : myTodos).forEach(t => {
              const key = t.student_name || 'No Student';
              if (!studentTodos[key]) studentTodos[key] = [];
              studentTodos[key].push(t);
            });
            const studentNames = Object.keys(studentTodos).sort();
            if (studentNames.length === 0) {
              return (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <User className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No student-linked tasks</p>
                  </CardContent>
                </Card>
              );
            }
            return studentNames.map(name => (
              <div key={name} className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> {name}
                  <Badge variant="outline">{studentTodos[name].length}</Badge>
                </h3>
                <div className="space-y-2 ml-2">
                  {studentTodos[name].map(renderTodoItem)}
                </div>
              </div>
            ));
          })()}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTodo ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>
              {editingTodo ? 'Update task details.' : 'Create a new to-do item. You can link it to a student and assign it to someone.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Student (Optional)</Label>
                <Select 
                  value={formData.student_id} 
                  onValueChange={(v) => {
                    const s = students.find(s => s.id === v);
                    setFormData({ 
                      ...formData, 
                      student_id: v, 
                      student_name: s ? `${s.first_name} ${s.last_name}` : '' 
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                {isAdmin && (
                  <div className="grid gap-2">
                    <Label>Assign To</Label>
                    <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                      <SelectTrigger><SelectValue placeholder="Assign to..." /></SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingTodo ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Notification Prompt */}
      <Dialog open={showEmailPrompt} onOpenChange={setShowEmailPrompt}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" /> Send Notification?
            </DialogTitle>
            <DialogDescription>
              Would you like to send an email to notify someone about this new task?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmailPrompt(false)}>No, Skip</Button>
            <Button onClick={sendNotificationEmail} className="bg-blue-600 hover:bg-blue-700">
              <Mail className="mr-2 h-4 w-4" /> Yes, Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <SendEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        defaultSubject={emailSubject}
        defaultBody={emailBody}
        currentUser={currentUser}
        relatedType="todo"
        relatedId={pendingEmailTodo?.id}
      />
    </div>
  );
};

export default TodoListView;
