-- Fix Schema Integration Issues
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for users table
DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create RLS policies for profiles table
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Create RLS policies for journal_entries
DROP POLICY IF EXISTS "journal_read_own" ON public.journal_entries;
CREATE POLICY "journal_read_own" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_insert_own" ON public.journal_entries;
CREATE POLICY "journal_insert_own" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Fix foreign key references in therapist_requests
ALTER TABLE public.therapist_requests 
DROP CONSTRAINT IF EXISTS therapist_requests_user_id_fkey;

ALTER TABLE public.therapist_requests 
ADD CONSTRAINT therapist_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 6. Create trigger to sync users and profiles tables
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- When user is created, create profile
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (
      id, username, name, user_type, is_premium, coins
    ) VALUES (
      NEW.id, 
      NEW.username, 
      NEW.username, 
      'user', 
      false, 
      NEW.coins
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END IF;
  
  -- When user is updated, sync to profile
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles SET
      username = NEW.username,
      coins = NEW.coins
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_profile_trigger ON public.users;
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- 7. Create reverse sync from profiles to users
CREATE OR REPLACE FUNCTION sync_profile_user()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.users SET
      coins = NEW.coins
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_user_trigger ON public.profiles;
CREATE TRIGGER sync_profile_user_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_user();