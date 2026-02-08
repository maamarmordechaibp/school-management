import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StudentPicker from '@/components/ui/student-picker';
import { useToast } from '@/components/ui/use-toast';
import SendEmailModal from '@/components/modals/SendEmailModal';
import {
  Bus, Plus, Edit, Trash2, Printer, Search, Calendar, Users,
  MapPin, Clock, Mail, Loader2, AlertCircle, RefreshCw, Route
} from 'lucide-react';

const BusChangesView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('changes');
  
  // Data
  const [busRoutes, setBusRoutes] = useState([]);
  const [busChanges, setBusChanges] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [changeTypeFilter, setChangeTypeFilter] = useState('all');
  
  // Modals
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  
  // Forms
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    route_name: '', route_number: '', driver_name: '', driver_phone: ''
  });
  const [changeForm, setChangeForm] = useState({
    student_id: '', change_date: new Date().toISOString().split('T')[0],
    original_bus_id: '', new_bus_id: '', change_type: 'one_time',
    reason: '', pickup_address: '', effective_from: '', effective_until: '', notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesRes, changesRes, studentsRes] = await Promise.all([
        supabase.from('bus_routes').select('*').eq('is_active', true).order('route_name'),
        supabase.from('bus_changes').select(`
          *,
          student:students(id, first_name, last_name, hebrew_name, class_id,
            class:classes!class_id(name)),
          original_bus:bus_routes!original_bus_id(route_name, route_number),
          new_bus:bus_routes!new_bus_id(route_name, route_number)
        `).gte('change_date', selectedDate).order('change_date', { ascending: true }),
        supabase.from('students').select('id, first_name, last_name, hebrew_name, class_id, class:classes!class_id(name)').eq('status', 'active').order('last_name')
      ]);

      setBusRoutes(routesRes.data || []);
      setBusChanges(changesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save Route
  const handleSaveRoute = async () => {
    if (!routeForm.route_name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a route name' });
      return;
    }
    try {
      if (editingRoute) {
        const { error } = await supabase.from('bus_routes').update(routeForm).eq('id', editingRoute.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bus_routes').insert([routeForm]);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: 'Bus route saved successfully' });
      setIsRouteModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Pre-fill bus route when student is selected
  const handleStudentSelectedForChange = async (studentId) => {
    setChangeForm(prev => ({ ...prev, student_id: studentId, original_bus_id: '' }));
    if (!studentId) return;
    try {
      const { data } = await supabase
        .from('student_bus_assignments')
        .select('bus_route_id')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();
      if (data?.bus_route_id) {
        setChangeForm(prev => ({ ...prev, original_bus_id: data.bus_route_id }));
      }
    } catch (err) {
      // No active assignment found, leave original_bus_id empty
    }
  };

  // Save Change
  const handleSaveChange = async () => {
    if (!changeForm.student_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a student' });
      return;
    }
    try {
      const { error } = await supabase.from('bus_changes').insert([{
        ...changeForm,
        original_bus_id: changeForm.original_bus_id || null,
        new_bus_id: changeForm.new_bus_id || null,
        effective_from: changeForm.effective_from || changeForm.change_date,
        effective_until: changeForm.effective_until || null,
        created_by: currentUser?.id
      }]);
      if (error) throw error;
      toast({ title: 'New Change', description: 'Bus change recorded' });
      setIsChangeModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Print bus changes
  const printChanges = () => {
    const todayChanges = busChanges.filter(c => c.change_date === selectedDate);
    if (todayChanges.length === 0) {
      toast({ title: 'Info', description: 'No changes for today' });
      return;
    }

    const html = `
      <html dir="rtl">
      <head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
        th { background: #f0f0f0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style></head>
      <body>
        <h1>Bus Changes - ${new Date(selectedDate).toLocaleDateString('en-US')}</h1>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>From Bus</th>
              <th>To Bus</th>
              <th>Type</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${todayChanges.map(c => `
              <tr>
                <td>${c.student?.hebrew_name || `${c.student?.first_name} ${c.student?.last_name}`}</td>
                <td>${c.student?.class?.name || 'N/A'}</td>
                <td>${c.original_bus?.route_name || '-'}</td>
                <td>${c.new_bus?.route_name || '-'}</td>
                <td>${c.change_type === 'one_time' ? 'One Time' : c.change_type === 'temporary' ? 'Temporary' : 'Permanent'}</td>
                <td>${c.reason || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Printed from system</div>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Delete route
  const deleteRoute = async (id) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('bus_routes').update({ is_active: false }).eq('id', id);
    loadData();
  };

  // Filter changes
  const filteredChanges = busChanges.filter(c => {
    const matchesType = changeTypeFilter === 'all' || c.change_type === changeTypeFilter;
    return matchesType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bus Changes</h1>
          <p className="text-slate-500">Create and print bus changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printChanges}>
            <Printer className="h-4 w-4 ml-2" /> Print
          </Button>
          <Button variant="outline" onClick={() => {
            setEditingRoute(null);
            setRouteForm({ route_name: '', route_number: '', driver_name: '', driver_phone: '' });
            setIsRouteModalOpen(true);
          }}>
            <Route className="h-4 w-4 ml-2" /> New Route
          </Button>
          <Button onClick={() => {
            setChangeForm({
              student_id: '', change_date: selectedDate,
              original_bus_id: '', new_bus_id: '', change_type: 'one_time',
              reason: '', pickup_address: '', effective_from: '', effective_until: '', notes: ''
            });
            setIsChangeModalOpen(true);
          }} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 ml-2" /> New Change
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-100 rounded-lg"><Bus className="h-6 w-6 text-cyan-600" /></div>
            <div><p className="text-2xl font-bold">{busRoutes.length}</p><p className="text-sm text-slate-500">Bus Routes</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg"><AlertCircle className="h-6 w-6 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{busChanges.filter(c => c.change_date === selectedDate).length}</p><p className="text-sm text-slate-500">Changes Today</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><Calendar className="h-6 w-6 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{busChanges.length}</p><p className="text-sm text-slate-500">Total Upcoming</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div>
            <Label>From Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
          </div>
          <div>
            <Label>Change Type</Label>
            <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="one_time">One Time</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bus Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" /> Bus Routes ({busRoutes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busRoutes.map(route => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.route_name}</TableCell>
                  <TableCell>{route.route_number || '-'}</TableCell>
                  <TableCell>{route.driver_name || '-'}</TableCell>
                  <TableCell>{route.driver_phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingRoute(route);
                        setRouteForm({
                          route_name: route.route_name || '',
                          route_number: route.route_number || '',
                          driver_name: route.driver_name || '',
                          driver_phone: route.driver_phone || ''
                        });
                        setIsRouteModalOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteRoute(route.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {busRoutes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">No routes found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bus Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" /> Changes ({filteredChanges.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>From Bus</TableHead>
                <TableHead>To Bus</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChanges.map(change => (
                <TableRow key={change.id}>
                  <TableCell>{new Date(change.change_date).toLocaleDateString('en-US')}</TableCell>
                  <TableCell className="font-medium">
                    {change.student?.hebrew_name || `${change.student?.first_name} ${change.student?.last_name}`}
                  </TableCell>
                  <TableCell><Badge variant="outline">{change.student?.class?.name || 'N/A'}</Badge></TableCell>
                  <TableCell>{change.original_bus?.route_name || '-'}</TableCell>
                  <TableCell>{change.new_bus?.route_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={
                      change.change_type === 'permanent' ? 'bg-red-100 text-red-800' :
                      change.change_type === 'temporary' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {change.change_type === 'one_time' ? 'One Time' : change.change_type === 'temporary' ? 'Temporary' : 'Permanent'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{change.reason || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEmailContext({
                      subject: `Bus Change - ${change.student?.hebrew_name || change.student?.first_name}`,
                      body: `Bus change for ${change.student?.hebrew_name || change.student?.first_name}\n\nDate: ${new Date(change.change_date).toLocaleDateString('en-US')}\nFrom: ${change.original_bus?.route_name || 'N/A'}\nTo: ${change.new_bus?.route_name || 'N/A'}\nReason: ${change.reason || 'N/A'}`
                      });
                      setIsEmailModalOpen(true);
                    }}>
                      <Mail className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredChanges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No changes found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Route Modal */}
      <Dialog open={isRouteModalOpen} onOpenChange={setIsRouteModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Edit Route' : 'New Bus Route'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Route Name *</Label>
                <Input value={routeForm.route_name} onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })} placeholder="Bus 1" />
              </div>
              <div>
                <Label>Route Number</Label>
                <Input value={routeForm.route_number} onChange={(e) => setRouteForm({ ...routeForm, route_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Driver Name</Label>
                <Input value={routeForm.driver_name} onChange={(e) => setRouteForm({ ...routeForm, driver_name: e.target.value })} />
              </div>
              <div>
                <Label>Driver Phone</Label>
                <Input value={routeForm.driver_phone} onChange={(e) => setRouteForm({ ...routeForm, driver_phone: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRouteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRoute} className="bg-cyan-600 hover:bg-cyan-700">{editingRoute ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Modal */}
      <Dialog open={isChangeModalOpen} onOpenChange={setIsChangeModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>New Bus Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <StudentPicker
                students={students}
                value={changeForm.student_id}
                onChange={handleStudentSelectedForChange}
                placeholder="Search student..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Bus</Label>
                <Select value={changeForm.original_bus_id || 'none'} onValueChange={(v) => setChangeForm({ ...changeForm, original_bus_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {busRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name} ({r.route_number})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Bus</Label>
                <Select value={changeForm.new_bus_id || 'none'} onValueChange={(v) => setChangeForm({ ...changeForm, new_bus_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {busRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name} ({r.route_number})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={changeForm.change_date} onChange={(e) => setChangeForm({ ...changeForm, change_date: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={changeForm.change_type} onValueChange={(v) => setChangeForm({ ...changeForm, change_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {changeForm.change_type === 'temporary' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={changeForm.effective_from} onChange={(e) => setChangeForm({ ...changeForm, effective_from: e.target.value })} />
                </div>
                <div>
                  <Label>Until Date</Label>
                  <Input type="date" value={changeForm.effective_until} onChange={(e) => setChangeForm({ ...changeForm, effective_until: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label>Alternate Address (if applicable)</Label>
              <Input value={changeForm.pickup_address} onChange={(e) => setChangeForm({ ...changeForm, pickup_address: e.target.value })} placeholder="New pickup address" />
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={changeForm.reason} onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={changeForm.notes} onChange={(e) => setChangeForm({ ...changeForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChange} className="bg-cyan-600 hover:bg-cyan-700">Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={emailContext.subject}
        defaultBody={emailContext.body}
        currentUser={currentUser}
      />
    </div>
  );
};

export default BusChangesView;
