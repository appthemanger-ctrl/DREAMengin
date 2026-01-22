
import { supaServer } from '@/lib/supabase/server';
import FeedCard from '@/components/FeedCard';
import { notFound } from 'next/navigation';

export default async function Profile({ params }:{ params:{ handle:string } }){
  const s = supaServer();
  const { data: prof } = await s.from('profiles').select('*').eq('handle', params.handle).maybeSingle();
  if (!prof) notFound();

  const sinceISO = new Date(Date.now() - 6*3600*1000).toISOString();
  const nowISO = new Date().toISOString();
  const { data: items } = await s.from('feed_items').select('*')
    .eq('user_id', prof.user_id).eq('visibility','public')
    .or(`ts.gte.${sinceISO},and(saved_by_user.eq.true,retained_until.gt.${nowISO})`)
    .order('ts', { ascending: false }).limit(200);

  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-start gap-4">
        {prof.avatar_url && <img src={prof.avatar_url} className="w-16 h-16 rounded-full border" alt=""/>}\n        <div className="text-2xl font-semibold">{prof.display_name || prof.handle}</div>
      {Array.isArray(prof.links_json) && prof.links_json.length > 0 && (
        <div className="card p-4">
          <div className="font-medium">Links</div>
          <ul className="text-sm mt-2 space-y-1">
            {prof.links_json.map((l:any, idx:number)=>(<li key={idx}><a className="link" href={l.url} target="_blank">{l.label || l.type}</a></li>))}
          </ul>
        </div>
      )}
        {prof.bio && <p className="text-sm text-gray-700 mt-1">{prof.bio}</p>}
      </div>
      {Array.isArray(prof.links_json) && prof.links_json.length > 0 && (
        <div className="card p-4">
          <div className="font-medium">Links</div>
          <ul className="text-sm mt-2 space-y-1">
            {prof.links_json.map((l:any, idx:number)=>(<li key={idx}><a className="link" href={l.url} target="_blank">{l.label || l.type}</a></li>))}
          </ul>
        </div>
      )}
      <section className="grid gap-3">
        {(items ?? []).map((it:any)=>(<FeedCard key={it.id} item={it} />))}
      </section>
    </div>
      {Array.isArray(prof.links_json) && prof.links_json.length > 0 && (
        <div className="card p-4">
          <div className="font-medium">Links</div>
          <ul className="text-sm mt-2 space-y-1">
            {prof.links_json.map((l:any, idx:number)=>(<li key={idx}><a className="link" href={l.url} target="_blank">{l.label || l.type}</a></li>))}
          </ul>
        </div>
      )}
  );
}
