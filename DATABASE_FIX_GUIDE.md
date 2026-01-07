# MindPals Database Fix Instructions

## Issues Fixed:
1. ✅ Journal entries not saving to backend
2. ✅ Premium account status not persisting after refresh
3. ✅ Schema integration mismatches
4. ✅ RLS policy issues

## Quick Fix Steps:

### 1. Apply Database Schema Fixes
Go to your Supabase dashboard → SQL Editor → New Query

Copy and paste the entire contents of `db/fix_schema_integration.sql` and click **RUN**.

### 2. Verify Tables
Check that these tables exist and have proper RLS policies:
- `users` - Basic user data
- `profiles` - Extended user profile data  
- `journal_entries` - Journal entries with mood tracking

### 3. Test the Fixes
1. Start your app: `npm run dev`
2. Create an account or login
3. Write a journal entry - should save to database
4. Activate premium - should persist after refresh
5. Select a pet - should be remembered

## What Was Fixed:

### Journal Saving Issue:
- Fixed RLS policies on `journal_entries` table
- Corrected foreign key references
- Improved error handling in journal submission

### Premium Persistence Issue:
- Fixed data saving to both `users` and `profiles` tables
- Added proper synchronization between tables
- Fixed premium status loading from correct table

### Schema Integration:
- Added missing RLS policies
- Created table synchronization triggers
- Fixed foreign key constraints
- Proper JSON handling for complex data types

## Troubleshooting:

If you still have issues:

1. **Check browser console** for error messages
2. **Verify RLS policies** are applied correctly
3. **Check Supabase logs** in your dashboard
4. **Ensure user authentication** is working

## Database Structure:
```
users (id, email, username, coins, pet_id, streak_count)
  ↕ (synced via triggers)
profiles (id, username, name, user_type, is_premium, coins, selected_pet, pet_mood)
  ↓
journal_entries (id, user_id, entry_text, mood, sentiment_score, created_at)
```

The app now properly saves data to both tables and maintains consistency.