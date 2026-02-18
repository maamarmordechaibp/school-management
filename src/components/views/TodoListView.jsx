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
  Mail, CheckSquare, ListTodo, ArrowUp, ArrowRight, ArrowDown,
  Sun, Play, ExternalLink, Star, StarOff, Eye, RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import StudentProfileModal from '@/components/modals/StudentProfileModal';

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

const PRIORITY_SORT = { urgent: 0, high: 1, normal: 2, low: 3 };

const TodoListView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-day');
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

  // Student profile modal (for click-through)
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  // Today tracking (stored in localStorage per user per day)
  const todayKey = `todo_today_${currentUser?.id}_${new Date().toISOString().split('T')[0]}`;
  const [todayIds, setTodayIds] = useState(() => {
    try {
      const stored = localStorage.getItem(todayKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(todayKey, JSON.stringify(todayIds)); } catch {}
  }, [todayIds, todayKey]);

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
      const { data } = await supabase.from('students').select('id, first_name, last_name, hebrew_name');
      setStudents(data || []);
    } catch (e) { /* ignore */ }
  };

  // ─── Today Triage ────────────────────────────────────────────────
  const toggleTodayMark = (todoId) => {
    setTodayIds(prev => 
      prev.includes(todoId) ? prev.filter(id => id !== todoId) : [...prev, todoId]
    );
  };

  const markAllUrgentForToday = () => {
    const urgentIds = myTodos
      .filter(t => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high'))
      .map(t => t.id);
    const overdueIds = myTodos
      .filter(t => t.status !== 'completed' && t.due_date && t.due_date <= today)
      .map(t => t.id);
    setTodayIds(prev => [...new Set([...prev, ...urgentIds, ...overdueIds])]);
  };

  const clearToday = () => setTodayIds([]);

  // ─── CRUD ────────────────────────────────────────────────────────
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

  // ─── Status management ───────────────────────────────────────────
  const setStatus = async (todo, newStatus) => {
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

  const toggleStatus = (todo) => {
    if (todo.status === 'completed') {
      setStatus(todo, 'pending');
    } else if (todo.status === 'in_progress') {
      setStatus(todo, 'completed');
    } else {
      setStatus(todo, 'completed');
    }
  };

  const startTask = (todo) => setStatus(todo, 'in_progress');
  const completeTask = (todo) => setStatus(todo, 'completed');
  const reopenTask = (todo) => setStatus(todo, 'pending');

  const deleteTodo = async (id) => {
    if (!window.confirm('Delete this to-do item?')) return;
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      setTodos(prev => prev.filter(t => t.id !== id));
      setTodayIds(prev => prev.filter(tid => tid !== id));
      toast({ title: 'Deleted', description: 'To-do removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  // ─── Click-through to related items ──────────────────────────────
  const openRelatedItem = (todo) => {
    if (todo.student_id) {
      setSelectedStudentId(todo.student_id);
      setIsStudentProfileOpen(true);
      return;
    }
    openEdit(todo);
  };

  // ─── Derived data ────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
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

  // My Day: items marked for today, sorted by priority
  const myDayTodos = useMemo(() => {
    const markedForToday = myTodos.filter(t => todayIds.includes(t.id) && t.status !== 'completed');
    return markedForToday.sort((a, b) => (PRIORITY_SORT[a.priority] || 2) - (PRIORITY_SORT[b.priority] || 2));
  }, [myTodos, todayIds]);

  // Items that NEED attention: overdue + due today + urgent (not yet marked for today)
  const needsAttention = useMemo(() => {
    return myTodos.filter(t => {
      if (t.status === 'completed') return false;
      if (todayIds.includes(t.id)) return false;
      const isOverdue = t.due_date && t.due_date < today;
      const isDueToday = t.due_date === today;
      const isUrgent = t.priority === 'urgent';
      return isOverdue || isDueToday || isUrgent;
    }).sort((a, b) => (PRIORITY_SORT[a.priority] || 2) - (PRIORITY_SORT[b.priority] || 2));
  }, [myTodos, todayIds, today]);

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
  const pendingCount = myTodos.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const urgentCount = myTodos.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const dueTodayCount = myTodos.filter(t => t.due_date === today && t.status !== 'completed').length;
  const overdueCount = myTodos.filter(t => t.due_date && t.due_date < today && t.status !== 'completed').length;
  const inProgressCount = myTodos.filter(t => t.status === 'in_progress').length;
  const todayCount = myDayTodos.length;

  // ─── Render a single todo item ───────────────────────────────────
  const StatusIcon = ({ todo }) => {
    if (todo.status === 'completed') {
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    }
    if (todo.status === 'in_progress') {
      return (
        <div className="relative">
          <Circle className="h-6 w-6 text-blue-400" />
          <Play className="h-3 w-3 text-blue-500 absolute top-1.5 left-1.5" />
        </div>
      );
    }
    return <Circle className={`h-6 w-6 ${todo.priority === 'urgent' ? 'text-red-400' : 'text-slate-300'} hover:text-green-400 transition-colors`} />;
  };

  const renderTodoItem = (todo, { showTodayToggle = false, compact = false } = {}) => {
    const isCompleted = todo.status === 'completed';
    const isInProgress = todo.status === 'in_progress';
    const isOverdue = todo.due_date && !isCompleted && todo.due_date < today;
    const isMarkedForToday = todayIds.includes(todo.id);
    const hasStudent = !!todo.student_id;
    
    return (
      <div 
        key={todo.id} 
        className={`group flex items-start gap-3 p-4 border rounded-xl transition-all hover:shadow-md ${
          isCompleted ? 'bg-slate-50 opacity-60' : 
          isInProgress ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' :
          isOverdue ? 'bg-red-50 border-red-200' : 
          todo.priority === 'urgent' ? 'bg-amber-50 border-amber-200' : 
          isMarkedForToday ? 'bg-yellow-50/50 border-yellow-200' :
          'bg-white border-slate-200'
        }`}
      >
        {/* Checkbox / Status */}
        <button onClick={() => toggleStatus(todo)} className="mt-0.5 flex-shrink-0" title={isCompleted ? 'Reopen' : isInProgress ? 'Complete' : 'Complete'}>
          <StatusIcon todo={todo} />
        </button>

        {/* Content — clickable to open related student */}
        <div 
          className={`flex-1 min-w-0 ${hasStudent ? 'cursor-pointer' : ''}`} 
          onClick={() => hasStudent ? openRelatedItem(todo) : null}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {todo.title}
            </span>
            {getPriorityIcon(todo.priority)}
            {getCategoryBadge(todo.category)}
            {isOverdue && <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>}
            {isInProgress && <Badge className="bg-blue-100 text-blue-700 text-xs">In Progress</Badge>}
            {isMarkedForToday && !compact && <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Sun className="h-3 w-3 mr-0.5 inline" />Today</Badge>}
          </div>
          
          {todo.description && !compact && (
            <p className={`text-sm mt-1 ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
            {todo.student_name && (
              <span className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                <User className="h-3 w-3" /> {todo.student_name}
                <ExternalLink className="h-3 w-3" />
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

        {/* Quick Actions */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          {/* Mark for Today toggle */}
          {showTodayToggle && !isCompleted && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleTodayMark(todo.id)} 
              title={isMarkedForToday ? 'Remove from My Day' : 'Add to My Day'}
              className={isMarkedForToday ? 'text-yellow-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'}
            >
              {isMarkedForToday ? <Star className="h-4 w-4 fill-yellow-400" /> : <StarOff className="h-4 w-4" />}
            </Button>
          )}
          
          {/* Start working */}
          {!isCompleted && !isInProgress && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => startTask(todo)} 
              title="Start working on this"
              className="text-slate-400 opacity-0 group-hover:opacity-100"
            >
              <Play className="h-4 w-4 text-blue-500" />
            </Button>
          )}

          {/* Reopen */}
          {isCompleted && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => reopenTask(todo)} 
              title="Reopen task"
              className="opacity-0 group-hover:opacity-100"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
            </Button>
          )}

          {/* Edit */}
          <Button variant="ghost" size="sm" onClick={() => openEdit(todo)} title="Edit" className="opacity-0 group-hover:opacity-100">
            <ListTodo className="h-4 w-4 text-blue-500" />
          </Button>

          {/* Delete */}
          <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)} title="Delete" className="opacity-0 group-hover:opacity-100">
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">To-Do List</h2>
          <p className="text-slate-600 mt-1">Your morning planner — triage, work through, and track progress</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('my-day')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Sun className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xl font-bold">{todayCount}</p>
              <p className="text-xs text-slate-500">My Day</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('my-todos'); setFilterPriority('all'); }}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><ListTodo className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xl font-bold">{pendingCount}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('my-todos'); setFilterPriority('urgent'); }}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xl font-bold">{urgentCount}</p>
              <p className="text-xs text-slate-500">Urgent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><Play className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <p className="text-xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><CalendarDays className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xl font-bold">{dueTodayCount}</p>
              <p className="text-xs text-slate-500">Due Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xl font-bold text-red-600">{overdueCount}</p>
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
          <TabsTrigger value="my-day" className="flex items-center gap-1">
            <Sun className="h-4 w-4" /> My Day ({todayCount})
          </TabsTrigger>
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

        {/* ═══ MY DAY ═══ */}
        <TabsContent value="my-day">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : (
            <div className="space-y-6">
              {/* Quick triage buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" onClick={markAllUrgentForToday} className="text-xs">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-500" /> Add Urgent & Overdue
                </Button>
                {todayIds.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearToday} className="text-xs text-slate-500">
                    Clear My Day
                  </Button>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  Star tasks from "My Tasks" to add them here, or use the button above
                </span>
              </div>

              {/* Needs Attention section */}
              {needsAttention.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-red-700 text-sm uppercase tracking-wide">Needs Attention</h3>
                    <Badge className="bg-red-100 text-red-700 text-xs">{needsAttention.length}</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-auto text-xs"
                      onClick={() => {
                        const ids = needsAttention.map(t => t.id);
                        setTodayIds(prev => [...new Set([...prev, ...ids])]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add All to My Day
                    </Button>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-red-200">
                    {needsAttention.map(todo => (
                      <div key={todo.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderTodoItem(todo, { compact: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Day tasks */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Today's Plan</h3>
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">{myDayTodos.length}</Badge>
                </div>
                {myDayTodos.length === 0 && needsAttention.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Sun className="h-12 w-12 text-yellow-300 mb-3" />
                      <p className="text-slate-500 font-medium">No tasks planned for today</p>
                      <p className="text-slate-400 text-sm mt-1">Go to "My Tasks" and star the items you want to work on today</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {myDayTodos.map(todo => renderTodoItem(todo, { showTodayToggle: true }))}
                  </div>
                )}

                {/* Completed today */}
                {(() => {
                  const completedToday = myTodos.filter(t => 
                    t.status === 'completed' && 
                    t.completed_at && 
                    t.completed_at.split('T')[0] === today
                  );
                  if (completedToday.length === 0) return null;
                  return (
                    <div className="mt-6">
                      <h3 className="font-semibold text-green-700 text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4" /> Completed Today
                        <Badge className="bg-green-100 text-green-700 text-xs">{completedToday.length}</Badge>
                      </h3>
                      <div className="space-y-2 opacity-60">
                        {completedToday.map(todo => renderTodoItem(todo))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ MY TASKS ═══ */}
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
                filterTodos(myTodos)
                  .sort((a, b) => (PRIORITY_SORT[a.priority] || 2) - (PRIORITY_SORT[b.priority] || 2))
                  .map(todo => renderTodoItem(todo, { showTodayToggle: true }))
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ ALL TASKS (admin) ═══ */}
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
                filterTodos(allTodos)
                  .sort((a, b) => (PRIORITY_SORT[a.priority] || 2) - (PRIORITY_SORT[b.priority] || 2))
                  .map(todo => renderTodoItem(todo, { showTodayToggle: true }))
              )}
            </div>
          </TabsContent>
        )}

        {/* ═══ BY STUDENT ═══ */}
        <TabsContent value="by-student">
          {(() => {
            const studentTodos = {};
            filterTodos(activeTab === 'by-student' && isAdmin ? allTodos : myTodos).forEach(t => {
              const key = t.student_name || 'No Student';
              if (!studentTodos[key]) studentTodos[key] = { todos: [], studentId: t.student_id };
              studentTodos[key].todos.push(t);
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
                  <User className="h-4 w-4" /> 
                  {studentTodos[name].studentId ? (
                    <button 
                      className="text-blue-600 hover:underline flex items-center gap-1"
                      onClick={() => { setSelectedStudentId(studentTodos[name].studentId); setIsStudentProfileOpen(true); }}
                    >
                      {name} <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : name}
                  <Badge variant="outline">{studentTodos[name].todos.length}</Badge>
                </h3>
                <div className="space-y-2 ml-2">
                  {studentTodos[name].todos.map(todo => renderTodoItem(todo, { showTodayToggle: true }))}
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
                  value={formData.student_id || '__none__'} 
                  onValueChange={(v) => {
                    const actualVal = v === '__none__' ? '' : v;
                    const s = students.find(s => s.id === actualVal);
                    setFormData({ 
                      ...formData, 
                      student_id: actualVal, 
                      student_name: s ? `${s.first_name} ${s.last_name}` : '' 
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
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

      {/* Student Profile Modal (click-through from tasks) */}
      {selectedStudentId && (
        <StudentProfileModal
          isOpen={isStudentProfileOpen}
          onClose={() => { setIsStudentProfileOpen(false); setSelectedStudentId(null); }}
          studentId={selectedStudentId}
        />
      )}
    </div>
  );
};

export default TodoListView;
