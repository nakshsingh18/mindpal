-- Emergency Fix - Disable RLS completely
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on all tables
ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all policies
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.journal_entries;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_read_own" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_insert_own" ON public.journal_entries;

-- 3. Grant full permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Test direct insert
INSERT INTO public.journal_entries (user_id, entry_text, mood, sentiment_score)
VALUES ('c90d9d9f-2546-4ab5-ae05-40dc9e421af0', 'Emergency test entry', 'happy', 0.9);

-- 5. Check if it worked
SELECT * FROM public.journal_entries WHERE user_id = 'c90d9d9f-2546-4ab5-ae05-40dc9e421af0';