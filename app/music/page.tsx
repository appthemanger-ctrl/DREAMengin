import { supaServer } from '@/lib/supabase/server';
import AudioPlayer from '@/components/AudioPlayer';

export default async function MusicPage() {
  const s = supaServer();
  const { data: releases } = await s.from('music_releases').select('*').order('created_at', { ascending: false });
  const list = releases ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Music</h1>
        <a className="btn" href="/music/upload">Upload</a>
      </div>
      {list.length === 0 ? (
        <div className="card p-4">No releases yet.</div>
      ) : list.map((r: any) => (
        <div key={r.id} className="card p-4 space-y-2">
          <div className="font-medium">{r.title}</div>
          {r.cover_url && <img src={r.cover_url} alt="" className="w-40 rounded-lg" />}
          <AudioPlayer src={r.preview_url ?? undefined} />
          {r.release_url && <a className="underline" href={r.release_url} target="_blank">Open</a>}
        </div>
      ))}
    </div>
  );
}
