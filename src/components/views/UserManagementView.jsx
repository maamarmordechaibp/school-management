import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Shield, Trash2, Mail, User, CheckCircle, XCircle, Loader2, KeyRound, Edit, Search, Settings2, GripVertical, Plus, X, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ROLE_OPTIONS = [
  { value: 'principal', label: 'Principal (General)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'principal_hebrew', label: 'Principal Hebrew', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'principal_english', label: 'Principal English', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'teacher', label: 'Teacher (General)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'teacher_hebrew', label: 'Teacher Hebrew', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'teacher_english', label: 'Teacher English', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'tutor', label: 'Tutor', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'special_ed', label: 'Special Education', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

// All possible menu/feature permissions that can be toggled per user
const ALL_PERMISSIONS = [
  { id: 'students', label: 'Students', icon: '👥', category: 'Core' },
  { id: 'todos', label: 'To-Do List', icon: '✅', category: 'Core' },
  { id: 'grades', label: 'Grades', icon: '📊', category: 'Academic' },
  { id: 'classes', label: 'Classes', icon: '🏫', category: 'Academic' },
  { id: 'class-detail', label: 'Class Detail', icon: '📖', category: 'Academic' },
  { id: 'issues', label: 'Issues', icon: '⚠️', category: 'Communication' },
  { id: 'calls', label: 'Phone Calls', icon: '📞', category: 'Communication' },
  { id: 'meetings', label: 'Meetings', icon: '📅', category: 'Communication' },
  { id: 'staff', label: 'Staff Directory', icon: '📋', category: 'Admin' },
  { id: 'users', label: 'User Management', icon: '🛡️', category: 'Admin' },
  { id: 'special-ed', label: 'Special Education', icon: '💜', category: 'Special' },
  { id: 'late-tracking', label: 'Late Tracking', icon: '⏰', category: 'Operations' },
  { id: 'bus-changes', label: 'Bus Changes', icon: '🚌', category: 'Operations' },
  { id: 'reminders', label: 'Reminders', icon: '🔔', category: 'Communication' },
  { id: 'books', label: 'Books', icon: '📚', category: 'Financial' },
  { id: 'fees', label: 'Fees & Trips', icon: '💰', category: 'Financial' },
  { id: 'payments', label: 'Payments', icon: '🧾', category: 'Financial' },
  { id: 'financial-reports', label: 'Financial Reports', icon: '📈', category: 'Financial' },
  { id: 'reports', label: 'Reports', icon: '📊', category: 'Admin' },
  { id: 'settings', label: 'Settings', icon: '⚙️', category: 'Admin' },
];

const CATEGORY_COLORS = {
  Core: 'bg-blue-50 border-blue-200 text-blue-700',
  Academic: 'bg-purple-50 border-purple-200 text-purple-700',
  Communication: 'bg-green-50 border-green-200 text-green-700',
  Admin: 'bg-red-50 border-red-200 text-red-700',
  Special: 'bg-orange-50 border-orange-200 text-orange-700',
  Operations: 'bg-teal-50 border-teal-200 text-teal-700',
  Financial: 'bg-amber-50 border-amber-200 text-amber-700',
};

// ─── Drag-and-Drop Permission Item ──────────────────────────────────────
const DraggablePermission = ({ perm, onDragStart, onDragEnd, isAssigned, onRemove, onAdd }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', perm.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(perm.id);
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-150 select-none group ${
        isAssigned
          ? 'bg-green-50 border-green-300 hover:border-green-400 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 group-hover:text-slate-600" />
      <span className="text-base flex-shrink-0">{perm.icon}</span>
      <span className="text-sm font-medium text-slate-700 flex-1 truncate">{perm.label}</span>
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[perm.category] || ''}`}>
        {perm.category}
      </Badge>
      {isAssigned ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove?.(perm.id); }}
          className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-red-100 transition-opacity"
          title="Remove permission"
        >
          <X className="h-3.5 w-3.5 text-red-500" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAdd?.(perm.id); }}
          className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-green-100 transition-opacity"
          title="Add permission"
        >
          <Plus className="h-3.5 w-3.5 text-green-600" />
        </button>
      )}
    </div>
  );
};

// ─── Drop Zone Container ─────────────────────────────────────────────────
const DropZone = ({ children, onDrop, isOver, title, icon: Icon, count, emptyMessage, className = '' }) => {
  const [dragOver, setDragOver] = useState(false);
  
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData('text/plain'); onDrop?.(id); }}
      className={`flex flex-col rounded-xl border-2 transition-all duration-200 ${
        dragOver ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-[1.01]' : 'border-slate-200 bg-slate-50/50'
      } ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white rounded-t-xl">
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <Badge className="ml-auto text-xs bg-slate-100 text-slate-600 border-slate-200">{count}</Badge>
      </div>
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto min-h-[120px] max-h-[320px]">
        {children}
        {count === 0 && (
          <div className={`flex items-center justify-center h-24 text-sm text-slate-400 border-2 border-dashed rounded-lg ${
            dragOver ? 'border-blue-300 text-blue-400' : 'border-slate-200'
          }`}>
            {dragOver ? 'Drop here!' : emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'teacher',
    assigned_class: '' 
  });
  const [creating, setCreating] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [sendingReset, setSendingReset] = useState(null);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users list."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          assigned_class: newUser.assigned_class || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      if (result.warning) {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: result.warning
        });
      } else {
        toast({
          title: "User Created",
          description: `Account for ${newUser.email} has been created with role: ${ROLE_OPTIONS.find(r => r.value === newUser.role)?.label || newUser.role}.`
        });
      }
      
      setIsModalOpen(false);
      setNewUser({ email: '', password: '', name: '', role: 'teacher', assigned_class: '' });
      fetchUsers();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setUpdatingRole(true);

    try {
      // Save role via backend API
      const response = await fetch('/api/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editingUser.role,
          assigned_class: editingUser.assigned_class || null
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update role');

      // Save custom_permissions directly to Supabase
      const { error: permErr } = await supabase
        .from('app_users')
        .update({ custom_permissions: editingUser.custom_permissions || null })
        .eq('id', editingUser.id);
      
      if (permErr) console.error('Could not save custom_permissions:', permErr);

      toast({ title: "User Updated", description: `${editingUser.name || editingUser.email}'s role and permissions updated.` });
      setIsEditRoleOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setUpdatingRole(false);
    }
  };

  const openEditRole = (user) => {
    setEditingUser({ 
      ...user, 
      custom_permissions: user.custom_permissions || {} 
    });
    setIsEditRoleOpen(true);
  };

  // ─── Drag-and-drop permission handlers ─────────────────────────────
  const grantPermission = (permId) => {
    if (!editingUser) return;
    const newPerms = { ...editingUser.custom_permissions };
    newPerms[permId] = true;
    setEditingUser({ ...editingUser, custom_permissions: newPerms });
  };

  const removePermission = (permId) => {
    if (!editingUser) return;
    const newPerms = { ...editingUser.custom_permissions };
    delete newPerms[permId]; // Back to role default (unassigned)
    setEditingUser({ ...editingUser, custom_permissions: newPerms });
  };

  const handleDropToAssigned = (permId) => {
    grantPermission(permId);
  };

  const handleDropToAvailable = (permId) => {
    removePermission(permId);
  };

  const grantAll = () => {
    if (!editingUser) return;
    const newPerms = {};
    ALL_PERMISSIONS.forEach(p => { newPerms[p.id] = true; });
    setEditingUser({ ...editingUser, custom_permissions: newPerms });
  };

  const removeAll = () => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, custom_permissions: {} });
  };

  // Compute which permissions are assigned vs available
  const getPermissionLists = () => {
    if (!editingUser) return { assigned: [], available: [] };
    const perms = editingUser.custom_permissions || {};
    const assigned = ALL_PERMISSIONS.filter(p => perms[p.id] === true);
    const available = ALL_PERMISSIONS.filter(p => perms[p.id] !== true);
    return { assigned, available };
  };

  const deleteUser = async (userId) => {
    if(!window.confirm("Are you sure? This will remove the user's access.")) return;

    try {
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      
      toast({ title: "User Removed", description: "The user has been deleted from the system." });
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete user." });
    }
  };

  const resetPassword = async (user) => {
      if(!window.confirm(`Send password reset email to ${user.email}?`)) return;
      
      setSendingReset(user.id);
      try {
          const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
              redirectTo: window.location.origin + '/reset-password',
          });
          
          if (error) throw error;
          
          toast({
              title: "Email Sent",
              description: `Password reset instructions sent to ${user.email}`,
          });
      } catch (error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
      } finally {
          setSendingReset(null);
      }
  };

  const getRoleBadge = (role) => {
    const option = ROLE_OPTIONS.find(r => r.value === role);
    if (!option) return <Badge className="bg-gray-100 text-gray-800">{role ? role.toUpperCase() : 'UNKNOWN'}</Badge>;
    return <Badge className={option.color}>{option.label}</Badge>;
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) ||
           (u.email || '').toLowerCase().includes(q) ||
           (u.role || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-600 mt-1">Manage principals, teachers, tutors, and system access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
           <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Principals & Admins</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-bold">{users.filter(u => ['admin', 'principal', 'principal_hebrew', 'principal_english'].includes(u.role)).length}</div></CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Teachers & Tutors</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-bold">{users.filter(u => ['teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'special_ed'].includes(u.role)).length}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All System Users</CardTitle>
          <CardDescription>View and manage all registered accounts. Click Edit to change roles.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{u.name || 'Unknown Name'}</span>
                        <span className="text-xs text-slate-500">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.assigned_class ? (
                        <Badge variant="outline" className="text-xs">{u.assigned_class}</Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                      {u.custom_permissions && Object.keys(u.custom_permissions).length > 0 && (
                        <Badge className="ml-1 bg-indigo-100 text-indigo-700 text-xs">
                          <Settings2 className="h-3 w-3 mr-0.5" />{Object.keys(u.custom_permissions).length} custom
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openEditRole(u)}
                                title="Edit Role"
                            >
                                <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => resetPassword(u)}
                                disabled={sendingReset === u.id}
                                title="Send Password Reset Email"
                            >
                                {sendingReset === u.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <KeyRound className="h-4 w-4 text-slate-500" />}
                            </Button>
                           {currentUser?.id !== u.id && (
                             <Button variant="ghost" size="sm" onClick={() => deleteUser(u.id)} className="text-slate-400 hover:text-red-600">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to log in with the email and password you set.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Rabbi Cohen" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@school.edu" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={val => setNewUser({...newUser, role: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'special_ed'].includes(newUser.role) && (
                <div className="grid gap-2">
                   <Label htmlFor="class">Assigned Class (Optional)</Label>
                   <Input id="class" value={newUser.assigned_class} onChange={e => setNewUser({...newUser, assigned_class: e.target.value})} placeholder="e.g. Grade 5" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role & Permissions Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Edit User Role & Permissions
            </DialogTitle>
            <DialogDescription>
              Change role and drag permissions to assign or remove access for {editingUser?.name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (() => {
            const { assigned, available } = getPermissionLists();
            return (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Current User</Label>
                <div className="text-sm text-slate-600 font-medium">{editingUser.name} — <span className="text-slate-400">{editingUser.email}</span></div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editRole">Role</Label>
                <Select value={editingUser.role || ''} onValueChange={val => setEditingUser({...editingUser, role: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'special_ed'].includes(editingUser.role) && (
                <div className="grid gap-2">
                  <Label htmlFor="editClass">Assigned Class (Optional)</Label>
                  <Input 
                    id="editClass" 
                    value={editingUser.assigned_class || ''} 
                    onChange={e => setEditingUser({...editingUser, assigned_class: e.target.value})} 
                    placeholder="e.g. Grade 5" 
                  />
                </div>
              )}
              
              {/* Drag & Drop Permissions */}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4" /> Feature Permissions
                  </Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={grantAll} className="text-xs h-7">
                      <Plus className="h-3 w-3 mr-1" /> Grant All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={removeAll} className="text-xs h-7">
                      <X className="h-3 w-3 mr-1" /> Clear All
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Drag permissions between the two panels, or click the +/× buttons. Assigned permissions override role defaults.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Available (unassigned) permissions */}
                  <DropZone
                    title="Available Permissions"
                    icon={Unlock}
                    count={available.length}
                    emptyMessage="All permissions assigned"
                    onDrop={handleDropToAvailable}
                  >
                    {available.map(perm => (
                      <DraggablePermission
                        key={perm.id}
                        perm={perm}
                        isAssigned={false}
                        onAdd={grantPermission}
                      />
                    ))}
                  </DropZone>

                  {/* Assigned permissions */}
                  <DropZone
                    title="Assigned Permissions"
                    icon={Lock}
                    count={assigned.length}
                    emptyMessage="Drag permissions here to assign"
                    onDrop={handleDropToAssigned}
                    className="border-green-200"
                  >
                    {assigned.map(perm => (
                      <DraggablePermission
                        key={perm.id}
                        perm={perm}
                        isAssigned={true}
                        onRemove={removePermission}
                      />
                    ))}
                  </DropZone>
                </div>
              </div>
            </div>
            );
          })()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={updatingRole}>
              {updatingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementView;