import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Error logging in:', error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      console.error('Error with Google login:', error.message);
    }
  };
  
  const handleGuestLogin = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Error with guest login:', error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
          <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md">
            Login
          </button>
        </form>
        <button onClick={handleGoogleLogin} className="w-full px-4 py-2 mt-4 font-bold text-white bg-red-500 rounded-md">
          Login with Google
        </button>
        <button onClick={handleGuestLogin} className="w-full px-4 py-2 mt-4 font-bold text-white bg-gray-500 rounded-md">
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginPage;