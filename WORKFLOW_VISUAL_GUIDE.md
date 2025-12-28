# Student Workflow System - Visual Overview

## 🔄 Complete Workflow Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STUDENT WORKFLOW JOURNEY                             │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: INTAKE & ASSESSMENT
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│ INITIAL CONTACT  │  👤 Secretary
│  (New Call)      │  ✓ Log parent call
└────────┬─────────┘  ✓ Create student record
         │            ✓ Collect basic info
         ↓
┌──────────────────┐
│ INFO GATHERING   │  👤 M.Z.
│  (School Data)   │  ✓ Contact Menahel/Melamed
└────────┬─────────┘  ✓ Review school records
         │            ✓ Document history
         ↓
┌──────────────────┐
│  ASSESSMENT      │  👤 M.Z.
│  (Full Picture)  │  ✓ Social/Emotional screening
└────────┬─────────┘  ✓ Kriah (reading) evaluation
         │            ✓ Limud (learning) assessment
         │            ✓ Complete student picture
         ↓

Phase 2: PLANNING & SETUP
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│ PLAN CREATION    │  👤 M.Z. + Secretary
│  (Build Plan)    │  ✓ Set goals & objectives
└────────┬─────────┘  ✓ Design interventions
         │            ✓ Assign tutor/therapist
         │            ✓ Set review frequency
         ↓
┌──────────────────┐
│  PLAN REVIEW     │  👤 M.Z.
│  (Get Approval)  │  ✓ Review with Menahel
└────────┬─────────┘  ✓ Adjust if needed
         │            ✓ Approve plan
         ↓
┌──────────────────┐
│ SERVICE SETUP    │  👤 Secretary
│  (Implementation)│  ✓ Match with tutor
└────────┬─────────┘  ✓ Schedule sessions
         │            ✓ Notify parents
         │            ✓ Begin services
         ↓

Phase 3: MONITORING & ADJUSTMENT
═══════════════════════════════════════════════════════════════════════════════

         ┌─────────────────────────────────────┐
         │    ACTIVE MONITORING                │  👤 Secretary
         │    (Ongoing Tracking)               │  
         │                                     │  Weekly/Bi-weekly/Monthly:
         │  ┌───────────────────────────────┐ │  ✓ Check attendance
         │  │ Submit Progress Review        │ │  ✓ Review tutor notes
         │  │                               │ │  ✓ Monitor goals
         │  │ Rate: Excellent/Good/Fair/Poor│ │  ✓ Document progress
         │  │ Document attendance           │ │  
         │  │ Note concerns                 │ │  
         │  │ Flag if progress < 75%        │ │  
         │  └───────────┬───────────────────┘ │
         └──────────────┼─────────────────────┘
                        │
         ┌──────────────┼──────────────────┐
         │              │                  │
         ↓              ↓                  ↓
    Progress         Progress         Progress
    ≥ 75%           < 75%            < 50% + Concerns
         │              │                  │
         │              ↓                  │
         │     ┌──────────────────┐       │
         │     │ PLAN ADJUSTMENT  │       │
         │     │  (Modify Plan)   │  👤 M.Z.
         │     │                  │  ✓ Review concerns
         │     │ ✓ Analyze issues │  ✓ Adjust interventions
         │     │ ✓ Update plan    │  ✓ Change frequency
         │     │ ✓ Reassign if    │  ✓ Add support
         │     │   needed         │
         │     └────────┬─────────┘
         │              │
         └──────────────┴──────────────────┘
                        │
              (Return to Active Monitoring)


Phase 4: COMPLETION
═══════════════════════════════════════════════════════════════════════════════

When goals achieved & sustained progress:

┌──────────────────┐
│   COMPLETED      │  ✓ Services conclude
│  (Success!)      │  ✓ Final report
└──────────────────┘  ✓ Archive case
                      ✓ Parent notification
```

## 📊 System Views Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD NAVIGATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   DASHBOARD     │
│    (Sidebar)    │
└────────┬────────┘
         │
         ├─► Overview                    [Dashboard stats & quick access]
         │
         ├─► 🆕 Intake Workflow          [Manage new cases]
         │   └─► Tabs:
         │       ├─ Initial Contact      [New calls]
         │       ├─ Info Gathering       [School data]
         │       ├─ Assessment            [Evaluations]
         │       ├─ Plan Creation         [Build plans]
         │       └─ Plan Review           [Approval queue]
         │
         ├─► 🆕 Student Monitoring       [Track active cases]
         │   └─► Tabs:
         │       ├─ All Students          [Complete list]
         │       ├─ Needs Review          [Due this week]
         │       ├─ Overdue               [⚠️ Late reviews]
         │       └─ Concerns              [🚨 Escalated cases]
         │
         ├─► Students                     [All students list]
         │   └─► Student Profile
         │       └─► 🆕 Workflow & Plans Tab
         │           ├─ Active plans
         │           ├─ Progress reviews
         │           └─ Escalation flags
         │
         ├─► Calls                        [Communication log]
         ├─► Issues                       [Problems tracking]
         ├─► Meetings                     [Calendar]
         ├─► Teachers                     [Staff management]
         ├─► Tutors                       [Service providers]
         └─► Analytics                    [Reports & insights]
```

## 🎯 User Roles & Permissions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ROLE-BASED ACCESS CONTROL                             │
└──────────────────────────────────────────────────────────────────────────────┘

