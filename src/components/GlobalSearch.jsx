import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, AlertTriangle, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

/**
 * GlobalSearch — a single search box (in the app header) that queries the
 * database directly (not just rows already loaded in a view), so staff can
 * find any student, open issue, or recent call from anywhere.
 *
 * Results are debounced and run server-side via ilike, so they are NOT limited
 * to the current page/view and work with Hebrew/Yiddish names.
 *
 * Selecting a result opens the student profile modal via StudentProfileContext.
 */
const GlobalSearch = () => {
  const { open: openStudentProfile } = useStudentProfile();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], issues: [], calls: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+K focuses the search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runSearch = useCallback(async (term) => {
    const q = term.trim();
    if (q.length < 2) {
      setResults({ students: [], issues: [], calls: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Escape PostgREST `or` reserved characters in the user input.
      const safe = q.replace(/[%,()]/g, ' ');
      const like = `%${safe}%`;

      const [studentsRes, issuesRes, callsRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, first_name, last_name, hebrew_name, father_name, mother_name, father_phone, mother_phone, class:classes!class_id(name)')
          .or(
            `first_name.ilike.${like},last_name.ilike.${like},hebrew_name.ilike.${like},` +
            `father_name.ilike.${like},mother_name.ilike.${like},` +
            `father_phone.ilike.${like},mother_phone.ilike.${like}`
          )
          .limit(8),
        supabase
          .from('student_issues')
          .select('id, title, status, severity, student:students(id, first_name, last_name, hebrew_name)')
          .or(`title.ilike.${like},description.ilike.${like}`)
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('call_logs')
          .select('id, contact_person, phone_number, notes, student:students(id, first_name, last_name, hebrew_name)')
          .or(`contact_person.ilike.${like},phone_number.ilike.${like},notes.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setResults({
        students: studentsRes.data || [],
        issues: issuesRes.data || [],
        calls: callsRes.data || [],
      });
    } catch (err) {
      console.error('Global search failed:', err);
      setResults({ students: [], issues: [], calls: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 250);
  };

  const selectStudent = (studentId) => {
    if (!studentId) return;
    openStudentProfile(studentId);
    setIsOpen(false);
    setQuery('');
    setResults({ students: [], issues: [], calls: [] });
  };

  const displayName = (s) =>
    s?.hebrew_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim() || 'Unnamed';

  const totalResults = results.students.length + results.issues.length + results.calls.length;
  const hasQuery = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search students, issues, calls…  (Ctrl+K)"
          className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults({ students: [], issues: [], calls: [] }); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && hasQuery && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching…
            </div>
          ) : totalResults === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">
              No results for “{query}”
            </div>
          ) : (
            <div className="py-1">
              {/* Students */}
              {results.students.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">
                    Students
                  </div>
                  {results.students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStudent(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {displayName(s).charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">{displayName(s)}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {s.class?.name ? `${s.class.name} · ` : ''}
                          {[s.father_name, s.father_phone].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <User className="h-4 w-4 text-slate-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Issues */}
              {results.issues.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">
                    Open Issues
                  </div>
                  {results.issues.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => selectStudent(i.student?.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 text-left transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">{i.title}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {displayName(i.student)} · {i.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Calls */}
              {results.calls.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">
                    Call Logs
                  </div>
                  {results.calls.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectStudent(c.student?.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-green-50 text-left transition-colors"
                    >
                      <Phone className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {c.contact_person || c.phone_number || 'Call'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {c.student ? `${displayName(c.student)} · ` : ''}{c.notes || ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
