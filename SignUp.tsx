import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { Heart, Mail, Lock, User, AlertCircle } from 'lucide-react';

export function SignUp({ onSignInClick }: { onSignInClick: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Store email for pre-fill and success flag for Sign In UX
      localStorage.setItem('last_signup_email', email);
      localStorage.setItem('signup_success_trigger', 'true');
      onSignInClick();
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
        <h2 className="text-3xl font-serif text-gold italic">Create Sanctuary</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">Begin your journey</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-6">
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
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>


      <div className="mt-8 text-center">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
          Already have an account?{' '}
          <button 
            onClick={onSignInClick}
            className="text-gold hover:underline font-bold"
          >
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  );
}
