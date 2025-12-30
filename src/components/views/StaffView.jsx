import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Trash2, Loader2, Edit, Phone, Home, MapPin, Search, Download, Users, GraduationCap, Bus, Briefcase, BookOpen, UserCog } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const POSITION_OPTIONS = [
  { value: 'all', label: 'All Positions', color: 'bg-slate-100 text-slate-700' },
  { value: 'Vaad G', label: 'Vaad Gabbai', color: 'bg-purple-100 text-purple-700', category: 'administration' },
  { value: 'Vaad R', label: 'Vaad Ruchani', color: 'bg-indigo-100 text-indigo-700', category: 'administration' },
  { value: 'Menahal', label: 'Menahal', color: 'bg-blue-100 text-blue-700', category: 'administration' },
  { value: 'Sgan Menahal', label: 'Sgan Menahal', color: 'bg-blue-100 text-blue-700', category: 'administration' },
  { value: 'Principal', label: 'Principal', color: 'bg-blue-100 text-blue-700', category: 'administration' },
  { value: 'Manager', label: 'Manager', color: 'bg-cyan-100 text-cyan-700', category: 'administration' },
  { value: 'Bus Manager', label: 'Bus Manager', color: 'bg-cyan-100 text-cyan-700', category: 'administration' },
  { value: 'Sec', label: 'Secretary', color: 'bg-pink-100 text-pink-700', category: 'administration' },
  { value: 'Chinuch Mychud', label: 'Chinuch Meyuchad', color: 'bg-orange-100 text-orange-700', category: 'teaching' },
  { value: 'Melamed', label: 'Melamed', color: 'bg-green-100 text-green-700', category: 'teaching' },
  { value: 'Melamed / Driver', label: 'Melamed/Driver', color: 'bg-green-100 text-green-700', category: 'teaching' },
  { value: 'Helper', label: 'Helper', color: 'bg-teal-100 text-teal-700', category: 'teaching' },
  { value: 'English Teacher', label: 'English Teacher', color: 'bg-emerald-100 text-emerald-700', category: 'teaching' },
  { value: 'Curriculum Implementer', label: 'Curriculum', color: 'bg-amber-100 text-amber-700', category: 'teaching' },
  { value: 'Driver', label: 'Driver', color: 'bg-slate-100 text-slate-700', category: 'support' },
];

