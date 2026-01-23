import { supaServer } from '@/lib/supabase/server';
import AudioPlayer from '@/components/AudioPlayer';

export default async function MusicPage() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  const { data: releases } = await s
    .from('music_releases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Music</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(releases ?? []).map((r:any) => (
          <div key={r.id} className="card">
            <div className="font-medium">{r.title}</div>
            {r.cover_url && <img src={r.cover_url} alt={r.title} className="mt-2 rounded-lg" />}
            <AudioPlayer src={r.preview_url || undefined} />
            {r.release_url && <a className="link" href={r.release_url} target="_blank" rel="noreferrer">Open</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
