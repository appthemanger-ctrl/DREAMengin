
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Connectors(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  const [conn, follows] = await Promise.all([
    s.from('connection_accounts').select('*').eq('user_id', user.id),
    s.from('follow_sources').select('*').eq('follower_id', user.id)
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Connections</h1>
      <div className="card p-3">
        <ul className="text-sm space-y-1">{conn.data?.map((c:any)=>(
          <li key={c.id} className="flex items-center justify-between">
            <span>{c.provider}:{c.account_id} • {c.status}</span>
            <form action={async (fd:FormData)=>{
              'use server';
              const sv = supaServer();
              await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/connectors/disconnect', { method:'POST', body: JSON.stringify({ provider: c.provider, account_id: c.account_id }) } as any);
            }}><button className="text-xs underline">Disconnect</button></form>
          </li>
        ))}</ul>
      </div>

      <div className="card p-3">
        <h2 className="font-medium mb-2">Add Connection</h2>
        <form action={async (fd:FormData)=>{
          'use server';
          const sv = supaServer();
          const user = (await sv.auth.getUser()).data.user!;
          await sv.from('connection_accounts').insert({
            user_id: user.id,
            provider: String(fd.get('provider')),
            account_id: String(fd.get('account_id')),
            status: 'connected'
          });
        }} className="flex gap-2">
          <input name="provider" placeholder="youtube" className="border px-2 py-1 rounded"/>
          <input name="account_id" placeholder="@handle-or-id" className="border px-2 py-1 rounded"/>
          <button className="btn">Connect</button>
        </form>
      </div>

      <div className="card p-3">
        <h2 className="font-medium mb-2">Followed Sources</h2>
        <ul className="text-sm">{follows.data?.map((f:any)=>(<li key={f.id}>{f.source}@{f.source_handle}</li>))}</ul>
      </div>
    </div>
  );
}