const TITLE_OPTIONS = [
  { value: 'Rabbi', label: 'Rabbi' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Mr', label: 'Mr' },
];

const StaffView = ({ role, currentUser }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    position: 'Melamed',
    title: 'Rabbi',
    full_name: '',
    hebrew_name: '',
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: 'NY',
    zip_code: '',
    home_phone: '',
    cell_phone: '',
    class_assignment: '',
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff directory."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditMode && selectedStaff) {
        // Update existing staff member
        const { error } = await supabase
          .from('staff_members')
          .update(formData)
          .eq('id', selectedStaff.id);

        if (error) throw error;

        toast({
          title: "Updated",
          description: "Staff member details updated successfully."
        });
      } else {
        // Create new staff member
        const { error } = await supabase
          .from('staff_members')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Staff Added",
          description: `${formData.full_name} has been added to the directory.`
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to remove ${staffMember.full_name} from the directory?`)) return;

    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ is_active: false })
        .eq('id', staffMember.id);

      if (error) throw error;
      
      toast({
        title: "Staff Removed",
        description: `${staffMember.full_name} has been removed from the directory.`
      });
      fetchStaff();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove staff member."
      });
    }
  };

  const openEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      position: staffMember.position || 'Melamed',
      title: staffMember.title || 'Rabbi',
      full_name: staffMember.full_name || '',
      hebrew_name: staffMember.hebrew_name || '',
      first_name: staffMember.first_name || '',
      last_name: staffMember.last_name || '',
      address: staffMember.address || '',
      city: staffMember.city || '',
      state: staffMember.state || 'NY',
      zip_code: staffMember.zip_code || '',
      home_phone: staffMember.home_phone || '',
      cell_phone: staffMember.cell_phone || '',
      class_assignment: staffMember.class_assignment || '',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      position: 'Melamed',
      title: 'Rabbi',
      full_name: '',
      hebrew_name: '',
      first_name: '',
      last_name: '',
      address: '',
      city: '',
      state: 'NY',
      zip_code: '',
      home_phone: '',
      cell_phone: '',
      class_assignment: '',
    });
    setSelectedStaff(null);
    setIsEditMode(false);
  };

  const getPositionBadge = (position) => {
    const option = POSITION_OPTIONS.find(p => p.value === position);
    if (!option) return <Badge variant="outline">{position}</Badge>;
    return <Badge className={option.color}>{option.label}</Badge>;
  };

  // Filter staff based on tab and search
  const filteredStaff = staff.filter(s => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'administration' && ['Vaad G', 'Vaad R', 'Menahal', 'Sgan Menahal', 'Principal', 'Manager', 'Bus Manager', 'Sec'].includes(s.position)) ||
      (activeTab === 'teaching' && ['Melamed', 'Melamed / Driver', 'Helper', 'English Teacher', 'Chinuch Mychud', 'Curriculum Implementer'].includes(s.position)) ||
      (activeTab === 'support' && ['Driver'].includes(s.position)) ||
      s.position === activeTab;
    
    const matchesSearch = !searchQuery || 
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hebrew_name?.includes(searchQuery) ||
      s.cell_phone?.includes(searchQuery) ||
      s.class_assignment?.includes(searchQuery);
    
    return matchesTab && matchesSearch;
  });

  // Stats
  const adminCount = staff.filter(s => ['Vaad G', 'Vaad R', 'Menahal', 'Sgan Menahal', 'Principal', 'Manager', 'Bus Manager', 'Sec'].includes(s.position)).length;
  const teacherCount = staff.filter(s => ['Melamed', 'Melamed / Driver', 'Helper', 'Chinuch Mychud'].includes(s.position)).length;
  const englishTeacherCount = staff.filter(s => s.position === 'English Teacher').length;
  const driverCount = staff.filter(s => ['Driver', 'Melamed / Driver'].includes(s.position)).length;

  const exportToCSV = () => {
    const headers = ['Position', 'Title', 'Name', 'Hebrew Name', 'Address', 'City', 'State', 'Zip', 'Home Phone', 'Cell Phone', 'Class'];
    const rows = filteredStaff.map(s => [
      s.position,
      s.title,
      s.full_name,
      s.hebrew_name,
      s.address,
      s.city,
      s.state,
      s.zip_code,
      s.home_phone,
      s.cell_phone,
      s.class_assignment
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_directory.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Staff Directory</h2>
          <p className="text-slate-600 mt-1">Complete staff directory with contact information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{staff.length}</p>
              <p className="text-sm text-slate-500">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-sm text-slate-500">Administration</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teacherCount}</p>
              <p className="text-sm text-slate-500">Hebrew Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{englishTeacherCount}</p>
              <p className="text-sm text-slate-500">English Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <Bus className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{driverCount}</p>
              <p className="text-sm text-slate-500">Drivers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="administration">Administration</TabsTrigger>
                <TabsTrigger value="teaching">Teaching</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-500">Loading staff directory...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No staff members found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Position</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold text-right" dir="rtl">שם</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Cell Phone</TableHead>
                  <TableHead className="font-semibold">Home Phone</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember.id} className="hover:bg-slate-50">
                    <TableCell>
                      {getPositionBadge(staffMember.position)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {staffMember.title} {staffMember.full_name}
                    </TableCell>
                    <TableCell className="text-right font-medium" dir="rtl">
                      {staffMember.hebrew_name}
                    </TableCell>
                    <TableCell>
                      {staffMember.class_assignment && (
                        <Badge variant="outline" className="font-mono">
                          {staffMember.class_assignment}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {staffMember.cell_phone && (
                        <a href={`tel:${staffMember.cell_phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <Phone className="h-3 w-3" />
                          {staffMember.cell_phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {staffMember.home_phone && (
                        <a href={`tel:${staffMember.home_phone}`} className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
                          <Home className="h-3 w-3" />
                          {staffMember.home_phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {staffMember.address && (
                        <span className="flex items-center gap-1 text-slate-600 text-sm">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {staffMember.address}, {staffMember.city}
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(staffMember)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(staffMember)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update staff member information' : 'Add a new staff member to the directory'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Position & Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Position *</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.filter(p => p.value !== 'all').map(pos => (
                      <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Select value={formData.title} onValueChange={(v) => setFormData({ ...formData, title: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TITLE_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  placeholder="Last, First"
                />
              </div>
              <div>
                <Label>Hebrew Name (שם)</Label>
                <Input
                  value={formData.hebrew_name}
                  onChange={(e) => setFormData({ ...formData, hebrew_name: e.target.value })}
                  dir="rtl"
                  placeholder="שם מלא"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="10952"
                />
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cell Phone</Label>
                <Input
                  value={formData.cell_phone}
                  onChange={(e) => setFormData({ ...formData, cell_phone: e.target.value })}
                  placeholder="845-000-0000"
                />
              </div>
              <div>
                <Label>Home Phone</Label>
                <Input
                  value={formData.home_phone}
                  onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                  placeholder="845-000-0000"
                />
              </div>
            </div>

            {/* Class Assignment (for teachers) */}
            <div>
              <Label>Class Assignment</Label>
              <Input
                value={formData.class_assignment}
                onChange={(e) => setFormData({ ...formData, class_assignment: e.target.value })}
                placeholder="e.g., א, ב, ג/1st"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffView;
