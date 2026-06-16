/**
 * Incoming-call screen-pop.
 *
 * Subscribes to Supabase Realtime INSERTs on `inbound_calls` filtered to the
 * signed-in user (target_user_id). When a call rings their extension, a popup
 * appears showing who's calling:
 *   - parent with one child  → one-click "Open profile"
 *   - parent with 2+ children → choose which student to open
 *   - tutor                  → open the tutor's client list
 *   - staff / unknown        → show the caller info
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneIncoming, User, Users, X, GraduationCap } from 'lucide-react';

const IncomingCallContext = createContext(null);
export const useIncomingCall = () => useContext(IncomingCallContext) || {};

export const IncomingCallProvider = ({ children }) => {
  const { profile } = useAuth();
  const { open: openStudent } = useStudentProfile();
  const [call, setCall] = useState(null);
  const [students, setStudents] = useState([]);

  const dismiss = useCallback(() => {
    setCall(null);
    setStudents([]);
  }, []);

  // Load student display names for the matched ids (multi-kid chooser / tutor clients).
  const loadStudents = useCallback(async (ids) => {
    if (!ids || !ids.length) {
      setStudents([]);
      return;
    }
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, name, hebrew_name')
      .in('id', ids);
    setStudents(
      (data || []).map((s) => ({
        id: s.id,
        name:
          [s.first_name, s.last_name].filter(Boolean).join(' ').trim() ||
          s.name ||
          s.hebrew_name ||
          'Student',
      }))
    );
  }, []);

  // Track call ids we've already shown so Realtime and the polling fallback
  // never pop the same call twice (and a dismissed call never re-pops).
  const seenIds = useRef(new Set());

  const presentCall = useCallback(
    (row) => {
      if (!row || row.status !== 'ringing') return;
      if (seenIds.current.has(row.id)) return;
      seenIds.current.add(row.id);
      setCall(row);
      loadStudents(row.matched_student_ids || []);
    },
    [loadStudents]
  );

  useEffect(() => {
    if (!profile?.id) return undefined;

    let active = true;
    let pollTimer;

    // --- Primary: Supabase Realtime (instant screen-pop) ---
    const channel = supabase
      .channel(`inbound-calls-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inbound_calls',
          filter: `target_user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('[IncomingCall] realtime INSERT', payload.new?.id, payload.new?.status);
          presentCall(payload.new);
        }
      )
      .subscribe((status, err) => {
        // SUBSCRIBED | CHANNEL_ERROR | TIMED_OUT | CLOSED
        console.log('[IncomingCall] channel status:', status, err || '');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(
            '[IncomingCall] Realtime WebSocket unavailable (often blocked on filtered/proxy networks). ' +
              'Screen-pop will use the polling fallback instead.'
          );
        }
      });

    // --- Fallback: short-interval polling ---
    // Works even when the wss:// Realtime socket is blocked by a network filter
    // or proxy. Looks for a recent ringing call targeted at this user. The
    // seenIds guard means this and Realtime can run together without dupes.
    const poll = async () => {
      if (!active) return;
      try {
        const since = new Date(Date.now() - 90 * 1000).toISOString();
        const { data, error } = await supabase
          .from('inbound_calls')
          .select('*')
          .eq('target_user_id', profile.id)
          .eq('status', 'ringing')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) {
          console.warn('[IncomingCall] poll error:', error.message);
        } else if (data && data[0]) {
          presentCall(data[0]);
        }
      } catch (e) {
        console.warn('[IncomingCall] poll exception:', e?.message);
      } finally {
        if (active) pollTimer = setTimeout(poll, 4000);
      }
    };
    poll();

    return () => {
      active = false;
      if (pollTimer) clearTimeout(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, presentCall]);

  const handleOpenStudent = (id) => {
    openStudent(id);
    dismiss();
  };

  return (
    <IncomingCallContext.Provider value={{ call, dismiss }}>
      {children}

      <Dialog open={!!call} onOpenChange={(o) => !o && dismiss()}>
        <DialogContent className="max-w-md p-0 overflow-hidden" dir="ltr">
          <DialogTitle className="sr-only">Incoming call</DialogTitle>
          {call && (
            <div>
              <div className="bg-emerald-600 text-white px-5 py-4 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <PhoneIncoming className="h-5 w-5" />
                <span className="font-semibold">Incoming call</span>
                <button onClick={dismiss} className="ml-auto opacity-80 hover:opacity-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-5 py-4">
                <p className="text-2xl font-bold text-slate-800">
                  {call.matched_name || 'Unknown caller'}
                </p>
                <p className="text-slate-500 text-sm mt-0.5">{call.caller_number || 'No caller ID'}</p>

                <div className="mt-3">
                  {call.matched_type === 'parent' && (
                    <CallerBadge icon={Users} label="Parent" />
                  )}
                  {call.matched_type === 'staff' && (
                    <CallerBadge icon={User} label="Staff member" />
                  )}
                  {call.matched_type === 'tutor' && (
                    <CallerBadge icon={GraduationCap} label="Tutor" />
                  )}
                  {(!call.matched_type || call.matched_type === 'unknown') && (
                    <CallerBadge icon={User} label="Not in system" />
                  )}
                </div>

                {students.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      {call.matched_type === 'tutor' ? 'Their students' : 'Open student'}
                    </p>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {students.map((s) => (
                        <Button
                          key={s.id}
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleOpenStudent(s.id)}
                        >
                          <User className="h-4 w-4 mr-2 text-emerald-600" />
                          {s.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={dismiss}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </IncomingCallContext.Provider>
  );
};

const CallerBadge = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
    <Icon className="h-3.5 w-3.5" />
    {label}
  </span>
);

export default IncomingCallContext;