👤 SECRETARY
├─ ✅ CREATE: Student records, Call logs
├─ ✅ UPDATE: Move students through intake workflow
├─ ✅ ASSIGN: Tutors to students
├─ ✅ SUBMIT: Progress reviews
├─ ✅ VIEW: All students, Plans, Reviews
└─ ✅ FLAG: Students for M.Z. attention

👤 M.Z. (PRINCIPAL/COORDINATOR)  
├─ ✅ ALL Secretary permissions +
├─ ✅ CONDUCT: Assessments
├─ ✅ CREATE: Intervention plans
├─ ✅ APPROVE: Plans
├─ ✅ ADJUST: Plans when needed
├─ ✅ REVIEW: Escalated cases
└─ ✅ VIEW: Full workflow analytics

👤 TEACHER
├─ ✅ VIEW: Own students only
├─ ✅ VIEW: Plans for their students
├─ ✅ LOG: Calls and issues
└─ ❌ LIMITED: No workflow management

👤 TUTOR
├─ ✅ VIEW: Assigned students only
├─ ✅ VIEW: Plans they're involved in
├─ ✅ LOG: Session notes
└─ ❌ LIMITED: No workflow management

👤 ADMIN
└─ ✅ FULL ACCESS: All features
```

## 📈 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATA RELATIONSHIPS                                 │
└──────────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │   STUDENTS   │
                           │  (Core Data) │
                           └───────┬──────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ↓                  ↓                  ↓
        ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
        │  CALL LOGS   │   │ STUDENT_PLANS│  │  CONTACTS    │
        │              │   │              │  │              │
        │ • Parent     │   │ • Goals      │  │ • Father     │
        │   calls      │   │ • Assessment │  │ • Mother     │
        │ • Follow-ups │   │ • Interventions│ │ • Guardian  │
        └──────────────┘   └──────┬───────┘  └──────────────┘
                                  │
                                  ↓
                          ┌──────────────┐
                          │PROGRESS_     │
                          │REVIEWS       │
                          │              │
                          │ • Rating     │
                          │ • Notes      │
                          │ • Concerns   │
                          │ • Escalation │
                          └──────────────┘

WORKFLOW FIELDS ON STUDENT:
• workflow_stage     → Current position in workflow
• assigned_to        → Who's responsible
• intake_date        → When they entered system
```

## 🔔 Notification Triggers (Future Enhancement)

```
EVENT                           → NOTIFICATION
═══════════════════════════════════════════════════════════════════════════════
New student created            → Email to M.Z.
Assessment completed           → Email to Secretary
Plan needs review              → Email to M.Z.
Plan approved                  → Email to Secretary & Parents
Service assigned               → Email to Tutor & Parents
Review due in 2 days          → Email to Secretary
Review overdue                 → Alert on dashboard
Student escalated to M.Z.     → Email to M.Z. + Dashboard alert
Plan adjusted                  → Email to Secretary & Tutor
Monthly summary               → Email to M.Z. (all cases)
```

## 📋 Review Schedule Logic

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTOMATIC REVIEW SCHEDULING                            │
└──────────────────────────────────────────────────────────────────────────────┘

Plan has review_frequency = "weekly"
│
├─► Last review was 7+ days ago
│   └─► Status: ⚠️ REVIEW OVERDUE (Red)
│
├─► Last review was 5-6 days ago
│   └─► Status: ⏰ REVIEW DUE (Yellow)
│
└─► Last review was < 5 days ago
    └─► Status: ✅ Up to date (Green)


Plan has review_frequency = "biweekly"
│
├─► Last review was 14+ days ago  → ⚠️ OVERDUE
├─► Last review was 12-13 days ago → ⏰ DUE
└─► Last review was < 12 days ago  → ✅ OK


Plan has review_frequency = "monthly"
│
├─► Last review was 30+ days ago   → ⚠️ OVERDUE
├─► Last review was 28-29 days ago → ⏰ DUE
└─► Last review was < 28 days ago  → ✅ OK
```

## 🎨 UI Components Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT STRUCTURE                                 │
└──────────────────────────────────────────────────────────────────────────────┘

VIEWS (Full Pages)
├─ IntakeWorkflowView.jsx       → Kanban-style workflow stages
├─ MonitoringDashboardView.jsx  → Progress tracking grid
└─ StudentProfileView.jsx       → Enhanced with workflow tab

MODALS (Popups)
├─ StudentModal.jsx             → Create/edit student
├─ StudentPlanModal.jsx         → Create/edit intervention plan
└─ CallLogModal.jsx             → Log parent communication

COMPONENTS (Reusable)
└─ WorkflowBadge.jsx            → Colored stage indicators

UI ELEMENTS (shadcn/ui)
├─ Button, Card, Badge
├─ Tabs, Dialog, Sheet
├─ Input, Select, Textarea
└─ Table, Toast
```

---

## 🚀 Quick Reference

**Move student forward:**
1. Find student in current stage tab
2. Click action button (e.g., "Start Info Gathering")
3. Complete required action
4. Student automatically moves to next stage

**Submit review:**
1. Go to Student Monitoring
2. Find student (Needs Review or Overdue)
3. Click "Submit Review"
4. Fill rating + notes
5. Check "Escalate" if progress < 75%

**Create plan:**
1. Find student in "Plan Creation" stage
2. Click "Create Plan"
3. Enter goals + assessments
4. Add interventions
5. Save → moves to review

**View student history:**
1. Click student name anywhere
2. Go to "Workflow & Plans" tab
3. See all plans + reviews

---

This visual guide complements the technical documentation and provides a quick reference for understanding the workflow system's structure and flow.
