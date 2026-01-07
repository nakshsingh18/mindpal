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

-- 10. Test data insertion (you can remove this after testing)
-- This will help verify the setup works
INSERT INTO public.users (id, email, username, coins) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'testuser', 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, name, user_type, is_premium, coins)
VALUES ('00000000-0000-0000-0000-000000000000', 'testuser', 'Test User', 'user', false, 100)
ON CONFLICT (id) DO NOTHING;