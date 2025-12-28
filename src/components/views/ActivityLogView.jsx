import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { History, Search } from 'lucide-react';

const ActivityLogView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Activity Log</h2>
        <p className="text-slate-600 mt-1">Recent system actions and audits</p>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <History size={18} /> Recent Actions
          </h3>
          <span className="text-xs text-slate-500">Last 50 records</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No activity recorded yet.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-800">{log.action}</p>
                    <p className="text-sm text-slate-600">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;