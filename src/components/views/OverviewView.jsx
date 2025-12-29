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
        supabase.from('issues').select('id', { count: 'exact' }).eq('status', 'open'),
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
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: t('overview.openIssues'),
      value: stats.openIssues,
      icon: AlertCircle,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: t('overview.pendingCalls'),
      value: stats.pendingCalls,
      icon: Phone,
      color: 'from-green-500 to-green-600',
    },
    {
      title: t('overview.upcomingMeetings'),
      value: stats.upcomingMeetings,
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">{t('overview.title')}</h2>
        <p className="text-slate-600 mt-2">{t('overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {stats.emergencyMeetings > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-left">
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