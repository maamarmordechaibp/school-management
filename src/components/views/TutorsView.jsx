import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Loader2, BookOpen, Edit, Users, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TutorsView = ({ role, currentUser }) => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    first_name: '',
    last_name: '',
    phone: ''
  });
  
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTutors();
    fetchStudents();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select(`
          *,
          tutor_assignments:tutor_assignments(
            id,
            is_active,
            student:students(id, first_name, last_name)
          )
        `)
        .eq('role', 'tutor')
        .order('last_name', { ascending: true });

      if (error) throw error;
      
      // Count active assignments
      const tutorsWithCount = (data || []).map(t => ({
        ...t,
        student_count: t.tutor_assignments?.filter(a => a.is_active).length || 0
      }));
      
      setTutors(tutorsWithCount);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tutors list."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, class:classes!class_id(name)')
      .eq('is_active', true)
      .order('last_name');
    setStudents(data || []);
  };

  const handleCreateTutor = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: 'tutor'
        }
      });

      if (error) throw new Error(error.message || 'Function invocation failed');
      if (data && data.error) throw new Error(data.error);

      toast({
        title: "Tutor Created",
        description: `Account for ${formData.first_name} ${formData.last_name} created successfully.`
      });
      
      setIsModalOpen(false);
      resetForm();
      fetchTutors();
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

  const handleUpdateTutor = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.from('app_users').update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone
      }).eq('id', selectedTutor.id);

      if (error) throw error;
      toast({ title: "Updated", description: "Tutor details updated." });
      setIsEditModalOpen(false);
      fetchTutors();
    } catch(error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setCreating(false);
    }
  };

  const deleteTutor = async (userId) => {
    if (!window.confirm("Are you sure? This will remove the tutor's access and all assignments.")) return;

    try {
      // First remove assignments
      await supabase.from('tutor_assignments').delete().eq('tutor_id', userId);
      
      // Then delete user
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      
      toast({ title: "Tutor Removed", description: "The tutor has been removed." });
      fetchTutors();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete tutor." });
    }
  };

  const openEdit = (tutor) => {
    setSelectedTutor(tutor);
    setFormData({ 
      first_name: tutor.first_name || '', 
      last_name: tutor.last_name || '',
      email: tutor.email || '', 
      phone: tutor.phone || '',
      password: '' 
    });
    setIsEditModalOpen(true);
  };

  const openAssign = async (tutor) => {
    setSelectedTutor(tutor);
    
    // Get current assignments
    const { data } = await supabase
      .from('tutor_assignments')
      .select('student_id')
      .eq('tutor_id', tutor.id)
      .eq('is_active', true);
    
    setAssignedStudents(data?.map(d => d.student_id) || []);
    setIsAssignModalOpen(true);
  };

  const toggleStudentAssignment = (studentId) => {
    setAssignedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const saveAssignments = async () => {
    setCreating(true);
    try {
      // Deactivate all current assignments
      await supabase
        .from('tutor_assignments')
        .update({ is_active: false })
        .eq('tutor_id', selectedTutor.id);
      
      // Create new assignments
      if (assignedStudents.length > 0) {
        for (const studentId of assignedStudents) {
          await supabase
            .from('tutor_assignments')
            .upsert({
              tutor_id: selectedTutor.id,
              student_id: studentId,
              is_active: true
            }, { onConflict: 'student_id,tutor_id' });
        }
      }

      toast({ title: "Assignments Saved", description: `${assignedStudents.length} students assigned.` });
      setIsAssignModalOpen(false);
      fetchTutors();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      email: '', 
      password: '', 
      first_name: '',
      last_name: '',
      phone: ''
    });
  };

  // Stats
  const totalStudentsAssigned = tutors.reduce((sum, t) => sum + t.student_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Tutors Management</h2>
          <p className="text-slate-600 mt-1">Manage tutors and their student assignments</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-green-600 hover:bg-green-700">
          <UserPlus className="mr-2 h-4 w-4" /> Add New Tutor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tutors.length}</p>
              <p className="text-sm text-slate-500">Total Tutors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudentsAssigned}</p>
              <p className="text-sm text-slate-500">Students Assigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <User className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tutors.length > 0 ? (totalStudentsAssigned / tutors.length).toFixed(1) : 0}
              </p>
              <p className="text-sm text-slate-500">Avg Students/Tutor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tutors List</CardTitle>
          <CardDescription>All registered tutors and their assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-green-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-medium">
                          {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{u.first_name} {u.last_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={u.student_count > 0 ? "default" : "secondary"}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => openAssign(u)}
                      >
                        {u.student_count} students
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openAssign(u)} className="mr-1 text-slate-500 hover:text-green-600">
                        <Users className="h-4 w-4 mr-1" /> Assign
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="mr-1 text-slate-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTutor(u.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tutors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No tutors found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Tutor</DialogTitle>
            <DialogDescription>Create a new account for a tutor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTutor}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name" 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name" 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tutor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTutor}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first_name">First Name</Label>
                  <Input 
                    id="edit-first_name" 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last_name">Last Name</Label>
                  <Input 
                    id="edit-last_name" 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input 
                  id="edit-phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Students Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Students to {selectedTutor?.first_name} {selectedTutor?.last_name}</DialogTitle>
            <DialogDescription>Select students for this tutor to work with.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-md max-h-[400px] overflow-y-auto">
              {students.map(s => (
                <label 
                  key={s.id} 
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 ${assignedStudents.includes(s.id) ? 'bg-green-50' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={assignedStudents.includes(s.id)}
                    onChange={() => toggleStudentAssignment(s.id)}
                    className="rounded border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-slate-500">{s.class?.name || 'No class'}</p>
                  </div>
                </label>
              ))}
              {students.length === 0 && (
                <p className="p-4 text-center text-slate-500">No students available</p>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {assignedStudents.length} students selected
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAssignments} disabled={creating} className="bg-green-600 hover:bg-green-700">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorsView;
