import React, { useState, useEffect } from 'react';
import { Menu, Users, FileText, Phone, Calendar, Layout, Clock, CalendarRange, BarChart2, FileBarChart, History, Edit3, LogOut, Shield, Settings, GraduationCap, School, BookOpen, UserCog, Workflow, TrendingUp, DollarSign, BookMarked, Receipt, AlertTriangle, Layers, Contact } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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
import TeachersView from '@/components/views/TeachersView';
import TutorsView from '@/components/views/TutorsView';
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

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut, loading } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userRole = profile?.role || 'teacher'; 

  // Simplified menu - organized by function
  const menuItems = [
    // Main Sections
    { id: 'overview', label: 'Dashboard', icon: Layout, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Quick overview' },
    
    // Students & Classes
    { id: 'students', label: 'Students', icon: Users, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Student directory' },
    { id: 'grades', label: 'Grades', icon: Layers, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Grade levels' },
    { id: 'classes', label: 'Classes', icon: School, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage classes' },
    
    // Issues & Communication
    { id: 'issues', label: 'Issues', icon: AlertTriangle, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Track issues' },
    { id: 'calls', label: 'Phone Calls', icon: Phone, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'admin'], description: 'Call logs' },
    { id: 'meetings', label: 'Meetings', icon: Calendar, roles: ['principal', 'principal_hebrew', 'principal_english', 'teacher', 'teacher_hebrew', 'teacher_english', 'tutor', 'admin'], description: 'Schedule meetings' },
    
    // Staff (admin only)
    { id: 'staff', label: 'Staff Directory', icon: Contact, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'All staff contacts' },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage teachers' },
    { id: 'tutors', label: 'Tutors', icon: BookOpen, roles: ['principal', 'principal_hebrew', 'principal_english', 'admin'], description: 'Manage tutors' },
    
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
      case 'teachers': return <TeachersView {...viewProps} />;
      case 'tutors': return <TutorsView {...viewProps} />;
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

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(userRole));

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
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">{profile?.name || 'User'}</h1>
                  <p className="text-xs text-slate-600 capitalize">{userRole}</p>
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

            <div className="p-3 border-t bg-slate-50">
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
    </div>
  );
};

export default Dashboard;