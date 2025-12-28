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
import { UserPlus, Shield, Trash2, Mail, User, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'teacher',
    assigned_class: '' 
  });
  const [creating, setCreating] = useState(false);
  const [sendingReset, setSendingReset] = useState(null); // stores user ID of pending reset
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Current logged in user

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
      // Use Edge Function if available for creating user without login side-effects
      // or fallback to client side signUp (which might log you out or switch session)
      
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
            email: newUser.email,
            password: newUser.password,
            name: newUser.name,
            role: newUser.role
        }
      });

      if (error) {
         // Fallback if function fails or not deployed
         console.warn("Edge function failed, trying fallback...", error);
         throw new Error("User creation via admin function failed. Please ensure the backend is configured.");
      }

      if (data && data.error) throw new Error(data.error);

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
    const styles = {
      admin: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
      principal: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
      teacher: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
      tutor: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
    };
    return <Badge className={styles[role] || "bg-gray-100 text-gray-800"}>{role ? role.toUpperCase() : 'UNKNOWN'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-600 mt-1">Manage principals, teachers, and tutors</p>
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
           <CardContent><div className="text-2xl font-bold">{users.filter(u => ['admin', 'principal'].includes(u.role)).length}</div></CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Teachers & Tutors</CardTitle></CardHeader>
           <CardContent><div className="text-2xl font-bold">{users.filter(u => ['teacher', 'tutor'].includes(u.role)).length}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All System Users</CardTitle>
          <CardDescription>View and manage all registered accounts.</CardDescription>
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
                {users.map((u) => (
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
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system.
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
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {['teacher', 'tutor'].includes(newUser.role) && (
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
    </div>
  );
};

export default UserManagementView;