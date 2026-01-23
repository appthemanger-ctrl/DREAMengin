'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa } from '@/lib/supabase/client';

export default function MusicUpload() {
  const [title, setTitle] = useState('');
  const [releaseUrl, setReleaseUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supa.auth.getUser();
      if (!user) throw new Error('Please log in first');
      const { error } = await supa.from('music_releases').insert({
        artist_user_id: user.id,
        title,
        release_url: releaseUrl,
        cover_url: coverUrl || null,
      });
      if (error) throw error;
      router.push('/music');
    } catch (err:any) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-2">Upload Music</h1>
      <p className="opacity-70 mb-6">Share your new release</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="input w-full" placeholder="Song / Album name" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Release Link</label>
          <input value={releaseUrl} onChange={(e)=>setReleaseUrl(e.target.value)} className="input w-full" placeholder="Spotify / YouTube / SoundCloud" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cover Image URL (optional)</label>
          <input value={coverUrl} onChange={(e)=>setCoverUrl(e.target.value)} className="input w-full" placeholder="https://..." />
        </div>
        <button type="submit" disabled={loading} className="btn w-full">{loading ? 'Publishing...' : 'Publish Release'}</button>
      </form>
    </div>
  );
}
