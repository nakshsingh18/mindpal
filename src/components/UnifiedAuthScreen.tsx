import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { supabase } from '../utils/supabase/client';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';

type AuthMode = "welcome" | "user-login" | "user-signup" | "therapist-login" | "therapist-signup";

export function UnifiedAuthScreen() {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User & Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  // Therapist-specific fields
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [languages, setLanguages] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [price, setPrice] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setUsername("");
    setSpecialization("");
    setExperience("");
    setDescription("");
    setLanguages("");
    setResponseTime("");
    setPrice("");
    setError("");
    setSuccess("");
  };

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: username,
            role: 'user',
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message || "Signup failed");
      }

      if (data.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username: username || 'User',
            coins: 100,
          });

        if (profileError) {
          console.error('Users table creation error:', profileError);
        }

        // Create user profile in profiles table
        const { error: profilesError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username || 'User',
            name: name || 'User',
            user_type: 'user',
            coins: 100,
            is_online: false,
            is_premium: false,
          });

        if (profilesError) {
          console.error('Profiles table creation error:', profilesError);
        }

        setSuccess("Signup successful! Please check your email to confirm your account.");
        resetForm();
        setTimeout(() => setMode("welcome"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Login failed");
      }

      setSuccess("Login successful! Redirecting...");
      resetForm();
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTherapistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      // Step 1: Create auth account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'therapist',
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message || "Signup failed");
      }

      if (data.user) {
        // Step 2: Create therapist profile
        const languageArray = languages.split(',').map((lang: string) => lang.trim()).filter((lang: string) => lang);

        // Try to insert therapist row and return the created record so we can
        // verify which columns were actually persisted (helps debug RLS/trigger issues).
        const { data: therapistInserted, error: therapistError } = await supabase
          .from('therapists')
          .insert({
            id: data.user.id,
            name: name,
            specialization: specialization || null,
            experience: experience || null,
            description: description || null,
            languages: languageArray.length > 0 ? languageArray : null,
            response_time: responseTime || null,
            price: price ? parseFloat(price) : null,
            rating: 5,
          })
          .select()
          .single();

        if (therapistError) {
          console.error('Therapist profile error (insert):', therapistError);
          // Do not throw immediately — profiles/trigger might create a therapist row server-side.
        } else {
          console.debug('Therapist insert returned:', therapistInserted);
        }

        // Step 3: Create user profile for therapist
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username: name || 'Therapist',
            coins: 0,
          });

        if (userError) {
          console.error('User profile error:', userError);
        }

        // Step 4: Create therapist profile in profiles table
        const experienceYears = experience ? parseInt(experience) : 0;
        const { data: profileInserted, error: profilesError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: name || 'Therapist',
            name: name,
            user_type: 'therapist',
            specialization: specialization || null,
            experience_years: experienceYears,
            languages: languageArray.length > 0 ? languageArray : [],
            bio: description || null,
            rating: 5,
            is_online: false,
            is_premium: false,
          })
          .select()
          .single();

        if (profilesError) {
          console.error('Profiles table creation error (insert):', profilesError);
        } else {
          console.debug('Profiles insert returned:', profileInserted);
        }

        setSuccess("Therapist registration successful! Please check your email to confirm your account.");
        resetForm();
        setTimeout(() => setMode("welcome"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTherapistLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Login failed");
      }

      // Ensure session is initialized and then navigate to root so App picks up auth state
      setSuccess("Login successful! Redirecting to therapist dashboard...");
      resetForm();
      try {
        // small delay to allow backend to finalize session
        await new Promise((res) => setTimeout(res, 400));
        // Try to refresh user session and then navigate to app root
        const { data } = await supabase.auth.getSession();
        // Force app to re-evaluate auth state
        window.location.href = '/';
      } catch (e) {
        // fallback to reload
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setSuccess("Guest mode activated!");
    } catch (err: any) {
      setError(err.message || "Failed to enter guest mode");
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome Screen
  if (mode === "welcome") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden"
      >
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {["🌸", "✨", "🌈", "💫", "🦋", "🌟", "💜"][Math.floor(Math.random() * 7)]}
            </motion.div>
          ))}
        </div>

        <div className="max-w-2xl w-full relative z-10">
          {/* Logo & Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🧠💜
            </motion.div>
            <motion.h1 
              className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
              whileHover={{ scale: 1.05 }}
            >
              MindPal
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-700 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your Mental Wellness Companion
            </motion.p>
          </motion.div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-violet-300 bg-white/70 backdrop-blur-md group relative overflow-hidden"
                onClick={() => { setMode("user-login"); resetForm(); }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-blue-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">For Users</h3>
                    <p className="text-gray-600">Track your wellness journey</p>
                  </div>
                  <motion.div 
                    className="text-5xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    👤
                  </motion.div>
                </div>
                <Button className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                  Enter as User
                </Button>
              </Card>
            </motion.div>

            {/* Therapist Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-300 bg-white/70 backdrop-blur-md group relative overflow-hidden"
                onClick={() => { setMode("therapist-login"); resetForm(); }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">For Therapists</h3>
                    <p className="text-gray-600">Connect with clients</p>
                  </div>
                  <motion.div 
                    className="text-5xl"
                    whileHover={{ scale: 1.2, rotate: -10 }}
                  >
                    👨‍⚕️
                  </motion.div>
                </div>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                  Enter as Therapist
                </Button>
              </Card>
            </motion.div>
          </div>

          {/* Guest Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleGuestMode}
              disabled={isLoading}
              className="w-full bg-white/80 hover:bg-white/90 text-gray-800 font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-gray-200"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block mr-2"
                >
                  ⏳
                </motion.div>
              ) : null}
              {isLoading ? "Loading..." : "Continue as Guest 👻"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Render appropriate auth form based on mode
  return (
    <AuthForm
      mode={mode}
      setMode={setMode}
      isLoading={isLoading}
      error={error}
      success={success}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      name={name}
      setName={setName}
      username={username}
      setUsername={setUsername}
      specialization={specialization}
      setSpecialization={setSpecialization}
      experience={experience}
      setExperience={setExperience}
      description={description}
      setDescription={setDescription}
      languages={languages}
      setLanguages={setLanguages}
      responseTime={responseTime}
      setResponseTime={setResponseTime}
      price={price}
      setPrice={setPrice}
      onUserSignup={handleUserSignup}
      onUserLogin={handleUserLogin}
      onTherapistSignup={handleTherapistSignup}
      onTherapistLogin={handleTherapistLogin}
    />
  );
}

interface AuthFormProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  isLoading: boolean;
  error: string;
  success: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  specialization: string;
  setSpecialization: (spec: string) => void;
  experience: string;
  setExperience: (exp: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  languages: string;
  setLanguages: (langs: string) => void;
  responseTime: string;
  setResponseTime: (time: string) => void;
  price: string;
  setPrice: (price: string) => void;
  onUserSignup: (e: React.FormEvent) => void;
  onUserLogin: (e: React.FormEvent) => void;
  onTherapistSignup: (e: React.FormEvent) => void;
  onTherapistLogin: (e: React.FormEvent) => void;
}

function AuthForm({
  mode,
  setMode,
  isLoading,
  error,
  success,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  name,
  setName,
  username,
  setUsername,
  specialization,
  setSpecialization,
  experience,
  setExperience,
  description,
  setDescription,
  languages,
  setLanguages,
  responseTime,
  setResponseTime,
  price,
  setPrice,
  onUserSignup,
  onUserLogin,
  onTherapistSignup,
  onTherapistLogin,
}: AuthFormProps) {
  const isUserMode = mode.includes("user");
  const isSignupMode = mode.includes("signup");
  const isTherapistMode = mode.includes("therapist");

  const gradientClass = isTherapistMode
    ? "from-emerald-500 to-teal-500"
    : "from-violet-500 to-blue-500";

  const onSubmit = isUserMode
    ? isSignupMode ? onUserSignup : onUserLogin
    : isSignupMode ? onTherapistSignup : onTherapistLogin;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-4">{isTherapistMode ? "👨‍⚕️" : "👤"}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isTherapistMode ? "Therapist" : "User"} {isSignupMode ? "Registration" : "Login"}
            </h2>
            <p className="text-sm text-gray-600">
              {isSignupMode
                ? isTherapistMode
                  ? "Join our network of mental health professionals"
                  : "Start your wellness journey with MindPal"
                : isTherapistMode
                ? "Access your therapist dashboard"
                : "Welcome back to MindPal"}
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Alert */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
              >
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-green-800">Success</p>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Name (Signup) */}
            {isSignupMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder={isTherapistMode ? "Dr. John Smith" : "John Doe"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Username (User Signup Only) */}
            {isSignupMode && !isTherapistMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="@username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Therapist-specific fields */}
            {isSignupMode && isTherapistMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Anxiety, Depression, CBT"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="h-11"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 5 years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="h-11"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About You *
                  </label>
                  <textarea
                    placeholder="Brief description of your practice and approach..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., English, Spanish"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Time
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Within 24h"
                      value={responseTime}
                      onChange={(e) => setResponseTime(e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Session ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup) */}
            {isSignupMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${gradientClass} hover:shadow-xl text-white font-semibold py-4 rounded-xl transition-all h-12 text-lg relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block relative z-10"
                  >
                    ⏳
                  </motion.div>
                ) : isSignupMode ? (
                  <span className="relative z-10">Create {isTherapistMode ? "Therapist" : "User"} Account</span>
                ) : (
                  <span className="relative z-10">{isTherapistMode ? "Therapist" : "User"} Login</span>
                )}
              </Button>
            </motion.div>

            {/* Toggle between login/signup */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-3">
                {isSignupMode ? "Already have an account? " : "Don't have an account? "}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setMode(
                      isUserMode
                        ? isSignupMode
                          ? "user-login"
                          : "user-signup"
                        : isSignupMode
                        ? "therapist-login"
                        : "therapist-signup"
                    )
                  }
                  className="text-violet-600 hover:text-violet-700 font-semibold underline decoration-2 underline-offset-2"
                >
                  {isSignupMode ? "Login" : "Sign Up"}
                </motion.button>
              </p>
            </div>

            {/* Back to welcome */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                onClick={() => setMode("welcome")}
                variant="outline"
                className="w-full py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Back to Welcome
              </Button>
            </motion.div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}
