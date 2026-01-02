#!/bin/bash
# Quick setup script to migrate Supabase database schema

echo "🗄️  MindPal Database Migration Helper"
echo "======================================"
echo ""
echo "This script helps you set up the therapist role-based system."
echo ""
echo "Steps to complete:"
echo ""
echo "1️⃣  Go to: https://app.supabase.com"
echo "2️⃣  Select your project"
echo "3️⃣  Go to: SQL Editor (left sidebar)"
echo "4️⃣  Click: New query"
echo "5️⃣  Copy and paste the SQL below:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF'
-- Add therapist-specific columns to profiles table
-- Run this migration to support role-based user types

-- Add user_type column (distinguish between 'user' and 'therapist')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- Add therapist-specific columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_label TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT valid_user_type 
  CHECK (user_type IN ('user', 'therapist'));

ALTER TABLE profiles ADD CONSTRAINT valid_rating 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Optional: Update RLS policies for better security
-- Uncomment if you want stricter access control:
/*
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
*/
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "6️⃣  Click: RUN"
echo "7️⃣  Wait for success message"
echo "8️⃣  Go back to your app and restart the dev server:"
echo ""
echo "   npm run dev"
echo ""
echo "9️⃣  Test therapist registration and login!"
echo ""
echo "✅ Migration complete! Your database now supports role-based accounts."
echo ""
echo "For detailed documentation, see: DATABASE_MIGRATION.md"
