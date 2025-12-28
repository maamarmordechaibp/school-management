# Quick Setup Instructions

## 1. Database Setup (5 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Run these scripts **in order**:

### First: Base Schema
```sql
-- Copy and paste all content from migrations/000_base_schema_simple.sql
```

### Second: Workflow System
```sql
-- Copy and paste all content from migrations/001_workflow_system.sql
```

## 2. Create Admin User

In SQL Editor, run:
```sql
-- Create your admin account
INSERT INTO app_users (email, name, role)
VALUES ('admin@school.com', 'School Admin', 'admin');
```

## 3. Enable Email Auth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Turn OFF "Confirm email" (for easier testing)

## 4. Create User Account

1. Go to Authentication → Users
2. Click "Add User"
3. Use email: `admin@school.com`
4. Set a password
5. Click "Create User"

## 5. Test Login

1. Refresh your app (`npm run dev`)
2. Login with:
   - Email: `admin@school.com`
   - Password: (what you set in step 4)

## Done!

You should now see the dashboard with all features working.

## Troubleshooting

**Can't login?**
- Check Supabase → Authentication → Users
- Make sure user email matches what's in `app_users` table

**Missing features?**
- Verify both SQL scripts ran successfully
- Check Supabase → Table Editor - should see 12+ tables

**Still errors?**
- Check browser console
- Share error messages
