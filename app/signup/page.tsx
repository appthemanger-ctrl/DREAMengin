'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? 'Sign up failed');
      return;
    }
    r.replace('/home');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="email" placeholder="you@email.com"
          value={email} onChange={e=>setEmail(e.target.value)} required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password" placeholder="Choose a password"
          value={password} onChange={e=>setPassword(e.target.value)} required
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          disabled={busy}
          className="rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm opacity-70">
        Already have an account? <a href="/login" className="underline">Log in</a>.
      </p>
    </main>
  );
}
