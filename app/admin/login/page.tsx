
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin(){
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const r = useRouter();

  async function submit(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch('/api/admin/login', { method:'POST', body: JSON.stringify({ password: pw }) });
    if (res.ok) r.push('/admin'); else setErr('Invalid password or server not configured.');
  }

  return (
    <div className="max-w-sm mx-auto card p-5 mt-6">
      <h1 className="text-xl font-semibold">Admin Access</h1>
      <p className="text-xs text-gray-600 mt-1">Enter admin password to continue.</p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <input type="password" className="border rounded w-full px-3 py-2" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Admin password"/>
        <button className="btn w-full">Enter</button>
      </form>
      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
    </div>
  );
}
