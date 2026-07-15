export const english = {
  // Navigation
  nav: {
    overview: "Overview",
    students: "Students",
    issues: "Issues",
    calls: "Call Logs",
    meetings: "Meetings",
    calendar: "Calendar",
    reports: "Reports",
    templates: "Templates",
    timeslots: "Time Slots",
    bulkschedule: "Bulk Schedule",
    activity: "Activity Log",
    logout: "Logout",
    role: "Role",
    welcome: "Welcome",
  },
  
  // Dashboard / Overview
  overview: {
    title: "Control Center",
    subtitle: "School overview at a glance",
    totalStudents: "Total Students",
    openIssues: "Open Issues",
    pendingCalls: "Calls Pending",
    upcomingMeetings: "Upcoming Meetings",
    emergency: "Urgent! Past due meetings",
  },

  // Students
  students: {
    title: "Student List",
    search: "Search students...",
    add: "Add Student",
    import: "Import from Excel",
    class: "Class",
    teacher: "Teacher",
    father: "Father",
    mother: "Mother",
    phone: "Phone",
    viewProfile: "View Full Profile",
    markAttendance: "Mark Attendance",
    sms: "Send SMS",
    selectAll: "Select All",
    status: {
      present: "Present",
      absent: "Absent",
      late: "Late",
      excused: "Excused"
    }
  },

  // Calls
  calls: {
    title: "Call Logs",
    add: "Log a Call",
    contact: "Contact Person",
    outcome: "Outcome",
    notes: "Notes",
    followUp: "Follow-up Date",
    status: "Status",
    completed: "Completed",
    pending: "Pending",
    search: "Search logs...",
    deleteConfirm: "Are you sure you want to delete this?",
  },

  // Issues
  issues: {
    title: "Issues / Problems",
    add: "Add Issue",
    description: "Description",
    priority: "Priority",
    status: "Status",
    priorities: {
      low: "Low",
      medium: "Medium",
      high: "High / Urgent"
    },
    statuses: {
      open: "Open",
      resolved: "Resolved"
    }
  },

  // Meetings
  meetings: {
    title: "Meetings",
    add: "Schedule Meeting",
    calendarView: "Calendar View",
    listView: "List View",
    date: "Date",
    time: "Time",
    location: "Location",
    duration: "Duration (min)",
    with: "With",
  },

  // Common Actions
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    confirm: "Confirm",
    next: "Next",
    back: "Back",
    download: "Download",
    print: "Print",
  },

  // Forms
  forms: {
    selectStudent: "Select Student",
    enterDetails: "Enter Details",
    required: "Required Field",
    name: "Name",
    contactPerson: "Contact Person",
    relation: "Relation (Father/Mother/Other)",
  },

  // Profile
  profile: {
    tabs: {
      overview: "Overview",
      academic: "Academic",
      communication: "Communication",
      intervention: "Plans & Assessments"
    },
    father: "Father",
    contactInfo: "Contact Information",
    recentIssues: "Recent Issues",
    performance: "Performance",
    gradeHistory: "Grade History",
    newAssessment: "New Assessment"
  },

  // Language switcher
  language: {
    label: "Language",
    english: "English",
    hebrew: "עברית",
    switchToHebrew: "עברית",
    switchToEnglish: "English",
  },

  // Sidebar section headers
  groups: {
    Main: "Main",
    "Students & Classes": "Students & Classes",
    Communication: "Communication",
    "Staff & Access": "Staff & Access",
    Operations: "Operations",
    Finance: "Finance",
    System: "System",
  },

  // Sidebar / navigation item labels (friendly, plain-language)
  menu: {
    overview: "Dashboard",
    todos: "To-Do List",
    students: "Students",
    grades: "Grades",
    classes: "Classes",
    "class-detail": "Class Detail",
    "report-cards": "Report Cards",
    templates: "Assessment Templates",
    issues: "Open Problems",
    calls: "Phone Calls",
    meetings: "Meetings",
    announcements: "Announcements",
    "mass-call": "Mass Phone Call",
    "phone-system": "Phone System",
    "email-templates": "Email Templates",
    staff: "Staff Directory",
    users: "User Management",
    "special-ed": "Special Education",
    "late-tracking": "Late Tracking",
    "bus-changes": "Bus Changes",
    reminders: "Reminders",
    books: "Books",
    fees: "Fees & Trips",
    payments: "Payments",
    "financial-reports": "Financial Reports",
    reports: "Reports",
    settings: "Settings",
    menuSettings: "Menu Settings",
    logout: "Log Out",
  },

  // Shared UI strings
  common: {
    filter: "Filter",
    filters: "Filters",
    clearAll: "Clear All",
    search: "Search...",
    showing: "Showing",
    of: "of",
    results: "results",
    add: "Add",
    addNew: "Add New",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    close: "Close",
    apply: "Apply",
    loading: "Loading...",
    noResults: "No results found",
    activeFilters: "Active filters",
    from: "From",
    to: "To",
    dateRange: "Date Range",
  },

  // Universal filter labels reused across pages
  filterLabels: {
    grade: "Grade",
    class: "Class",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    hasOpenIssues: "Has Open Problems",
    hasPendingCalls: "Has Pending Calls",
    specialEd: "Special Education",
    hasMeetings: "Has Upcoming Meetings",
    parentName: "Parent Name",
    studentName: "Student Name",
    priority: "Priority",
    staffMember: "Staff Member",
    callType: "Call Type",
    serviceType: "Service Type",
    paymentStatus: "Payment Status",
    amountRange: "Amount Range",
    busRoute: "Bus Route",
    dueDate: "Due Date",
    assignedTo: "Assigned To",
  },

  // Footer
  footer: {
    developedBy: "Developed by",
  },

  // Quick actions on the dashboard
  quickActions: {
    title: "Quick Actions",
    addStudent: "Add Student",
    logCall: "Log Phone Call",
    viewIssues: "Open Problems",
    scheduleMeeting: "Schedule Meeting",
    addReminder: "Add Reminder",
    viewStudents: "View Students",
  },

  recentActivity: {
    title: "Recent Activity",
    empty: "No recent activity yet.",
  },

  // Export / print dialog (shared across all pages)
  export: {
    button: "Export",
    title: "Export / Print",
    format: "Format",
    pdf: "PDF / Print",
    excel: "Excel",
    documentTitle: "Document Title",
    fields: "Include Fields",
    selectAll: "Select All",
    clearAll: "Clear All",
    sortBy: "Sort By",
    defaultOrder: "Default order",
    groupBy: "Group By",
    noGrouping: "No grouping",
    willExport: "Will export",
    records: "records",
    cancel: "Cancel",
    exportPdf: "Export PDF",
    exportExcel: "Download Excel",
  },
};