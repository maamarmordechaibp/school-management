import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Phone, Calendar, UserPlus, PhoneCall, CalendarPlus, Bell, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const OverviewView = ({ role = 'principal', onNavigate }) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalStudents: 0,
    openIssues: 0,
    pendingCalls: 0,
    upcomingMeetings: 0,
    emergencyMeetings: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, issuesRes, callsRes, meetingsRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('student_issues').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('call_logs').select('id', { count: 'exact' }),
        supabase.from('meetings').select('meeting_date').eq('status', 'scheduled'),
      ]);

      const now = new Date();
      const upcomingMeetings = meetingsRes.data?.filter(m => new Date(m.meeting_date) >= now).length || 0;
      const emergencyMeetings = meetingsRes.data?.filter(m => new Date(m.meeting_date) < now).length || 0;

      setStats({
        totalStudents: studentsRes.count || 0,
        openIssues: issuesRes.count || 0,
        pendingCalls: callsRes.count || 0,
        upcomingMeetings,
        emergencyMeetings,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load statistics',
      });
    }
  };

  const statCards = [
    {
      title: t('overview.totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      iconClass: 'text-primary',
      tint: 'bg-primary/10',
      cardTint: 'bg-[#4F46E5]/5',
      view: 'students',
    },
    {
      title: t('overview.openIssues'),
      value: stats.openIssues,
      icon: AlertCircle,
      iconClass: 'text-[#F59E0B]',
      tint: 'bg-[#F59E0B]/10',
      cardTint: 'bg-[#F59E0B]/5',
      view: 'issues',
    },
    {
      title: t('overview.pendingCalls'),
      value: stats.pendingCalls,
      icon: Phone,
      iconClass: 'text-[#10B981]',
      tint: 'bg-[#10B981]/10',
      cardTint: 'bg-[#10B981]/5',
      view: 'calls',
    },
    {
      title: t('overview.upcomingMeetings'),
      value: stats.upcomingMeetings,
      icon: Calendar,
      iconClass: 'text-indigo-600',
      tint: 'bg-indigo-500/10',
      cardTint: 'bg-indigo-500/5',
      view: 'meetings',
    },
  ];

  const quickActions = [
    { label: t('quickActions.addStudent'), icon: UserPlus, view: 'students', color: 'bg-primary hover:bg-primary/90 text-white' },
    { label: t('quickActions.logCall'), icon: PhoneCall, view: 'calls', color: 'bg-[#10B981] hover:bg-[#10B981]/90 text-white' },
    { label: t('quickActions.viewIssues'), icon: AlertCircle, view: 'issues', color: 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white' },
    { label: t('quickActions.scheduleMeeting'), icon: CalendarPlus, view: 'meetings', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { label: t('quickActions.addReminder'), icon: Bell, view: 'reminders', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
    { label: t('quickActions.viewStudents'), icon: Users, view: 'students', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('overview.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('overview.subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => onNavigate?.(stat.view)}
              className={`group ${stat.cardTint} rounded-2xl border border-slate-200/70 shadow-card hover:shadow-card-hover transition-all duration-200 p-6 text-start cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
            >
              <div className={`inline-flex p-3 rounded-2xl ${stat.tint} ${stat.iconClass} mb-4`}>
                <Icon size={40} strokeWidth={1.75} />
              </div>
              <p className="text-5xl font-bold text-slate-900 tabular-nums leading-none">{stat.value}</p>
              <p className="text-slate-500 text-sm font-medium mt-3">{stat.title}</p>
            </button>
          );
        })}
      </div>

      {stats.emergencyMeetings > 0 && (
        <button
          type="button"
          onClick={() => onNavigate?.('meetings')}
          className="w-full text-start bg-red-50 border border-red-200 border-s-4 border-s-[#EF4444] p-4 rounded-2xl cursor-pointer transition-all duration-150 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#EF4444] flex-shrink-0" size={28} />
            <div>
              <h3 className="text-red-800 font-bold">{t('overview.emergency')}</h3>
              <p className="text-red-700 text-sm">
                {stats.emergencyMeetings} {t('overview.upcomingMeetings')}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3">{t('quickActions.title')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate?.(action.view)}
                className={`flex flex-col items-center justify-center gap-2 min-h-[96px] p-4 rounded-2xl shadow-card font-semibold text-sm text-center transition-all duration-150 hover:-translate-y-0.5 ${action.color}`}
              >
                <Icon size={28} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverviewView;