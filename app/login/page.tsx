'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa } from '@/lib/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login'|'signup'|'magic'>('login');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'magic') {
        const { error } = await supa.auth.signInWithOtp({ email });
        if (error) throw error;
        alert('Magic link sent — check your email');
        return;
      }
      if (mode === 'signup') {
        const { error } = await supa.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/home');
        return;
      }
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/home');
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Welcome</h1>
        <input
          className="w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />
        {mode !== 'magic' && (
          <input
            className="w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        )}
        <button disabled={loading} className="btn w-full">
          {loading ? 'Working...' : mode==='login'?'Login':mode==='signup'?'Create account':'Send magic link'}
        </button>
        <div className="flex justify-between text-sm opacity-80">
          <button type="button" onClick={()=>setMode(mode==='login'?'signup':'login')}>
            {mode==='login'?'Need an account?':'Have an account?'}
          </button>
          <button type="button" onClick={()=>setMode('magic')}>Use magic link</button>
        </div>
      </form>
    </main>
  );
}
