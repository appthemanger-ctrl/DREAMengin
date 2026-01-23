// app/auth/reset/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supaBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function ResetPage(){
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.get('code');
    const supa = supaBrowser();
    if (code) {
      supa.auth.exchangeCodeForSession(code).catch(() => {});
    }
  }, [params]);

  async function update(e){
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const supa = supaBrowser();
      const { error } = await supa.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Password updated. Redirecting...');
      setTimeout(()=>router.push('/login'), 1200);
    } catch (err) {
      setMsg(err.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={update} className="card p-6" style={{minWidth:320}}>
        <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Choose a new password</h1>
        <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" minLength={8} required />
        <button disabled={loading} className="btn" style={{marginTop:12}}>{loading ? '...' : 'Update password'}</button>
        {msg && <p style={{marginTop:10,fontSize:13}}>{msg}</p>}
      </form>
    </div>
  );
}
