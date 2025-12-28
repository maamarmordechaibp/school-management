import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, School, Globe, Calendar, Palette } from 'lucide-react';

const SettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
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
      </Tabs>
    </div>
  );
};

export default SettingsView;