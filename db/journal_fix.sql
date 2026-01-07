-- Fix for Journal Entries - Run this in Supabase SQL Editor

-- 1. First, let's test if your user exists in the users table
SELECT id, email, username FROM public.users WHERE id = 'c90d9d9f-2546-4ab5-ae05-40dc9e421af0';

-- 2. If user doesn't exist, create it
INSERT INTO public.users (id, email, username, coins, streak_count)
VALUES ('c90d9d9f-2546-4ab5-ae05-40dc9e421af0', 'nakshsingh18@gmail.com', 'naxnax', 100, 0)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username;

-- 3. Disable RLS on journal_entries temporarily
ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "journal_read_own" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_insert_own" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_update_own" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_delete_own" ON public.journal_entries;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.journal_entries;

-- 5. Re-enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 6. Create simple, working policies
CREATE POLICY "Allow authenticated users full access" ON public.journal_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Grant permissions
GRANT ALL ON public.journal_entries TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Test insert with your actual user ID
INSERT INTO public.journal_entries (user_id, entry_text, mood, sentiment_score)
VALUES ('c90d9d9f-2546-4ab5-ae05-40dc9e421af0', 'Test entry from SQL', 'happy', 0.8);

-- 9. Verify the insert worked
SELECT * FROM public.journal_entries WHERE user_id = 'c90d9d9f-2546-4ab5-ae05-40dc9e421af0' ORDER BY created_at DESC LIMIT 5;