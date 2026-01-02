import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Profile as User } from "../types";
import { supabase } from '../utils/supabase/client';
import { TherapistLoginPage } from "./TherapistLoginPage";

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

type AuthMode = "login" | "signup" | "welcome";

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isTherapistLogin, setIsTherapistLogin] = useState(false);
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // prevent double submissions
    setIsLoading(true);
    setError("");

    try {
      if (mode === "signup") {
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
            },
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          const msg = (signUpError as any).msg || (signUpError as any).message || JSON.stringify(signUpError);
          setError(msg);
          setIsLoading(false);
          return;
        }

      } else if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.error('Sign-in error:', signInError);
          const msg = (signInError as any).msg || (signInError as any).message || JSON.stringify(signInError);
          setError(msg);
          setIsLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Auth handler caught error:', err);
      const message = err?.msg || err?.error_description || err?.message || JSON.stringify(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      console.error('Google login error:', error);
      const msg = (error as any).msg || (error as any).message || JSON.stringify(error);
      setError(msg);
    }
    setIsLoading(false);
  };

  const handleGuestMode = async () => {
     if (isLoading) return;
     setIsLoading(true);
     setError("");
     const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Guest login error:', error);
      const msg = (error as any).msg || (error as any).message || JSON.stringify(error);
      setError(msg);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };
  
  if (isTherapistLogin) {
    return (
      <TherapistLoginPage 
        onBack={() => setIsTherapistLogin(false)}
        onLoginSuccess={onAuthSuccess}
      />
    )
  }

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {["🌸", "✨", "🌈", "💫", "🦋", "🌟"][Math.floor(Math.random() * 6)]}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center z-10 max-w-md w-full"
        >
          <div className="mb-8">
            <div className="text-8xl mb-4">🐾</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome to MindPal
            </h1>
            <p className="text-lg text-gray-700">
              Your AI-powered mental wellness companion with virtual pet therapy
            </p>
          </div>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
            <div className="space-y-4">
              <Button
                onClick={() => setMode("signup")}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium text-lg"
              >
                Create Account
              </Button>
              
              <Button
                onClick={() => setMode("login")}
                variant="outline"
                className="w-full h-12 rounded-xl font-medium text-lg"
              >
                Sign In
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

               <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 rounded-xl font-medium text-lg"
              >
                Sign In with Google
              </Button>

              <Button
                onClick={handleGuestMode}
                variant="ghost"
                className="w-full h-12 rounded-xl font-medium text-lg text-gray-600 hover:bg-gray-50"
              >
                Continue as Guest
              </Button>

              <Button
                onClick={() => setIsTherapistLogin(true)}
                variant="ghost"
                className="w-full h-12 rounded-xl font-medium text-lg text-gray-600 hover:bg-gray-50"
              >
                Therapist Login
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {["🌸", "💫", "🦋"][Math.floor(Math.random() * 3)]}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <Button
            onClick={() => setMode("welcome")}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </Button>
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {mode === "login" ? "Welcome Back" : "Join MindPal"}
          </h1>
          <p className="text-gray-600">
            {mode === "login" 
              ? "Sign in to continue your wellness journey" 
              : "Start your mental wellness journey today"
            }
          </p>
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
              </>
            )}

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

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium text-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                </div>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {mode === "login" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>

            {mode === "login" && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Forgot password?
                </Button>
              </div>
            )}
          </form>
        </Card>

        <div className="text-center mt-6">
          <Button
            onClick={handleGuestMode}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Continue as Guest instead
          </Button>
        </div>
      </motion.div>
    </div>
  );
}