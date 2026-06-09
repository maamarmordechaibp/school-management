import React, { useState, useEffect } from 'react';
import { Menu, Users, FileText, Phone, Calendar, Layout, Clock, CalendarRange, BarChart2, FileBarChart, History, Edit3, LogOut, Shield, Settings, School, UserCog, Workflow, TrendingUp, DollarSign, BookMarked, Receipt, AlertTriangle, Layers, Contact, Bell, Bus, Heart, BookOpen, CheckSquare, Megaphone, Mail, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { SCHOOL_NAME_YI, SCHOOL_SUBTITLE_YI, SCHOOL_LOGO_URL } from '@/lib/schoolConfig';
import GlobalSearch from '@/components/GlobalSearch';

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
import EmailTemplatesView from '@/components/views/EmailTemplatesView';
import AnnouncementsView from '@/components/views/AnnouncementsView';
import MassCallView from '@/components/views/MassCallView';
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
import TodoListView from '@/components/views/TodoListView';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut, loading } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

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
    { id: 'overview', label: 'Dashboard', icon: Layout, group: 'Main', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Quick overview' },
    { id: 'todos', label: 'To-Do List', icon: CheckSquare, group: 'Main', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Tasks & follow-ups' },
    
    // Students & Classes
    { id: 'students', label: 'Students', icon: Users, group: 'Students & Classes', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Student directory' },
    { id: 'grades', label: 'Grades', icon: Layers, group: 'Students & Classes', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Grade levels' },
    { id: 'classes', label: 'Classes', icon: School, group: 'Students & Classes', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage classes' },
    { id: 'class-detail', label: 'Class Detail', icon: BookOpen, group: 'Students & Classes', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin'], description: 'Class info with notes' },
    
    // Issues & Communication
    { id: 'issues', label: 'Issues', icon: AlertTriangle, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Track issues' },
    { id: 'calls', label: 'Phone Calls', icon: Phone, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin', 'special_ed'], description: 'Call logs' },
    { id: 'meetings', label: 'Meetings', icon: Calendar, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin', 'special_ed'], description: 'Schedule meetings' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Mass parent emails' },
    { id: 'mass-call', label: 'Mass Phone Call', icon: PhoneCall, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Robocall parents (SignalWire)' },
    { id: 'email-templates', label: 'Email Templates', icon: Mail, group: 'Communication', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Edit reusable email templates' },
    
    // Staff (admin only)
    { id: 'staff', label: 'Staff Directory', icon: Contact, group: 'Staff & Access', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'All staff contacts' },
    { id: 'users', label: 'User Management', icon: Shield, group: 'Staff & Access', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage login accounts & roles' },
    
    // Special Ed & Assistant Principal
    { id: 'special-ed', label: 'Special Education', icon: Heart, group: 'Operations', roles: ['principal', 'principal_hebrew', 'admin', 'special_ed'], description: 'Special education management' },
    { id: 'late-tracking', label: 'Late Tracking', icon: Clock, group: 'Operations', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Track late arrivals / print slips' },
    { id: 'bus-changes', label: 'Bus Changes', icon: Bus, group: 'Operations', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Bus routes and changes' },
    { id: 'reminders', label: 'Reminders', icon: Bell, group: 'Operations', roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin', 'special_ed'], description: 'Reminders with email' },
    
    // Financial - Books & Fees
    { id: 'books', label: 'Books', icon: BookMarked, group: 'Finance', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Book inventory & requirements' },
    { id: 'fees', label: 'Fees & Trips', icon: DollarSign, group: 'Finance', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage fees' },
    { id: 'payments', label: 'Payments', icon: Receipt, group: 'Finance', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Record payments' },
    { id: 'financial-reports', label: 'Financial Reports', icon: FileBarChart, group: 'Finance', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Payment reports' },
    
    // Reports & Settings
    { id: 'reports', label: 'Reports', icon: BarChart2, group: 'System', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'General reports' },
    { id: 'settings', label: 'Settings', icon: Settings, group: 'System', roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'System settings' },
  ];

  const MENU_GROUP_ORDER = ['Main', 'Students & Classes', 'Communication', 'Staff & Access', 'Operations', 'Finance', 'System'];

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
      case 'email-templates': return <EmailTemplatesView {...viewProps} />;
      case 'announcements': return <AnnouncementsView {...viewProps} />;
      case 'mass-call': return <MassCallView {...viewProps} />;
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
      case 'todos': return <TodoListView {...viewProps} />;
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
    const hasRoleAccess = item.roles.includes(userRole);
    // Check custom per-user permissions (stored in profile.custom_permissions)
    const customPerms = profile?.custom_permissions;
    let hasCustomAccess = false;
    if (customPerms && customPerms[item.id] === true) {
      // Custom permission explicitly grants access even if role doesn't include it
      hasCustomAccess = true;
    }
    if (customPerms && customPerms[item.id] === false) {
      // Custom permission explicitly revokes access
      return false;
    }
    if (!hasRoleAccess && !hasCustomAccess) return false;
    // Check admin-configured visibility
    if (menuVisibility && menuVisibility[userRole]) {
      const roleSettings = menuVisibility[userRole];
      if (roleSettings[item.id] === false) return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden app-canvas" dir="ltr">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="fixed lg:relative inset-y-0 left-0 w-[270px] bg-white border-r border-slate-200/80 flex flex-col z-40 shadow-float lg:shadow-none"
          >
            {/* Brand header */}
            <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
              <img
                src={SCHOOL_LOGO_URL}
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="h-11 w-11 rounded-xl bg-white p-0.5 shadow-card ring-1 ring-slate-200 flex-shrink-0"
              />
              <div className="min-w-0" dir="rtl">
                <h1 className="text-[13px] font-bold leading-tight truncate text-slate-800 font-hebrew" title={SCHOOL_NAME_YI}>
                  {SCHOOL_NAME_YI}
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate font-hebrew">{SCHOOL_SUBTITLE_YI}</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
              {MENU_GROUP_ORDER.map((groupName) => {
                const groupItems = allowedMenuItems.filter((i) => i.group === groupName);
                if (groupItems.length === 0) return null;
                return (
                  <div key={groupName}>
                    <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {groupName}
                    </p>
                    <div className="space-y-0.5">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveView(item.id);
                              if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            title={item.description}
                            className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                            )}
                            <Icon
                              size={18}
                              className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}
                            />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* User + actions */}
            <div className="p-3 border-t border-slate-100 space-y-1">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 capitalize truncate">{userRole?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {(userRole === 'admin' || userRole === 'principal') && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:bg-slate-100 rounded-lg text-sm h-9"
                  onClick={() => setIsMenuSettingsOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Menu Settings</span>
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-sm h-9"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-semibold">Log Out</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="surface-glass border-b border-slate-200/70 px-4 md:px-6 py-3 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-slate-100 rounded-lg flex-shrink-0"
            >
              <Menu size={22} />
            </Button>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate leading-tight">
                {menuItems.find(i => i.id === activeView)?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {menuItems.find(i => i.id === activeView)?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <GlobalSearch />
            <div className="hidden md:flex flex-col items-end pl-3 border-l border-slate-200">
              <p className="text-sm font-semibold text-slate-700">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
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