// app/auth/forgot/page.js
'use client';
import { useState } from 'react';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function ForgotPage(){
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendReset(e){
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const supa = supaBrowser();
      const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/auth/reset';
      const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg('Reset link sent. Check your email.');
    } catch (err) {
      setMsg(err.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={sendReset} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Reset password</h1>
        <input type="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Send reset link'}</button>
        {msg && <p style={{marginTop:10,fontSize:13}}>{msg}</p>}
      </form>
    </div>
  );
}
