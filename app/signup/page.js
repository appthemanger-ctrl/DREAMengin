// app/signup/page.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function SignupPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const supa = supaBrowser();
      const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/auth/callback';
      const { error } = await supa.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      setMessage('Check your email to confirm your account.');
    } catch (err) {
      setMessage(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={onSubmit} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Create account</h1>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="input" placeholder="you@example.com" />
        <label style={{marginTop:8}}>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Create account'}</button>
        <div style={{marginTop:10,fontSize:14}}>
          <Link href="/login">Back to sign in</Link>
        </div>
        {message && <p style={{marginTop:10,fontSize:13}}>{message}</p>}
      </form>
    </div>
  );
}
