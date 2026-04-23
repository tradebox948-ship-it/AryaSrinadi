import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { Heart, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SignIn({ onSignUpClick }: { onSignUpClick: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we redirected from a successful signup
    const pendingEmail = localStorage.getItem('last_signup_email');
    const wasSuccess = localStorage.getItem('signup_success_trigger');
    
    if (wasSuccess === 'true' && pendingEmail) {
      setEmail(pendingEmail);
      setSuccessMessage("Your account has been created. Please check your email and verify your address before logging in.");
      
      // Clean up
      localStorage.removeItem('signup_success_trigger');
      localStorage.removeItem('last_signup_email');
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirect is handled by onAuthStateChange in App.tsx or just by state change
      window.location.href = '/';
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback.html`,
        skipBrowserRedirect: true
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.url) {
      // Open the OAuth provider's URL directly in popup
      const authWindow = window.open(
        data.url,
        'supabase_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setError('Please allow popups to sign in with Google.');
        setLoading(false);
      }
      // Note: We don't need to manually close loading here as onAuthStateChange 
      // in App.tsx or the postMessage listener will handle the session update.
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="card-sophisticated p-8 md:p-12 w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <Heart className="w-12 h-12 text-gold mx-auto mb-4 fill-current opacity-20" />
        <h2 className="text-3xl font-serif text-gold italic">Welcome Back</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">Enter your sanctuary</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-6">
        {successMessage && (
          <div className="flex items-start gap-3 text-gold text-xs bg-gold/10 p-4 rounded-sm border border-gold/20 leading-relaxed italic">
            <CheckCircle2 className="w-5 h-5 shrink-0 opacity-50" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-zinc-900 rounded-sm outline-none focus:border-gold/50 transition-all text-zinc-200"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-zinc-900 rounded-sm outline-none focus:border-gold/50 transition-all text-zinc-200"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mt-2 bg-red-400/10 p-3 rounded-sm border border-red-400/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-gold text-black rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-gold/90 transition-all shadow-xl shadow-gold/5 disabled:opacity-50"
        >
          {loading ? 'Entering...' : 'Sign In'}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-900"></div>
          </div>
          <div className="relative flex justify-center text-[8px] uppercase tracking-widest">
            <span className="bg-zinc-950 px-4 text-zinc-600">Or continue with</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 border border-zinc-900 text-zinc-400 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Mail className="w-4 h-4 text-gold" /> Google Account
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
          Don't have an account?{' '}
          <button 
            onClick={onSignUpClick}
            className="text-gold hover:underline font-bold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </motion.div>
  );
}
