import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { User } from '../types';
import { supabase } from '../utils/supabase/client';

interface TherapistRegistrationProps {
  onBack: () => void;
  onRegistrationSuccess: (user: User) => void;
}

/**
 * TherapistRegistration – Role-based signup for therapist accounts.
 *
 * Features:
 * - Therapist-specific fields (specialization, experience, languages, bio, etc.)
 * - Email verification before full account activation
 * - Input validation for professional credentials
 * - Creates profile in Supabase with user_type === 'therapist'
 */
export function TherapistRegistration({ onBack, onRegistrationSuccess }: TherapistRegistrationProps) {
  // Basic Auth Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  // Therapist-Specific Fields
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>(0);
  const [languages, setLanguages] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'form' | 'verification'>('form');

  // Specialization options
  const SPECIALIZATIONS = [
    'Cognitive Behavioral Therapy (CBT)',
    'Psychodynamic Therapy',
    'Humanistic Therapy',
    'Acceptance & Commitment Therapy (ACT)',
    'Dialectical Behavior Therapy (DBT)',
    'Mindfulness-Based Therapy',
    'Trauma-Focused Therapy',
    'Family Therapy',
    'Couples Therapy',
    'Addiction Counseling',
    'Grief Counseling',
    'Anxiety Disorders',
    'Depression Treatment',
    'Other',
  ];

  // Validation
  const validateForm = (): boolean => {
    if (!email || !password || !fullName || !username) {
      setError('All basic fields are required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!specialization) {
      setError('Please select a specialization');
      return false;
    }

    if (!experienceYears || experienceYears < 0 || experienceYears > 60) {
      setError('Please enter valid years of experience (0-60)');
      return false;
    }

    if (!languages.trim()) {
      setError('Please list at least one language');
      return false;
    }

    return true;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Supabase Auth user
      // The trigger will automatically create a profile row with this metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            user_type: 'therapist',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        const msg = (signUpError as any).msg || (signUpError as any).message || JSON.stringify(signUpError);
        setError(msg);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Signup failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Step 2: Update therapist profile with additional fields
      // The Auth trigger already created the base profile, so we just update it
      const languageArray = languages
        .split(',')
        .map((lang) => lang.trim())
        .filter((lang) => lang.length > 0);

      const profileData: any = {
        specialization: specialization,
        experience_years: parseInt(experienceYears.toString()),
        languages: languageArray,
        bio: bio || null,
        is_online: false,
        rating: null,
        response_time_label: 'Not specified',
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If it's a schema error (missing column), provide helpful message
        if (profileError.message?.includes('column') || profileError.message?.includes('schema')) {
          await supabase.auth.signOut();
          setError(
            `Database configuration issue: ${profileError.message}. ` +
            `Please see DATABASE_MIGRATION.md for setup instructions.`
          );
          setIsLoading(false);
          return;
        }

        // If profile creation fails, delete the auth user to keep things consistent
        await supabase.auth.signOut();
        const msg = (profileError as any).msg || (profileError as any).message || JSON.stringify(profileError);
        setError(`Profile setup failed: ${msg}`);
        setIsLoading(false);
        return;
      }

      // Step 3: Show verification message
      setSuccessMessage(
        'Registration successful! Please check your email to verify your account. You may need to confirm your therapist credentials with our admin team.'
      );
      setStep('verification');

      // Optionally auto-sign in (depends on your email verification settings)
      // For now, just show the success message and let user go back
      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 p-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md z-10"
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl text-center">
            <div className="text-5xl mb-6">✉️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">{successMessage}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-900">
                <li>Check your email for a verification link</li>
                <li>Click the link to confirm your email address</li>
                <li>Our team will review your therapist credentials</li>
                <li>You'll be notified once approved (usually within 24-48 hours)</li>
              </ol>
            </div>

            <Button
              onClick={onBack}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium"
            >
              Back to Login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 p-6">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="text-center mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </Button>
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Therapist Registration
          </h1>
          <p className="text-gray-600">Join MindPal as a licensed mental health professional</p>
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <form onSubmit={handleRegistration} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Dr. Jane Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="jane.smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="jane@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your specialization...</option>
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="English, Spanish, French"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    List languages you're fluent in
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio (Optional)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Tell us about your experience and approach to therapy..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be visible on your public profile (max 500 characters)
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Compliance Note */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-900">
                <strong>📋 Verification Required:</strong> Your professional credentials will be verified by our admin team. 
                You'll receive an email notification once your account is approved.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-xl font-medium text-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Register as Therapist'
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          By registering, you agree to our Terms of Service and professional conduct guidelines
        </p>
      </motion.div>
    </div>
  );
}
