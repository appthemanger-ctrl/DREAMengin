'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } =
      view === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else router.push('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm mx-auto p-6 space-y-4">
        <h1 className="font-display text-2xl">{view === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          autoComplete="email"
        />
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={view === 'login' ? 'current-password' : 'new-password'}
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button className="w-full bg-brandA text-white rounded-lg py-2">
          {view === 'login' ? 'Login' : 'Sign up'}
        </button>
        <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm text-slate-300">
          {view === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
      </form>
    </div>
  );
}
