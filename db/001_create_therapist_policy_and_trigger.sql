-- 001_create_therapist_policy_and_trigger.sql
-- Run this in Supabase SQL editor (or psql as a privileged user).
-- 1) Create RLS policy that allows authenticated users to insert a therapist row only for their own id.
-- 2) Create a trigger that ensures whenever a profile is inserted with user_type='therapist', a row in therapists is created (if not exists).

-- Enable row level security on therapists if not already enabled
ALTER TABLE IF EXISTS public.therapists ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to INSERT a row for themselves
DROP POLICY IF EXISTS allow_therapist_self_insert ON public.therapists;
CREATE POLICY allow_therapist_self_insert ON public.therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Optionally, allow SELECT for all (or keep existing policies)
-- Example: allow all authenticated users to select therapists
DROP POLICY IF EXISTS allow_select_therapists ON public.therapists;
CREATE POLICY allow_select_therapists ON public.therapists
  FOR SELECT
  TO public
  USING (true);

-- Trigger function: create a therapists row when a profile with user_type = 'therapist' is inserted
CREATE OR REPLACE FUNCTION public.create_therapist_from_profile()
RETURNS trigger AS $$
BEGIN
  -- Only act when profile is a therapist
  IF NEW.user_type IS NOT NULL AND LOWER(NEW.user_type) = 'therapist' THEN
    -- Try to insert a therapist row with matching id; ignore if already exists
    INSERT INTO public.therapists (
      id,
      name,
      specialization,
      experience,
      description,
      languages,
      response_time,
      price,
      rating,
      created_at
    )
    VALUES (
      NEW.id,
      NEW.name,
      COALESCE(NEW.specialization, NULL),
      COALESCE(NEW.experience_years, NULL),
      COALESCE(NEW.bio, NULL),
      -- If profiles.languages is jsonb array, try to cast; otherwise insert as NULL
      
      CASE
        WHEN pg_typeof(NEW.languages)::text = 'jsonb' THEN (
          SELECT array_agg(value) FROM (
            SELECT jsonb_array_elements_text(NEW.languages) as value
          ) sub
        )
        ELSE NEW.languages
      END,
      COALESCE(NEW.response_time_label, NULL),
      NULL, -- price not present in profiles by default
      COALESCE(NEW.rating, 5),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles after insert
DROP TRIGGER IF EXISTS trg_create_therapist_from_profile ON public.profiles;
CREATE TRIGGER trg_create_therapist_from_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_therapist_from_profile();

-- Notes:
-- 1) You may need to adapt column names if your schema differs.
-- 2) SECURITY DEFINER ensures the trigger runs with the function owner's privileges; verify the owner is a privileged role.
-- 3) Test by inserting a profiles row with user_type='therapist' and verifying a corresponding therapists row is created.
