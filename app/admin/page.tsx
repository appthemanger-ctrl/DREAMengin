
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supaServer } from '@/lib/supabase/server';

export default async function AdminPage() {
  const isAdmin = cookies().get('admin')?.value === '1';
  if (!isAdmin) redirect('/admin/login');

  const s = supaServer();
  const { data: errors } = await s.from('error_reports').select('*').order('created_at', { ascending: false }).limit(10);

  async function run() {
    'use server';
    await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/innerdreams/run', { method:'POST' } as any);
  }

  async function logout() {
    'use server';
    await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/admin/logout', { method:'POST' } as any);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
      <form action={async (formData: FormData)=>{ 'use server'; await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/eam/command', { method:'POST', body: JSON.stringify({ q: 'next phase' }) } as any); }}>
        <button className="btn">Dr. Eam: Next Phase</button>
      </form>
        <form action={run}><button className="btn">Run Innerdreams</button></form>
        <form action={logout}><button className="btn">Logout</button></form>
      </div>
      <div className="card p-4">
        <div className="text-sm font-medium mb-2">Recent Error Reports</div>
        <ul className="text-xs space-y-2">
          {(errors ?? []).map((e:any)=>(
            <li key={e.id}>
              <div className="font-medium">{e.message}</div>
              <div className="opacity-70">{e.path}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
