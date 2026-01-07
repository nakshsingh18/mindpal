#!/bin/bash

# MindPals Database Setup Script
# This script applies all necessary database fixes

echo "🔧 Setting up MindPals database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Apply the schema fixes
echo "📊 Applying schema integration fixes..."
supabase db reset --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.wwodgnqzvvuzsdcjxrqi.supabase.co:5432/postgres"

echo "🔐 Setting up RLS policies..."
psql "postgresql://postgres:[YOUR_PASSWORD]@db.wwodgnqzvvuzsdcjxrqi.supabase.co:5432/postgres" -f db/fix_schema_integration.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Replace [YOUR_PASSWORD] with your actual Supabase password"
echo "2. Run: npm run dev"
echo "3. Test journal saving and premium features"
echo ""
echo "🚀 Your MindPals app should now work correctly!"