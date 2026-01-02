-- ============================================================================
-- MindPal Therapist Role-Based System - Complete Database Migration
-- ============================================================================
-- Run this entire script in Supabase SQL Editor
-- Copy ALL of it and paste into: https://app.supabase.com → SQL Editor → New Query
-- Then click RUN
-- ============================================================================

-- STEP 1: Add therapist-specific columns to profiles table
-- ============================================================================
-- These columns are needed for role-based user types (user vs therapist)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_label TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;


-- STEP 2: Add constraints for data validation
-- ============================================================================

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS valid_user_type 
  CHECK (user_type IN ('user', 'therapist'));

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS valid_rating 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));


-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);


-- STEP 4: Verify the migration (Check that columns exist)
-- ============================================================================
-- Uncomment this to see all columns in your profiles table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;


-- STEP 5: Add RLS (Row Level Security) Policies
-- ============================================================================
-- These policies ensure users can only access their own data

-- Policy 1: Users can read their own profile
CREATE POLICY IF NOT EXISTS "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY IF NOT EXISTS "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile during signup
CREATE POLICY IF NOT EXISTS "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Service role (backend) can manage all profiles (for admin operations)
CREATE POLICY IF NOT EXISTS "service_role_all_access" ON profiles
  FOR ALL USING (auth.role() = 'service_role');


-- STEP 6: Optional - Test queries to verify setup
-- ============================================================================
-- Uncomment these one at a time to verify your setup

-- See all columns in profiles table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Count all profiles by user type
-- SELECT user_type, COUNT(*) as count
-- FROM profiles
-- GROUP BY user_type;

-- See therapist profiles
-- SELECT id, username, specialization, experience_years, languages, rating, is_online
-- FROM profiles
-- WHERE user_type = 'therapist';

-- See regular user profiles
-- SELECT id, username, user_type, coins
-- FROM profiles
-- WHERE user_type = 'user';


-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- 
-- Next steps:
-- 1. ✅ You've run this SQL
-- 2. → Restart your dev server: npm run dev
-- 3. → Test therapist registration: Create Account → "I'm a Therapist"
-- 4. → Verify in Supabase Table Editor that data is being saved correctly
--
-- If you get errors:
-- - "column already exists" = OK, it means you already have that column
-- - "relation profiles does not exist" = Your profiles table is missing
--   (use the CREATE TABLE script from DATABASE_MIGRATION.md)
-- - "permission denied" = RLS issue (check your RLS policies)
--
-- ============================================================================
