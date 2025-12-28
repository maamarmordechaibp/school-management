# School Management Platform - Database Schema

## Overview

This platform is designed to manage all aspects of a school including:
- Staff management (Teachers, Tutors, Principals)
- Student tracking
- Issue reporting and resolution
- Parent communication
- Meeting scheduling
- Book management and billing
- Trip/Fee collection

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrator | Full access to everything |
| `principal_hebrew` | Hebrew/Curriculum Principal | Full access to Hebrew curriculum |
| `principal_english` | English Principal | Full access to English curriculum |
| `teacher_hebrew` | Hebrew Teacher | Access to their assigned classes |
| `teacher_english` | English Teacher | Access to their assigned classes |
| `tutor` | Tutor | Access only to assigned students (academic info only) |

---

## Database Tables

### 1. **Users & Organization**

#### `app_users`
All staff members in the system.
- Stores: name, email, phone, role
- Links to Supabase auth via `auth_id`

#### `grades`
Grade levels (1st Grade, 2nd Grade, etc.)

#### `classes`
Class sections (1A, 1B, 2A, etc.)
- Linked to a grade
- Has assigned Hebrew teacher and English teacher
- Tracks academic year

---

### 2. **Students**

#### `students`
Complete student information:
- Personal: name, Hebrew name, DOB
- Class assignment
- Parent contacts (father, mother)
- Address
- Status: active, inactive, graduated, transferred
- Notes: general and medical

#### `tutor_assignments`
Links tutors to students:
- Which subject
- Sessions per week
- Session duration
- Start/end dates
- Status

---

### 3. **Issue Tracking**

#### `student_issues`
Log any concerns about students:
- **Categories**: academic, behavioral, attendance, social, health, other
- **Severity**: low, medium, high, critical
- **Status**: open, in_progress, resolved, closed
- Tracks who reported, who's assigned
- Resolution notes

#### `issue_comments`
Discussion thread on issues - allows multiple staff to collaborate.

---

### 4. **Communication**

#### `call_logs`
Track all parent communication:
- Call type: incoming/outgoing
- Who was contacted (father, mother, guardian)
- Subject and summary
- Outcome: reached, voicemail, no_answer, callback_needed
- Follow-up tracking
- Can link to a related issue

#### `meetings`
Schedule and track meetings:
- **Types**: parent_teacher, principal_teacher, tutor_session, staff, other
- Can be linked to a student
- Virtual meeting support (links)
- Status: scheduled, confirmed, completed, cancelled, rescheduled
- Notes and action items after meeting

#### `meeting_participants`
Who's invited to each meeting:
- Internal users or external (parents)
- RSVP status
- Attendance tracking

---

### 5. **Books & Inventory**

#### `books`
Book catalog:
- Title, author, ISBN, publisher
- Category (textbook, workbook)
- Subject (hebrew, english, math, etc.)
- **Price**
- Inventory quantity
- Reorder threshold

#### `grade_book_requirements`
Which books each grade needs:
- Links grades to books
- Required vs optional
- Per academic year

#### `student_books`
Track each student's book situation:
- **Status**: needed, has_own, purchased, received
- `has_own_copy`: Student brings their own (no charge)
- If purchased: date and amount charged
- Per academic year

**Example Flow:**
1. Admin sets up grade requirements (3rd grade needs Books A, B, C)
2. System auto-assigns to students in that grade
3. Parents report which books student already has
4. System calculates remaining cost
5. Reports show how many books need to be ordered

---

### 6. **Fees & Payments**

#### `fee_types`
Categories of fees:
- trip, event, supplies, books, other
- Default amount

#### `fees`
Specific fee instances:
- Name, description, amount
- **Scope**: school_wide, grade_specific, class_specific, student_specific
- Due date
- Academic year

**Examples:**
- "End of Year Trip" - school_wide, $50
- "3rd Grade Siddur Party" - grade_specific (3rd grade), $25
- "Class 2A Pizza Party" - class_specific, $10

#### `student_fees`
Links fees to students:
- Amount (may differ per student)
- Amount paid so far
- **Status**: pending, partial, paid, waived, overdue
- Waiver info if applicable

#### `payments`
Payment records:
- Linked to student and optionally to a specific fee
- Amount
- **Payment method**: cash, check, credit_card, bank_transfer
- Reference number (check #, transaction ID)
- Receipt tracking

---

### 7. **Activity Log**

#### `activity_log`
Audit trail of all actions:
- Who did it
- What action (create, update, delete, view)
- Which entity (student, issue, payment, etc.)
- Details in JSON
- IP address

---

## Key Views (Reports)

### `student_book_summary`
For each student:
- Total books needed
- Books they own
- Books purchased
- Amount owed for books

### `student_fees_summary`
For each student:
- Total fees
- Unpaid fees count
- Total amount
- Total paid
- Outstanding balance

### `books_to_order`
Books that need reordering:
- Current stock
- Students needing
- Quantity to order
- Total cost

### `fee_collection_status`
For each fee:
- Total students
- Paid count
- Partial count
- Pending count
- Total collected vs expected

---

## Access Control (Row Level Security)

### Students
- **Admins/Principals**: See all students
- **Teachers**: See only students in their classes
- **Tutors**: See only their assigned students

### Issues
- **Admins/Principals**: See all issues
- **Teachers**: See issues for their class students
- **Tutors**: See only **academic** issues for their students
- **Everyone**: Can see issues they reported or are assigned to

### Call Logs
- **Admins/Principals**: See all call logs
- **Teachers**: See call logs for their students
- **Everyone**: Can see their own call logs

### Meetings
- **Admins/Principals**: See all meetings
- **Everyone**: See meetings they organize or are invited to

### Financial (Books/Fees/Payments)
- **Admins only** for management
- Teachers can view but not modify

---

## Helper Functions

### `assign_books_to_student(student_id, academic_year)`
Auto-assigns all required books for a student's grade.

### `assign_fee_to_students(fee_id)`
Auto-assigns a fee to all applicable students based on scope.

### `calculate_student_book_cost(student_id, academic_year)`
Returns total cost of books student needs (excluding books they own).

---

## Workflow Examples

### New Student Enrollment
1. Create student record with class assignment
2. Call `assign_books_to_student()` to set up book requirements
3. System auto-calculates book fees
4. Assign any school-wide/grade fees

### Creating a Trip Fee
1. Create fee with scope='grade_specific' or 'school_wide'
2. Call `assign_fee_to_students(fee_id)`
3. All applicable students now have the fee assigned
4. View `fee_collection_status` to track payments

### Teacher Reports an Issue
1. Teacher logs in, sees their class
2. Creates issue for student (category, severity, description)
3. Admin/Principal gets notified
4. Issue can be assigned for follow-up
5. Comments track progress
6. Resolution documented

### Tracking Book Orders
1. View `books_to_order` report
2. See which books are low stock or needed
3. Calculate total order cost
4. After ordering, update `quantity_in_stock`

---

## Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Seed sample data** (grades, classes, some users)
3. **Build React components** for each feature
4. **Test role-based access** with different user types
