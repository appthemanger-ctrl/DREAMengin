
'use client';
import { useState } from 'react';
export default function Discover(){
  const [q,setQ]=useState(''); const [res,setRes]=useState<any|null>(null);
  async function run(){ const r = await fetch('/api/search?q='+encodeURIComponent(q)); setRes(await r.json()); }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Search & Discover</h1>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} className="border rounded px-3 py-2 flex-1" placeholder="Search users, music, products"/>
        <button className="btn" onClick={run}>Search</button>
      </div>
      {res && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-3"><div className="font-medium">Users</div><ul className="text-sm mt-2 space-y-1">{res.profiles.map((p:any)=>(<li key={p.handle}><a className="link" href={`/profile/${p.handle}`}>{p.display_name || p.handle}</a></li>))}</ul></div>
          <div className="card p-3"><div className="font-medium">Music</div><ul className="text-sm mt-2 space-y-1">{res.music.map((m:any)=>(<li key={m.id}><a className="link" href={m.release_url} target="_blank">{m.title}</a></li>))}</ul></div>
          <div className="card p-3"><div className="font-medium">Products</div><ul className="text-sm mt-2 space-y-1">{res.products.map((p:any)=>(<li key={p.id}>{p.name} — ${p.price}</li>))}</ul></div>
        </div>
      )}
    </div>
  );
}
