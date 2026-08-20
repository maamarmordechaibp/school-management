import { supabase } from '@/lib/customSupabaseClient';
import { apiFetch } from '@/lib/apiClient';

/**
 * Gather EVERYTHING we know about a student (that the current user is allowed to
 * see — Supabase RLS applies to these reads) into a compact bundle for the AI
 * report. Sensitive special-education content is only included for staff/
 * principal audiences when the caller has sensitive access.
 */
export async function gatherStudentBundle(studentId, { audience = 'staff', canSensitive = false } = {}) {
  const short = (s, n = 400) => (s ? String(s).slice(0, n) : undefined);

  const [
    studentRes, notesRes, assessRes, gradesRes, callsRes, meetingsRes,
    todosRes, remindersRes, plansRes, issuesRes, casesRes, reportsRes, tutoringRes, latesRes,
    progressRes, apptRes, farhersRes, pointsRes,
  ] = await Promise.all([
    supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
    supabase.from('student_notes').select('note_type, content, created_at, created_by_name').eq('student_id', studentId).order('created_at', { ascending: false }).limit(40),
    supabase.from('assessments').select('assessment_type, assessment_date, overall_notes, social_emotional_rating, kriah_rating, limud_rating').eq('student_id', studentId).order('assessment_date', { ascending: false }).limit(15),
    supabase.from('grades').select('subject, grade, quarter, school_year, notes').eq('student_id', studentId).order('created_at', { ascending: false }).limit(40),
    supabase.from('call_logs').select('call_date, contact_person, subject, summary, outcome').eq('student_id', studentId).order('call_date', { ascending: false }).limit(20),
    supabase.from('meetings').select('scheduled_date, meeting_type, title, notes, status').eq('student_id', studentId).order('scheduled_date', { ascending: false }).limit(20),
    supabase.from('todos').select('title, description, status, priority, due_date').eq('student_id', studentId).neq('status', 'completed').limit(30),
    supabase.from('reminders').select('title, description, reminder_date, status').eq('related_student_id', studentId).limit(20),
    supabase.from('student_plans').select('goals, social_emotional_notes, kriah_notes, limud_notes, status').eq('student_id', studentId).order('created_at', { ascending: false }).limit(5),
    supabase.from('student_issues').select('title, description, category, severity, status, resolution').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    supabase.from('support_cases').select('title, case_type, status, priority, summary, outcome').eq('student_id', studentId).order('created_at', { ascending: false }).limit(15),
    supabase.from('child_reports').select('title, category, report_date, summary, content').eq('student_id', studentId).order('report_date', { ascending: false }).limit(10),
    supabase.from('tutor_assignments').select('subject, status, sessions_per_week, start_date, end_date, notes').eq('student_id', studentId).limit(15),
    supabase.from('late_arrivals').select('date, minutes_late, reason, excused').eq('student_id', studentId).order('date', { ascending: false }).limit(20),
    supabase.from('progress_reviews').select('progress_rating, attendance_status, notes, concerns, action_needed, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(15),
    supabase.from('tutoring_schedule').select('tutor_name, subject, day_of_week, appointment_date, start_time, status, notes').eq('student_id', studentId).limit(30),
    supabase.from('farhers').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(25),
    supabase.from('points').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(40),
  ]);

  const s = studentRes.data || {};
  const bundle = {
    // Identity fields for the HEADER block only (not the narrative). Mother's name is intentionally excluded.
    header: {
      name: s.hebrew_name || s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      today: new Date().toISOString().slice(0, 10),
      date_of_birth: s.date_of_birth || undefined,
      address: [s.address, s.city].filter(Boolean).join(', ') || undefined,
      father_name: s.father_name || undefined,
      class: s.class || undefined,
      status: s.status || undefined,
    },
    notes: (notesRes.data || []).map((n) => ({ date: n.created_at, type: n.note_type, by: n.created_by_name, text: short(n.content) })),
    assessments: (assessRes.data || []).map((a) => ({ date: a.assessment_date, type: a.assessment_type, notes: short(a.overall_notes), ratings: { social_emotional: a.social_emotional_rating, kriah: a.kriah_rating, limud: a.limud_rating } })),
    grades: (gradesRes.data || []).map((g) => ({ subject: g.subject, grade: g.grade, quarter: g.quarter, year: g.school_year, notes: short(g.notes, 120) })),
    communication: {
      calls: (callsRes.data || []).map((c) => ({ date: c.call_date, with: c.contact_person, subject: c.subject, summary: short(c.summary), outcome: c.outcome })),
      meetings: (meetingsRes.data || []).map((m) => ({ date: m.scheduled_date, type: m.meeting_type, title: m.title, notes: short(m.notes), status: m.status })),
    },
    open_tasks: (todosRes.data || []).map((t) => ({ title: t.title, priority: t.priority, due: t.due_date, notes: short(t.description, 160) })),
    follow_ups: (remindersRes.data || []).map((r) => ({ title: r.title, date: r.reminder_date, status: r.status })),
    plans: (plansRes.data || []).map((p) => ({ goals: short(p.goals), status: p.status, social_emotional: short(p.social_emotional_notes, 200), kriah: short(p.kriah_notes, 200), limud: short(p.limud_notes, 200) })),
    concerns: (issuesRes.data || []).map((i) => ({ title: i.title, category: i.category, severity: i.severity, status: i.status, detail: short(i.description), resolution: short(i.resolution) })),
    support_cases: (casesRes.data || []).map((c) => ({ title: c.title, type: c.case_type, status: c.status, priority: c.priority, summary: short(c.summary), outcome: short(c.outcome) })),
    prior_reports: (reportsRes.data || []).map((r) => ({ title: r.title, category: r.category, date: r.report_date, summary: short(r.summary), sections: Array.isArray(r.content) ? r.content.map((x) => ({ heading: x.heading, text: short(x.text, 300) })) : undefined })),
    tutoring: (tutoringRes.data || []).map((t) => ({ subject: t.subject, status: t.status, per_week: t.sessions_per_week, start: t.start_date, end: t.end_date, notes: short(t.notes, 160) })),
    appointments: (apptRes.data || []).map((a) => ({ tutor: a.tutor_name, subject: a.subject, day_of_week: a.day_of_week, date: a.appointment_date, time: a.start_time, status: a.status, notes: short(a.notes, 120) })),
    progress_reviews: (progressRes.data || []).map((p) => ({ date: p.created_at, rating: p.progress_rating, attendance: p.attendance_status, notes: short(p.notes), concerns: short(p.concerns), action: short(p.action_needed) })),
    farhers: (farhersRes.data || []).slice(0, 20),
    points_midos: (pointsRes.data || []).slice(0, 30),
    late_arrivals: {
      count: (latesRes.data || []).length,
      recent: (latesRes.data || []).slice(0, 8).map((l) => ({ date: l.date, minutes: l.minutes_late, reason: l.reason, excused: l.excused })),
    },
  };

  // Sensitive special-education — gathered whenever the CALLER is authorized
  // (any audience). How much of it surfaces in the text is decided by the prompt.
  if (canSensitive) {
    // Evaluation requests are gathered independently — a student may have a
    // referral/request WITHOUT a formal special_ed_students enrollment yet.
    const [{ data: sed }, evalReqRes] = await Promise.all([
      supabase.from('special_ed_students').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('special_ed_evaluation_requests').select('reason, evaluation_type, priority, status').eq('student_id', studentId).order('created_at', { ascending: false }).limit(10),
    ]);
    const evalRequests = (evalReqRes.data || []).map((r) => ({ reason: short(r.reason), type: r.evaluation_type, priority: r.priority, status: r.status }));
    if (evalRequests.length) bundle.evaluation_requests = evalRequests;
    if (sed) {
      bundle.receives_special_ed = true;
      const seId = sed.id;
      const [evalsRes, sourcesRes, logsRes, monthlyRes, sedTutRes] = await Promise.all([
        supabase.from('special_ed_evaluations').select('evaluation_type, evaluator_name, evaluation_date, results, recommendations, plan, actual_actions').eq('special_ed_student_id', seId).order('evaluation_date', { ascending: false }).limit(15),
        supabase.from('special_ed_info_sources').select('source_type, content, date_gathered').eq('special_ed_student_id', seId).order('date_gathered', { ascending: false }).limit(20),
        supabase.from('special_ed_session_logs').select('session_date, subject, content, progress_notes, goals_worked_on').eq('special_ed_student_id', seId).order('session_date', { ascending: false }).limit(25),
        supabase.from('special_ed_monthly_reports').select('report_month, what_was_done, progress, challenges, goals_next_month, recommendations').eq('special_ed_student_id', seId).order('report_month', { ascending: false }).limit(12),
        supabase.from('special_ed_tutoring').select('tutor_name, tutor_type, subject, schedule_days, schedule_time, frequency, start_date, end_date').eq('special_ed_student_id', seId).limit(15),
      ]);
      bundle.special_education = {
        status: sed.status, referral_reason: short(sed.referral_reason), referral_date: sed.referral_date,
        help_type: sed.help_type, help_description: short(sed.help_description), current_plan: short(sed.current_plan),
        iep_start: sed.iep_start_date, iep_end: sed.iep_end_date,
        evaluations: (evalsRes.data || []).map((e) => ({ date: e.evaluation_date, type: e.evaluation_type, evaluator: e.evaluator_name, results: short(e.results), recommendations: short(e.recommendations), plan: short(e.plan), actions: short(e.actual_actions) })),
        info_sources: (sourcesRes.data || []).map((x) => ({ source: x.source_type, date: x.date_gathered, content: short(x.content) })),
        session_logs: (logsRes.data || []).map((l) => ({ date: l.session_date, subject: l.subject, content: short(l.content), progress: short(l.progress_notes), goals: short(l.goals_worked_on) })),
        monthly_reports: (monthlyRes.data || []).map((m) => ({ month: m.report_month, done: short(m.what_was_done), progress: short(m.progress), challenges: short(m.challenges), next_goals: short(m.goals_next_month), recommendations: short(m.recommendations) })),
        therapy: (sedTutRes.data || []).map((t) => ({ tutor: t.tutor_name, type: t.tutor_type, subject: t.subject, days: t.schedule_days, time: t.schedule_time, frequency: t.frequency, start: t.start_date, end: t.end_date })),
      };
    } else if (evalRequests.length) {
      // Referred / evaluation requested but not yet formally enrolled.
      bundle.special_ed_pending = true;
    }
    if (s.medical_notes) bundle.medical_notes = short(s.medical_notes);
  }

  return { student: s, bundle };
}

/** Call the AI report endpoint. Returns the generated report text. */
export async function generateAIReport({ studentId, audience = 'staff', language = 'yi', canSensitive = false }) {
  const { student, bundle } = await gatherStudentBundle(studentId, { audience, canSensitive });
  const res = await apiFetch('/api/ai-report', {
    method: 'POST',
    body: { student: { id: student.id, name: student.name, hebrew_name: student.hebrew_name, first_name: student.first_name, last_name: student.last_name }, bundle, audience, language },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Report failed (HTTP ${res.status})`);
  return json.report;
}
