-- Fix for Therapist Chat - Run this in Supabase SQL Editor

-- 1. Disable RLS on chat tables temporarily
ALTER TABLE public.therapist_chat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "chat_access" ON public.therapist_chat;
DROP POLICY IF EXISTS "requests_access" ON public.therapist_requests;
DROP POLICY IF EXISTS "therapists_access" ON public.therapists;

-- 3. Re-enable RLS
ALTER TABLE public.therapist_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working policies
CREATE POLICY "Enable all operations for authenticated users" ON public.therapist_chat
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.therapist_requests
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.therapists
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Grant permissions
GRANT ALL ON public.therapist_chat TO authenticated;
GRANT ALL ON public.therapist_requests TO authenticated;
GRANT ALL ON public.therapists TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Test chat insert
-- INSERT INTO public.therapist_chat (chat_id, sender_id, receiver_id, message)
-- VALUES ('test-chat-123', 'c90d9d9f-2546-4ab5-ae05-40dc9e421af0', 'c90d9d9f-2546-4ab5-ae05-40dc9e421af0', 'Test message');

-- 7. Check if it worked
-- SELECT * FROM public.therapist_chat WHERE chat_id = 'test-chat-123';