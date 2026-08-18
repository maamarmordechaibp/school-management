import React from 'react';
import { Inbox, AlertTriangle, Lock, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared, consistent state components (Phase 27) so every feature can show a
 * clear loading / empty / error / permission-denied state instead of a blank
 * screen or a silent failure.
 */

export const LoadingState = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 text-slate-400 ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin mb-2" />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
    <Icon className="h-9 w-9 text-slate-300 mb-3" />
    <p className="text-slate-700 font-medium">{title}</p>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description, onRetry, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
    <AlertTriangle className="h-9 w-9 text-red-400 mb-3" />
    <p className="text-slate-700 font-medium">{title}</p>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
    {onRetry && (
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" /> Try again
      </Button>
    )}
  </div>
);

export const PermissionDenied = ({ description = 'You don’t have access to this information.', className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
    <Lock className="h-9 w-9 text-slate-300 mb-3" />
    <p className="text-slate-700 font-medium">Restricted</p>
    <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
  </div>
);
