import React, { useState, useEffect } from 'react';
import { Menu, Users, FileText, Phone, Calendar, Layout, Clock, CalendarRange, BarChart2, FileBarChart, History, Edit3, LogOut, Shield, Settings, School, UserCog, Workflow, TrendingUp, DollarSign, BookMarked, Receipt, AlertTriangle, Layers, Contact, Bell, Bus, Heart, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

// Views
import StudentsView from '@/components/views/StudentsView';
import IssuesView from '@/components/views/IssuesView';
import CallLogsView from '@/components/views/CallLogsView';
import CalendarView from '@/components/views/CalendarView';
import OverviewView from '@/components/views/OverviewView';
import TimeSlotsView from '@/components/views/TimeSlotsView';
import BulkScheduleView from '@/components/views/BulkScheduleView';
import AnalyticsView from '@/components/views/AnalyticsView';
import ReportsView from '@/components/views/ReportsView';
import ActivityLogView from '@/components/views/ActivityLogView';
import TemplateDesignerView from '@/components/views/TemplateDesignerView';
import ClassesView from '@/components/views/ClassesView';
import SettingsView from '@/components/views/SettingsView';
import UserManagementView from '@/components/views/UserManagementView';
import MeetingsView from '@/components/views/MeetingsView';
import IntakeWorkflowView from '@/components/views/IntakeWorkflowView';
import MonitoringDashboardView from '@/components/views/MonitoringDashboardView';
import GradesView from '@/components/views/GradesView';
import BooksView from '@/components/views/BooksView';
import FeesView from '@/components/views/FeesView';
import StaffView from '@/components/views/StaffView';
import PaymentsView from '@/components/views/PaymentsView';
import FinancialReportsView from '@/components/views/FinancialReportsView';
import SpecialEducationView from '@/components/views/SpecialEducationView';
import ClassDetailView from '@/components/views/ClassDetailView';
import LateTrackingView from '@/components/views/LateTrackingView';
import BusChangesView from '@/components/views/BusChangesView';
import RemindersView from '@/components/views/RemindersView';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut, loading } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userRole = profile?.role || 'teacher'; 

  // Custom menu visibility from admin settings
  const [menuVisibility, setMenuVisibility] = useState(null);
  const [isMenuSettingsOpen, setIsMenuSettingsOpen] = useState(false);

  useEffect(() => {
    loadMenuVisibility();
  }, []);

  const loadMenuVisibility = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'menu_visibility')
        .maybeSingle();
      if (data?.value) setMenuVisibility(JSON.parse(data.value));
    } catch (e) { /* settings table may not exist yet */ }
  };

  const saveMenuVisibility = async (newVisibility) => {
    try {
      await supabase.from('app_settings').upsert({
        key: 'menu_visibility',
        value: JSON.stringify(newVisibility),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      setMenuVisibility(newVisibility);
    } catch (e) { console.log('Could not save menu settings'); }
  };

  // All menu items
  const menuItems = [
    // Main Sections
    { id: 'overview', label: 'Dashboard', icon: Layout, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Quick overview' },
    
    // Students & Classes
    { id: 'students', label: 'Students', icon: Users, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Student directory' },
    { id: 'grades', label: 'Grades', icon: Layers, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Grade levels' },
    { id: 'classes', label: 'Classes', icon: School, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage classes' },
    { id: 'class-detail', label: 'Class Detail', icon: BookOpen, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin'], description: 'Class info with notes' },
    
    // Issues & Communication
    { id: 'issues', label: 'Issues', icon: AlertTriangle, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Track issues' },
    { id: 'calls', label: 'Phone Calls', icon: Phone, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin'], description: 'Call logs' },
    { id: 'meetings', label: 'Meetings', icon: Calendar, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Schedule meetings' },
    
    // Staff (admin only)
    { id: 'staff', label: 'Staff Directory', icon: Contact, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'All staff contacts' },
    
    // Special Ed & Assistant Principal
    { id: 'special-ed', label: 'Special Education', icon: Heart, roles: ['principal', 'principal_hebrew', 'admin', 'special_ed'], description: 'Special education management' },
    { id: 'late-tracking', label: 'Late Tracking', icon: Clock, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Track late arrivals / print slips' },
    { id: 'bus-changes', label: 'Bus Changes', icon: Bus, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Bus routes and changes' },
    { id: 'reminders', label: 'Reminders', icon: Bell, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin'], description: 'Reminders with email' },
    
    // Financial - Books & Fees
    { id: 'books', label: 'Books', icon: BookMarked, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Book inventory & requirements' },
    { id: 'fees', label: 'Fees & Trips', icon: DollarSign, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage fees' },
    { id: 'payments', label: 'Payments', icon: Receipt, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Record payments' },
    { id: 'financial-reports', label: 'Financial Reports', icon: FileBarChart, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Payment reports' },
    
    // Reports & Settings
    { id: 'reports', label: 'Reports', icon: BarChart2, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'General reports' },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'System settings' },
  ];

  const renderView = () => {
    const viewProps = { role: userRole, currentUser: profile };

    switch (activeView) {
      case 'overview': return <OverviewView {...viewProps} />;
      case 'grades': return <GradesView {...viewProps} />;
      case 'classes': return <ClassesView {...viewProps} />;
      case 'students': return <StudentsView {...viewProps} />;
      case 'issues': return <IssuesView {...viewProps} />;
      case 'staff': return <StaffView {...viewProps} />;
      case 'users': return <UserManagementView {...viewProps} />;
      case 'calls': return <CallLogsView {...viewProps} />;
      case 'meetings': return <MeetingsView {...viewProps} />;
      case 'calendar': return <MeetingsView {...viewProps} />;
      case 'books': return <BooksView {...viewProps} />;
      case 'fees': return <FeesView {...viewProps} />;
      case 'payments': return <PaymentsView {...viewProps} />;
      case 'financial-reports': return <FinancialReportsView {...viewProps} />;
      case 'templates': return <TemplateDesignerView {...viewProps} />;
      case 'timeslots': return <TimeSlotsView {...viewProps} />;
      case 'bulkschedule': return <BulkScheduleView {...viewProps} />;
      case 'reports': return <ReportsView {...viewProps} />;
      case 'activity': return <ActivityLogView {...viewProps} />;
      case 'settings': return <SettingsView {...viewProps} />;
      case 'special-ed': return <SpecialEducationView {...viewProps} />;
      case 'class-detail': return <ClassDetailView {...viewProps} />;
      case 'late-tracking': return <LateTrackingView {...viewProps} />;
      case 'bus-changes': return <BusChangesView {...viewProps} />;
      case 'reminders': return <RemindersView {...viewProps} />;
      default: return <OverviewView {...viewProps} />;
    }
  };

  if (loading || !profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
           <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
           <div className="h-4 w-32 bg-slate-200 rounded"></div>
           <p className="text-slate-400 text-sm mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  const allowedMenuItems = menuItems.filter(item => {
    // Check role-based access
    if (!item.roles.includes(userRole)) return false;
    // Check admin-configured visibility
    if (menuVisibility && menuVisibility[userRole]) {
      const roleSettings = menuVisibility[userRole];
      if (roleSettings[item.id] === false) return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden" dir="ltr">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-lg z-20"
          >
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3 mb-3">
                <img src="/logo.svg" alt="Logo" className="h-12 w-12 rounded-full shadow-md" />
                <div>
                  <h1 className="text-sm font-bold text-slate-800 leading-tight" dir="rtl">תלמוד תורה תולדות יעקב יוסף</h1>
                  <p className="text-xs text-slate-500" dir="rtl">סקווירא</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{profile?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                    }`}
                  >
                    <Icon size={22} className={isActive ? '' : 'text-slate-500 group-hover:text-slate-700'} />
                    <div className="flex-1 text-left">
                      <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t bg-slate-50 space-y-1">
               {(userRole === 'admin' || userRole === 'principal') && (
                 <Button 
                   variant="ghost" 
                   className="w-full justify-start text-blue-600 hover:bg-blue-50 rounded-xl text-sm" 
                   onClick={() => setIsMenuSettingsOpen(true)}
                 >
                    <Settings className="ml-2 h-4 w-4" />
                    <span>Menu Settings</span>
                 </Button>
               )}
               <Button 
                 variant="ghost" 
                 className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl" 
                 onClick={signOut}
               >
                  <LogOut className="ml-2 h-5 w-5" />
                  <span className="font-semibold">Log Out</span>
               </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-slate-100 rounded-xl"
            >
              <Menu size={24} />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                 {menuItems.find(i => i.id === activeView)?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-500">
                {menuItems.find(i => i.id === activeView)?.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-700">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Menu Settings Dialog - Admin only */}
      <Dialog open={isMenuSettingsOpen} onOpenChange={setIsMenuSettingsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menu Settings - Configure which options each role can see</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {['teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'principal_hebrew', 'principal_english', 'special_ed'].map(targetRole => {
              const roleLabels = {
                teacher: 'Teacher',
                teacher_hebrew: 'Hebrew Teacher',
                teacher_english: 'English Teacher',
                tutor: 'Tutor',
                principal_hebrew: 'Hebrew Principal',
                principal_english: 'English Principal',
                special_ed: 'Special Education'
              };
              const roleItems = menuItems.filter(m => m.roles.includes(targetRole));
              if (roleItems.length === 0) return null;
              const currentSettings = menuVisibility?.[targetRole] || {};
              return (
                <div key={targetRole} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3">{roleLabels[targetRole]}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {roleItems.map(item => {
                      const isEnabled = currentSettings[item.id] !== false;
                      return (
                        <label key={item.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const newVis = { ...menuVisibility };
                              if (!newVis[targetRole]) newVis[targetRole] = {};
                              newVis[targetRole][item.id] = e.target.checked;
                              saveMenuVisibility(newVis);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;