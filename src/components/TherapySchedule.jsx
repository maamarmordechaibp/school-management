import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, User } from 'lucide-react';

// Day tokens we might find in the free-text `schedule_days` column.
const DAYS = [
  { idx: 0, label: 'Sun', he: 'זונטאג', tokens: ['sun', 'sunday', 'זונטאג', 'ראשון', 'א'] },
  { idx: 1, label: 'Mon', he: 'מאנטאג', tokens: ['mon', 'monday', 'מאנטאג', 'שני', 'ב'] },
  { idx: 2, label: 'Tue', he: 'דינסטאג', tokens: ['tue', 'tues', 'tuesday', 'דינסטאג', 'שלישי', 'ג'] },
  { idx: 3, label: 'Wed', he: 'מיטוואך', tokens: ['wed', 'wednesday', 'מיטוואך', 'רביעי', 'ד'] },
  { idx: 4, label: 'Thu', he: 'דאנערשטאג', tokens: ['thu', 'thur', 'thurs', 'thursday', 'דאנערשטאג', 'חמישי', 'ה'] },
  { idx: 5, label: 'Fri', he: 'פרייטאג', tokens: ['fri', 'friday', 'פרייטאג', 'שישי', 'ו'] },
];

const COLORS = [
  'bg-purple-100 border-purple-300 text-purple-900',
  'bg-sky-100 border-sky-300 text-sky-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-rose-100 border-rose-300 text-rose-900',
  'bg-indigo-100 border-indigo-300 text-indigo-900',
];

// Parse the free-text schedule_days into a set of weekday indexes (0=Sun..5=Fri).
const parseDays = (raw) => {
  if (!raw) return [];
  const text = String(raw).toLowerCase();
  const hit = new Set();
  DAYS.forEach((d) => {
    if (d.tokens.some((t) => text.includes(t))) hit.add(d.idx);
  });
  return Array.from(hit);
};

const monthLabel = (d) =>
  d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const TherapySchedule = ({ tutoring = [], sessionLogs = [] }) => {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // Assign a stable color per tutoring row.
  const colored = useMemo(
    () => tutoring.map((t, i) => ({ ...t, _color: COLORS[i % COLORS.length], _days: parseDays(t.schedule_days) })),
    [tutoring]
  );

  // Map "YYYY-MM-DD" -> list of session logs on that day.
  const sessionsByDay = useMemo(() => {
    const map = new Map();
    sessionLogs.forEach((s) => {
      if (!s.session_date) return;
      const key = String(s.session_date).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [sessionLogs]);

  // Which weekday indexes have a recurring assignment (for calendar highlight).
  const recurringDays = useMemo(() => {
    const set = new Set();
    colored.forEach((t) => t._days.forEach((d) => set.add(d)));
    return set;
  }, [colored]);

  // Build the calendar grid for the current month.
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back up to Sunday
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    const rows = [];
    for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
    return rows;
  }, [cursor]);

  const todayKey = new Date().toISOString().slice(0, 10);

  if (!tutoring.length && !sessionLogs.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-400 text-sm">
          No therapy or tutoring on file yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------- Weekly schedule grid ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock size={18} className="text-purple-600" /> טעראפי סקעדזשועל · Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colored.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No recurring sessions defined.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {DAYS.map((day) => {
                const items = colored.filter((t) => t._days.includes(day.idx));
                return (
                  <div key={day.idx} className="min-h-[96px] rounded-lg border bg-slate-50/60 p-2">
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-slate-700">{day.he}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{day.label}</p>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((t) => (
                        <div key={t.id} className={`rounded border px-1.5 py-1 text-[11px] ${t._color}`}>
                          <p className="font-semibold truncate">{t.tutor_name}</p>
                          {t.schedule_time && <p className="opacity-80">{t.schedule_time}</p>}
                          {t.subject && <p className="opacity-70 truncate">{t.subject}</p>}
                        </div>
                      ))}
                      {items.length === 0 && <p className="text-center text-[10px] text-slate-300">—</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* legend of tutors */}
          {colored.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {colored.map((t) => (
                <span key={t.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${t._color}`}>
                  <User size={11} /> {t.tutor_name}
                  {t.frequency ? <span className="opacity-70">· {t.frequency}</span> : null}
                  {t.location ? <span className="opacity-70 inline-flex items-center gap-0.5"><MapPin size={10} /> {t.location}</span> : null}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Month calendar of actual sessions ---------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays size={18} className="text-sky-600" /> טעראפי קאלענדער · Therapy Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium w-36 text-center">{monthLabel(cursor)}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map((d) => {
                  const key = d.toISOString().slice(0, 10);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const sessions = sessionsByDay.get(key) || [];
                  const scheduled = inMonth && recurringDays.has(d.getDay()) && d.getDay() <= 5;
                  return (
                    <div
                      key={key}
                      className={`min-h-[54px] rounded-md border p-1 text-left ${
                        inMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-300'
                      } ${key === todayKey ? 'ring-2 ring-sky-400' : ''} ${
                        scheduled && sessions.length === 0 ? 'bg-sky-50/50 border-sky-200' : ''
                      }`}
                    >
                      <div className="text-[11px] font-medium">{d.getDate()}</div>
                      <div className="mt-0.5 space-y-0.5">
                        {sessions.slice(0, 2).map((s) => (
                          <div key={s.id} className="rounded bg-emerald-100 text-emerald-800 px-1 py-0.5 text-[9px] truncate" title={s.subject || ''}>
                            {(s.staff && (s.staff.hebrew_name || s.staff.name)) || s.tutor_name || 'Session'}
                          </div>
                        ))}
                        {sessions.length > 2 && (
                          <div className="text-[9px] text-slate-400">+{sessions.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Session logged</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-sky-50 border border-sky-200" /> Scheduled day</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded ring-2 ring-sky-400" /> Today</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TherapySchedule;
