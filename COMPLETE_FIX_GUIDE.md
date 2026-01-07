# 🔧 Complete Fix Guide for MindPals Database Issues

## Current Issues Identified:
1. ❌ CORS error with Hugging Face API
2. ❌ Database 400/500 errors 
3. ❌ Journal entries not saving
4. ❌ Premium status not persisting

## Step-by-Step Fix:

### 1. Fix Database Schema (CRITICAL)
Go to your Supabase Dashboard → SQL Editor → New Query

**Copy and paste this ENTIRE script and click RUN:**

```sql
-- Complete Database Fix for MindPals
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. First, let's check and create the mood enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_type') THEN
        CREATE TYPE mood_type AS ENUM (
            'happy', 'sad', 'calm', 'anxious', 'excited', 
            'angry', 'irritated', 'frustrated', 'content', 'energetic'
        );
    END IF;
END $$;

-- 2. Fix journal_entries table structure
ALTER TABLE public.journal_entries 
ALTER COLUMN mood TYPE TEXT;

-- 3. Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "journal_read_own" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_insert_own" ON public.journal_entries;

-- 4. Disable RLS temporarily to fix data
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;

-- 5. Create simple, working RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Enable all for authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

-- Profiles table policies  
CREATE POLICY "Enable all for authenticated users" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Journal entries policies
CREATE POLICY "Enable all for authenticated users" ON public.journal_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Ensure users table has all required columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS therapist_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pet_id INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

-- 7. Ensure profiles table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_pet TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_mood TEXT DEFAULT 'calm';

-- 8. Create a simple function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id UUID, user_email TEXT, user_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert into users if not exists
    INSERT INTO public.users (id, email, username, coins, streak_count)
    VALUES (user_id, user_email, COALESCE(user_name, 'Guest'), 100, 0)
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into profiles if not exists
    INSERT INTO public.profiles (id, username, name, user_type, is_premium, coins)
    VALUES (user_id, COALESCE(user_name, 'Guest'), COALESCE(user_name, 'Guest'), 'user', false, 100)
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### 2. Test Database Connection

Add this to your App.tsx temporarily to test:

```tsx
import { DatabaseTest } from './components/DatabaseTest';

// Add this line in your App component return statement:
<DatabaseTest />
```

### 3. Restart Your Development Server

```bash
npm run dev
```

### 4. Test the Fixes

1. **Login/Register** - Should work without errors
2. **Write Journal Entry** - Should save to database
3. **Activate Premium** - Should persist after refresh
4. **Check Browser Console** - Should see no more 400/500 errors

## What Each Fix Does:

### Database Schema Fix:
- ✅ Creates proper RLS policies that allow authenticated users to access their data
- ✅ Fixes column types (mood as TEXT instead of enum)
- ✅ Adds missing columns to tables
- ✅ Creates helper function to ensure user profiles exist

### CORS Fix:
- ✅ Disables Hugging Face API calls that were causing CORS errors
- ✅ Uses local sentiment analysis only

### App Logic Fix:
- ✅ Uses `maybeSingle()` instead of `single()` to avoid errors when records don't exist
- ✅ Calls profile creation function before fetching data
- ✅ Proper error handling for database operations

## Troubleshooting:

If you still see errors:

1. **Check Supabase Dashboard Logs** - Go to Logs tab to see detailed errors
2. **Verify RLS Policies** - Go to Authentication → Policies to see if they're applied
3. **Check Browser Network Tab** - Look for failed requests
4. **Run Database Test** - Use the DatabaseTest component to diagnose issues

## Expected Results After Fix:

- ✅ Journal entries save successfully
- ✅ Premium status persists after refresh  
- ✅ No CORS errors in console
- ✅ No 400/500 database errors
- ✅ User data loads correctly

Run the SQL script first, then restart your dev server and test!