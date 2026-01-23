'use client';
import { useState } from 'react';
import { supa } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function signIn(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/home');
  }

  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-3">Login</h1>
      <form onSubmit={signIn} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input w-full border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input w-full border rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn w-full" disabled={loading}>{loading ? '…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
