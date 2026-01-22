
'use client';
import { useState } from 'react';
import { supa } from '@/lib/supabase/client';
export default function Login(){
  const [email, setEmail] = useState(''); const [sent, setSent]=useState(false);
  async function submit(e:React.FormEvent){ e.preventDefault();
    const { error } = await supa.auth.signInWithOtp({ email });
    if(!error) setSent(true); else alert(error.message);
  }
  return (<div className="max-w-md mx-auto">
    <h1 className="text-2xl font-semibold mb-4">Login</h1>
    {!sent ? (<form onSubmit={submit} className="space-y-3">
      <input name="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full border rounded px-3 py-2"/>
      <button className="btn">Send magic link</button>
    </form>) : <p>Check your email.</p>}
  </div>);
}
