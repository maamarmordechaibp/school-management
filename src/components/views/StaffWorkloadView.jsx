import React, { useState, useEffect, useMemo } from 'react';
import { Users, AlertTriangle, Clock, CheckSquare, Loader2, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchAllRows } from '@/lib/fetchAll';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/states';

const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Staff Workload (Phase 17) — an administrator overview of how much open work
 * each staff member has: open / overdue / due-today tasks, open issues and
 * assigned students. Read-only aggregation; clicking a row opens the task list.
 */
const StaffWorkloadView = ({ onNavigate }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState('overdue');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const today = todayStr();
      const [usersData, todosData, studentsData, issuesData] = await Promise.all([
        fetchAllRows(() => supabase.from('app_users').select('id, name, first_name, last_name, role, is_active')),
        fetchAllRows(() => supabase.from('todos').select('assigned_to, status, due_date')),
        fetchAllRows(() => supabase.from('students').select('assigned_to')),
        fetchAllRows(() => supabase.from('student_issues').select('assigned_to, status')),
      ]);

      const byUser = {};
      const ensure = (id) => (byUser[id] = byUser[id] || { open: 0, overdue: 0, dueToday: 0, students: 0, issues: 0 });

      for (const t of todosData || []) {
        if (!t.assigned_to || t.status === 'completed') continue;
        const u = ensure(t.assigned_to);
        u.open += 1;
        if (t.due_date && t.due_date < today) u.overdue += 1;
        else if (t.due_date === today) u.dueToday += 1;
      }
      for (const s of studentsData || []) {
        if (s.assigned_to) ensure(s.assigned_to).students += 1;
      }
      for (const i of issuesData || []) {
        if (i.assigned_to && i.status !== 'closed' && i.status !== 'resolved') ensure(i.assigned_to).issues += 1;
      }

      const staff = (usersData || [])
        .filter((u) => u.is_active !== false)
        .map((u) => {
          const agg = byUser[u.id] || { open: 0, overdue: 0, dueToday: 0, students: 0, issues: 0 };
          const name = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.role || 'Staff';
          return { id: u.id, name, role: u.role, ...agg };
        })
        .filter((u) => u.open > 0 || u.students > 0 || u.issues > 0);

      setRows(staff);
    } catch (error) {
      console.error('Failed to load staff workload:', error);
      setError(true);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load staff workload.' });
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const av = a[sortKey] || 0, bv = b[sortKey] || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const Th = ({ k, children, className = '' }) => (
    <TableHead className={`cursor-pointer select-none ${className}`} onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">{children}<ArrowUpDown size={12} className="opacity-40" /></span>
    </TableHead>
  );

  const totals = rows.reduce(
    (acc, r) => ({ open: acc.open + r.open, overdue: acc.overdue + r.overdue, dueToday: acc.dueToday + r.dueToday }),
    { open: 0, overdue: 0, dueToday: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Staff Workload</h2>
        <p className="text-muted-foreground mt-1">Open work per staff member — spot who is overloaded.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
          <div className="flex items-center gap-2 text-slate-500 text-sm"><CheckSquare size={16} /> Open tasks</div>
          <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">{totals.open}</p>
        </div>
        <div className="rounded-2xl border border-red-200 p-4 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 text-sm"><AlertTriangle size={16} /> Overdue</div>
          <p className="text-3xl font-bold text-red-700 tabular-nums mt-1">{totals.overdue}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 p-4 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-600 text-sm"><Clock size={16} /> Due today</div>
          <p className="text-3xl font-bold text-amber-700 tabular-nums mt-1">{totals.dueToday}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-border/70 overflow-hidden">
        {loading ? (
          <LoadingState label="Loading workload…" />
        ) : error ? (
          <ErrorState title="Couldn't load workload" onRetry={load} />
        ) : sorted.length === 0 ? (
          <EmptyState icon={Users} title="No open staff workload" description="When staff have open tasks, issues or assigned students, they'll show here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <Th k="name">Staff Member</Th>
                <Th k="open" className="text-center">Open</Th>
                <Th k="overdue" className="text-center">Overdue</Th>
                <Th k="dueToday" className="text-center">Due Today</Th>
                <Th k="students" className="text-center">Students</Th>
                <Th k="issues" className="text-center">Open Issues</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onNavigate?.('todos')}
                >
                  <TableCell className="font-medium text-slate-800">
                    {r.name}
                    {r.role && <span className="ms-2 text-xs text-slate-400">{r.role}</span>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{r.open}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.overdue > 0 ? <span className="font-semibold text-red-600">{r.overdue}</span> : <span className="text-slate-300">0</span>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.dueToday > 0 ? <span className="font-semibold text-amber-600">{r.dueToday}</span> : <span className="text-slate-300">0</span>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-slate-600">{r.students}</TableCell>
                  <TableCell className="text-center tabular-nums text-slate-600">{r.issues}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default StaffWorkloadView;
