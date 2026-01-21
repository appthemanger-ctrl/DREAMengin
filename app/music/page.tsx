
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function Music(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  const { data: releases } = await s.from('music_releases').select('*').order('release_date', { ascending:false }).limit(50);

  async function add(formData: FormData) {
    'use server';
    const sv = (await import('@/lib/supabase/server')).supaServer();
    const { data:{ user } } = await sv.auth.getUser(); if (!user) return;
    await sv.from('music_releases').insert({
      artist_user_id: user.id,
      title: String(formData.get('title')||''),
      release_url: String(formData.get('release_url')||''),
      cover_url: String(formData.get('cover_url')||''),
      tags: []
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Music Releases</h1>
      {user && (
        <form action={add} className="card p-3 grid gap-2 max-w-md">
          <input name="title" placeholder="Title" className="border rounded px-3 py-2"/>
          <input name="release_url" placeholder="Release link (Spotify/Apple/SC/YT)" className="border rounded px-3 py-2"/>
          <input name="cover_url" placeholder="Cover image URL (optional)" className="border rounded px-3 py-2"/>
          <button className="btn w-max">Add Release (Free)</button>
          <div className="text-xs text-gray-600">Paid promos later.</div>
        </form>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        {(releases ?? []).map((r:any)=>(
          <div key={r.id} className="card p-3">
            {r.cover_url && <img src={r.cover_url} alt="" className="rounded mb-2"/>}
            <div className="font-medium">{r.title}</div>
            {r.release_url && <a className="link text-sm" href={r.release_url} target="_blank">Listen</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
