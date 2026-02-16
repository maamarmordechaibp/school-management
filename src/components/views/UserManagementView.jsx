import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Shield, Trash2, Mail, User, CheckCircle, XCircle, Loader2, KeyRound, Edit, Search } from 'lucide-react';
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

      toast({
        title: "User Created",
        description: `Account for ${newUser.email} has been created successfully.`
      });
      
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

      toast({ title: "Role Updated", description: `${editingUser.name || editingUser.email}'s role updated to ${editingUser.role}` });
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
    setEditingUser({ ...user });
    setIsEditRoleOpen(true);
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

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change role and class assignment for {editingUser?.name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Current User</Label>
                <div className="text-sm text-slate-600">{editingUser.name} — {editingUser.email}</div>
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
            </div>
          )}
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