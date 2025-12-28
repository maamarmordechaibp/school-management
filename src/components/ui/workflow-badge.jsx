import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, FileText, Users, CalendarCheck, TrendingUp } from 'lucide-react';

const WORKFLOW_STAGES = {
  'initial_contact': {
    label: 'Initial Contact',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: FileText
  },
  'info_gathering': {
    label: 'Info Gathering',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Users
  },
  'assessment': {
    label: 'Assessment',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: AlertCircle
  },
  'plan_creation': {
    label: 'Creating Plan',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: FileText
  },
  'plan_review': {
    label: 'Plan Review',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: CalendarCheck
  },
  'service_setup': {
    label: 'Setting Up Services',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Clock
  },
  'active_monitoring': {
    label: 'Active Monitoring',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: TrendingUp
  },
  'plan_adjustment': {
    label: 'Plan Adjustment',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertCircle
  },
  'completed': {
    label: 'Completed',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: CheckCircle
  }
};

export const WorkflowBadge = ({ stage, showIcon = true, className = '' }) => {
  const config = WORKFLOW_STAGES[stage] || WORKFLOW_STAGES['initial_contact'];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} ${className}`}>
      {showIcon && <Icon size={14} className="mr-1" />}
      {config.label}
    </Badge>
  );
};

export { WORKFLOW_STAGES };
