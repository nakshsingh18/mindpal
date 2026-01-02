import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { User } from '../types';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface TherapistLoginPageProps {
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
}

/**
 * TherapistLoginPage – email/password login for real therapist accounts.
 *
 * Goal:
 * - Replace hardcoded therapist credentials with Supabase authentication.
 * - Only users whose profile has user_type === 'therapist' should be able to log in here.
 * - After successful login, call onLoginSuccess(user) with the full therapist user object.
 *
 * Requirements implemented:
 * - Use Supabase's email/password sign-in
 * - After successful auth, fetch profile from the "profiles" table
 * - Verify user_type === 'therapist'
 * - Build a User object compatible with the rest of the app
 * - Keep the same UI layout and styling
 * - No password stored longer than necessary
 */
export function TherapistLoginPage({ onBack, onLoginSuccess }: TherapistLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Step 1: Sign in with Supabase email/password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed. No user returned.');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch the profile from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        // Profile doesn't exist or fetch failed
        await supabase.auth.signOut();
        setError('Unable to fetch your profile. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Step 3: Verify user_type === 'therapist'
      if (!profile || profile.user_type !== 'therapist') {
        // Sign out if not a therapist
        await supabase.auth.signOut();
        setError('This login is only for verified therapists. Please contact support if you believe this is an error.');
        setIsLoading(false);
        return;
      }

      // Step 4: Build the User object compatible with the app
      const therapistUser: User = {
        id: profile.id,
        email: authData.user.email || profile.email || '',
        name: profile.full_name || profile.name || 'Therapist',
        username: profile.username || email.split('@')[0],
        user_type: 'therapist',
        is_Premium: true, // Therapists have premium access
        createdAt: new Date(authData.user.created_at || new Date()),
        selected_pet: null,
        coins: profile.coins || 0,
        journal_entries: [],
        pet_mood: 'calm',
        // Therapist-specific fields
        specialization: profile.specialization || null,
        experience_years: profile.experience_years || null,
        rating: profile.rating || null,
        response_time_label: profile.response_time_label || null,
        languages: profile.languages || null,
        bio: profile.bio || null,
        is_online: profile.is_online || false,
      };

      // Step 5: Call success callback
      onLoginSuccess(therapistUser);
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 p-6">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </Button>
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Therapist Login
          </h1>
          <p className="text-gray-600">
            Secure access for licensed professionals
          </p>
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-1000 text-white rounded-xl font-medium text-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging In...</span>
                </div>
              ) : (
                'Login as Therapist'
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}