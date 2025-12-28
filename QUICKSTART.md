# Quick Start Guide - Workflow System

## 🚀 Getting Started in 5 Steps

### Step 1: Set Up Database (5 minutes)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `migrations/001_workflow_system.sql`
4. Paste and click **Run**
5. Verify tables created: `student_plans`, `progress_reviews`, `workflow_tasks`, `contacts`

### Step 2: Test the System (2 minutes)
1. Start your application: `npm run dev`
2. Log in as admin/principal
3. You should see two new menu items:
   - **Intake Workflow**
   - **Student Monitoring**

### Step 3: Create Your First Workflow Case (3 minutes)

#### As Secretary:
1. Click **Intake Workflow** in sidebar
2. Click **New Intake** button
3. Fill in student details:
   - Name: "Test Student"
   - Class: "Grade 3"
   - Father/Mother contact info
4. Click **Save**
5. Click **Log Call** to document initial contact
6. Click **Start Info Gathering** to move to next stage

#### As M.Z.:
1. In **Intake Workflow**, go to "Info Gathering" tab
2. Click **Begin Assessment** on the test student
3. Complete the assessment form
4. Student moves to "Plan Creation"
5. Click **Create Plan**
6. Fill in:
   - Goals: "Improve reading comprehension"
   - Kriah notes: "Reading at 2nd grade level"
   - Add intervention: Type=Tutor, Frequency="2x weekly"
7. Click **Save Plan**
8. Submit for review

### Step 4: Start Monitoring (2 minutes)
1. Approve the plan (change status to "active")
2. Move student to "Active Monitoring" stage
3. Click **Student Monitoring** in sidebar
4. You'll see the student in "Needs Review"
5. Click **Submit Review**
6. Fill in progress rating and notes
7. Submit

### Step 5: Explore Features
- View student profile → **Workflow & Plans** tab
- Check review schedule in Monitoring dashboard
- Try escalating a student to M.Z.
- Create multiple plans for different students

## 📋 Daily Workflow

### For Secretary (Morning Routine)
1. Open **Student Monitoring**
2. Check "Overdue" tab - submit any overdue reviews
3. Check "Needs Review" tab - plan your reviews for the day
4. Open **Intake Workflow**
5. Process any new intake requests
6. Log parent calls
7. Move students through stages

### For M.Z. (Weekly Routine)
1. Open **Student Monitoring** → "Concerns" tab
2. Review any escalated cases
3. Open **Intake Workflow**
4. Process students in "Assessment" stage
5. Create/review plans for students in "Plan Creation"
6. Approve plans in "Plan Review"

## 🎯 Key Actions by View

### Intake Workflow View
- ➕ Create new student records
- 📞 Log parent calls
- 📝 Conduct assessments
- 📋 Create intervention plans
- ✅ Move students between stages
- 👁️ View progress through intake process

### Student Monitoring View
- 📊 See statistics (total active, due, overdue)
- ✍️ Submit progress reviews
- 🚨 Flag students for attention
- 📈 Track progress trends
- 🔍 Filter by status (all/due/overdue/concerns)

### Student Profile View
- 👤 View complete student information
- 📂 See all plans and reviews
- 📅 Track workflow history
- ✏️ Create new plans/assessments
- 📞 Access communication history

## 🎨 Workflow Stage Colors

| Badge Color | Stage | Meaning |
|------------|-------|---------|
| 🔵 Blue | Initial Contact | Just started |
| 🟣 Purple | Info Gathering | Collecting data |
| 🟡 Yellow | Assessment | Being evaluated |
| 🟠 Orange | Plan Creation | Building intervention |
| 🔷 Cyan | Plan Review | Awaiting approval |
| 🟦 Indigo | Service Setup | Assigning resources |
| 🟢 Green | Active Monitoring | Ongoing services |
| 🔴 Red | Plan Adjustment | Needs changes |
| ⚫ Gray | Completed | Finished |

## 💡 Tips & Tricks

### Efficient Review Submission
- Set a reminder to check "Needs Review" daily
- Batch similar reviews together
- Use templates for common notes

### Quick Student Search
- Use the search bar in each view
- Search by student name or parent name
- Filter by stage to focus your work

### Escalation Best Practices
- Only escalate when progress < 75%
- Include specific concerns in notes
- Follow up within 48 hours

### Plan Creation Tips
- Be specific with goals (SMART: Specific, Measurable, Achievable, Relevant, Time-bound)
- Assign realistic frequencies
- Include measurable outcomes

## 🔧 Troubleshooting

### "No students showing in Intake Workflow"
- Check that students have `workflow_stage` set
- Run: `UPDATE students SET workflow_stage = 'initial_contact' WHERE workflow_stage IS NULL;`

### "Can't create plans"
- Verify `student_plans` table exists
- Check RLS policies allow your role to insert

### "Reviews not showing as due"
- Ensure plan has `status = 'active'`
- Check `review_frequency` is set
- Verify student is in `active_monitoring` stage

### "Permission denied" errors
- Check your user role in database
- Verify RLS policies are set up correctly
- Ensure you're logged in

## 📞 Support Workflow

If you encounter issues:

1. **Check the database** - Run in SQL Editor:
   ```sql
   SELECT COUNT(*) FROM student_plans;
   SELECT COUNT(*) FROM progress_reviews;
   ```

2. **Verify your role**:
   ```sql
   SELECT role FROM app_users WHERE id = auth.uid();
   ```

3. **Check student workflow stages**:
   ```sql
   SELECT workflow_stage, COUNT(*) 
   FROM students 
   GROUP BY workflow_stage;
   ```

## 🎓 Training Resources

- **Full Documentation**: See `WORKFLOW_IMPLEMENTATION_GUIDE.md`
- **Database Schema**: See `DATABASE_SCHEMA.md`
- **Migration Script**: See `migrations/001_workflow_system.sql`

## ✅ Checklist for Go-Live

- [ ] Database migration run successfully
- [ ] Test student created and moved through workflow
- [ ] Test plan created and approved
- [ ] Test progress review submitted
- [ ] All users can access appropriate views
- [ ] RLS policies working correctly
- [ ] Sample data removed
- [ ] Users trained on workflow

## 🚀 You're Ready!

The system is designed to guide you through the process. Start with a few test cases, then gradually onboard real students. The workflow will help you maintain consistency and track progress effectively.

**Need help?** Review the detailed guides or check the inline code comments.
