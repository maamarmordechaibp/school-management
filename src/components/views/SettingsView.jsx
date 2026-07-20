import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, School, Globe, Calendar, Palette, Bell, Tags, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { NOTIFY_GROUPS, loadNotifyGroupSettings, saveNotifyGroupSettings } from '@/lib/notifyRecipients';

const SettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);
  const [notifyEmails, setNotifyEmails] = useState({});
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  const [academicYear, setAcademicYear] = useState({
    current: '',
    terms: []
  });
  const [specialEdRecipients, setSpecialEdRecipients] = useState('');
  const [declineThreshold, setDeclineThreshold] = useState('2');
  const [markCats, setMarkCats] = useState([]);
  const [newCat, setNewCat] = useState({ label: '', he: '', color: '#2563eb' });
  const [savingTracking, setSavingTracking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      loadNotifyGroupSettings().then((m) => setNotifyEmails(m || {})).catch(() => {});
      loadTrackingSettings();
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const info = data.find(d => d.key === 'school_info')?.value || {};
        const academic = data.find(d => d.key === 'academic_year')?.value || {};
        
        setSchoolInfo({
          name: info.name || '',
          address: info.address || '',
          phone: info.phone || '',
          email: info.email || '',
          website: info.website || ''
        });
        
        setAcademicYear({
          current: academic.current || '2024-2025',
          terms: academic.terms || ['Fall', 'Spring']
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load system settings."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchoolInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'school_info', 
          value: schoolInfo,
          description: 'General school information'
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "School information has been updated successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifyEmails = async () => {
    setSavingNotify(true);
    try {
      await saveNotifyGroupSettings(notifyEmails);
      toast({
        title: "Notification Recipients Saved",
        description: "These addresses will be offered when sending student notifications."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message
      });
    } finally {
      setSavingNotify(false);
    }
  };

  const loadTrackingSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['special_ed_recipients', 'progress_decline_threshold']);
      const map = {};
      (settings || []).forEach((r) => { map[r.key] = r.value; });
      setSpecialEdRecipients(map.special_ed_recipients || '');
      setDeclineThreshold(map.progress_decline_threshold || '2');
    } catch (e) { /* app_settings may not exist */ }
    try {
      const { data: cats } = await supabase
        .from('mark_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      setMarkCats(cats || []);
    } catch (e) { /* table may not exist yet */ }
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      await supabase.from('app_settings').upsert(
        [
          { key: 'special_ed_recipients', value: specialEdRecipients, updated_at: new Date().toISOString() },
          { key: 'progress_decline_threshold', value: String(declineThreshold || '2'), updated_at: new Date().toISOString() },
        ],
        { onConflict: 'key' }
      );
      toast({ title: 'Saved', description: 'Tracking settings updated.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to save' });
    } finally {
      setSavingTracking(false);
    }
  };

  const addCategory = async () => {
    const label = (newCat.label || '').trim();
    if (!label) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Enter a name for the category.' });
      return;
    }
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `cat_${Date.now()}`;
    try {
      const maxSort = markCats.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
      const { error } = await supabase.from('mark_categories').insert([{
        key, label, he: newCat.he || null, color: newCat.color || '#64748b',
        sort_order: maxSort + 10, is_active: true, is_builtin: false,
      }]);
      if (error) throw error;
      setNewCat({ label: '', he: '', color: '#2563eb' });
      loadTrackingSettings();
      toast({ title: 'Category added' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e.message || '').includes('duplicate') ? 'A category with that name already exists.' : (e.message || 'Failed to add') });
    }
  };

  const updateCategory = async (id, patch) => {
    setMarkCats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await supabase.from('mark_categories').update(patch).eq('id', id);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update category' });
    }
  };

  const deleteCategory = async (cat) => {
    if (cat.is_builtin) return;
    try {
      await supabase.from('mark_categories').delete().eq('id', cat.id);
      loadTrackingSettings();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete category' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-600 mt-1">Manage global configuration for the school system</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <School className="w-4 h-4" /> General Info
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Academic Year
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Tags className="w-4 h-4" /> Tracking
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                These details will appear on reports, headers, and official communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input 
                  id="schoolName" 
                  value={schoolInfo.name} 
                  onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})} 
                  placeholder="e.g. Beis Yaakov Academy" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={schoolInfo.address} 
                  onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})} 
                  placeholder="123 Education Lane" 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={schoolInfo.phone} 
                    onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})} 
                    placeholder="(555) 123-4567" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={schoolInfo.email} 
                    onChange={(e) => setSchoolInfo({...schoolInfo, email: e.target.value})} 
                    placeholder="office@school.edu" 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="website" 
                    className="pl-9"
                    value={schoolInfo.website} 
                    onChange={(e) => setSchoolInfo({...schoolInfo, website: e.target.value})} 
                    placeholder="www.school.edu" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6 bg-slate-50 rounded-b-lg">
              <Button onClick={handleSaveSchoolInfo} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Configuration</CardTitle>
              <CardDescription>
                Configure the current school year and terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Current Academic Year</Label>
                <Input 
                  id="year" 
                  value={academicYear.current}
                  onChange={(e) => setAcademicYear({...academicYear, current: e.target.value})}
                  placeholder="2024-2025" 
                />
              </div>
              <div className="grid gap-2">
                <Label>Active Terms</Label>
                <div className="text-sm text-slate-500 italic">
                  Term management functionality coming soon in the next update.
                </div>
              </div>
            </CardContent>
             <CardFooter className="flex justify-end border-t p-6 bg-slate-50 rounded-b-lg">
              <Button disabled variant="outline">
                Save Configuration (Coming Soon)
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>System Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Palette className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                  <p>Theme customization features are currently under development.</p>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Recipients</CardTitle>
              <CardDescription>
                Set a fallback email (or several) for each group. These are offered whenever
                someone sends a notification about a student. Staff members with an email on
                their record are included automatically — this is for groups that don't have
                individual emails on file. Separate multiple addresses with commas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFY_GROUPS.map((g) => (
                <div className="grid gap-2" key={g.key}>
                  <Label htmlFor={`notify-${g.key}`}>{g.label}</Label>
                  <Textarea
                    id={`notify-${g.key}`}
                    rows={2}
                    dir="ltr"
                    value={notifyEmails[g.key] || ''}
                    onChange={(e) => setNotifyEmails({ ...notifyEmails, [g.key]: e.target.value })}
                    placeholder="name@example.com, second@example.com"
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6 bg-slate-50 rounded-b-lg">
              <Button onClick={handleSaveNotifyEmails} disabled={savingNotify}>
                {savingNotify ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Recipients
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking &amp; Referrals</CardTitle>
              <CardDescription>
                Configure who is notified when a student is referred for a special-ed
                evaluation, and how many declines trigger the prompt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sped-recipients">Special-Ed email recipients</Label>
                <Textarea
                  id="sped-recipients"
                  rows={2}
                  dir="ltr"
                  value={specialEdRecipients}
                  onChange={(e) => setSpecialEdRecipients(e.target.value)}
                  placeholder="specialed@example.com, coordinator@example.com"
                />
                <p className="text-xs text-slate-500">Comma-separated. If left blank, active special-ed staff emails are used.</p>
              </div>
              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="decline-threshold">Declines before prompting</Label>
                <Input
                  id="decline-threshold"
                  type="number"
                  min="1"
                  value={declineThreshold}
                  onChange={(e) => setDeclineThreshold(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6 bg-slate-50">
              <Button onClick={saveTracking} disabled={savingTracking}>
                {savingTracking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Mark Categories</CardTitle>
              <CardDescription>
                The kinds of marks you can track for a student. Add your own and pick a
                colour — it shows on the Grades entry and the student progress graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {markCats.map((c) => (
                <div key={c.id} className="flex items-center gap-3 border rounded-lg p-2.5">
                  <input
                    type="color"
                    value={c.color || '#64748b'}
                    onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                    className="h-8 w-10 rounded border cursor-pointer"
                    title="Pick colour"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">{c.label}</span>
                    {c.he && <span className="text-slate-400 text-sm ms-2">{c.he}</span>}
                    {c.is_builtin && <span className="text-[11px] text-slate-400 ms-2">(built-in)</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCategory(c.id, { is_active: !c.is_active })}
                    className={c.is_active ? 'text-green-600' : 'text-slate-400'}
                  >
                    {c.is_active ? 'Active' : 'Hidden'}
                  </Button>
                  {!c.is_builtin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(c)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add new */}
              <div className="flex items-end gap-3 border-t pt-4">
                <input
                  type="color"
                  value={newCat.color}
                  onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                  className="h-9 w-11 rounded border cursor-pointer"
                  title="Pick colour"
                />
                <div className="grid gap-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} placeholder="e.g. Kriah" className="w-40" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Yiddish (optional)</Label>
                  <Input value={newCat.he} onChange={(e) => setNewCat({ ...newCat, he: e.target.value })} placeholder="קריאה" className="w-40" dir="rtl" />
                </div>
                <Button onClick={addCategory}><Plus className="me-2 h-4 w-4" /> Add</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsView;