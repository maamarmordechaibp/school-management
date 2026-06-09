import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const OverviewView = ({ role = 'principal' }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
      tint: 'bg-primary/10 text-primary',
    },
    {
      title: t('overview.openIssues'),
      value: stats.openIssues,
      icon: AlertCircle,
      tint: 'bg-warning/10 text-warning',
    },
    {
      title: t('overview.pendingCalls'),
      value: stats.pendingCalls,
      icon: Phone,
      tint: 'bg-success/10 text-success',
    },
    {
      title: t('overview.upcomingMeetings'),
      value: stats.upcomingMeetings,
      icon: Calendar,
      tint: 'bg-indigo-500/10 text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t('overview.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group bg-white rounded-xl border border-border/70 shadow-card hover:shadow-card-hover transition-all duration-200 p-5 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-[13px] font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.tint} transition-transform duration-200 group-hover:scale-105`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats.emergencyMeetings > 0 && (
        <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 p-4 rounded-xl text-left">
          <div className="flex items-center gap-3 justify-start flex-row">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <h3 className="text-red-800 font-semibold">{t('overview.emergency')}</h3>
              <p className="text-red-700 text-sm">
                {stats.emergencyMeetings} meetings need attention!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewView;