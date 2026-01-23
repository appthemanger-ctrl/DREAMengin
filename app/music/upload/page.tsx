'use client';
import { useState } from 'react';
import { supa } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function MusicUpload() {
  const [title, setTitle] = useState('');
  const [releaseUrl, setReleaseUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      alert('Please log in first');
      setLoading(false);
      return;
    }

    const { error } = await supa.from('music_releases').insert({
      artist_user_id: user.id,
      title,
      release_url: releaseUrl,
      cover_url: coverUrl || null,
    });

    if (!error) {
      router.push('/music');
    } else {
      alert(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold text-red-600 mb-2">Upload Music</h1>
      <p className="text-gray-600 mb-6">Share your new release</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder="Song / Album name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Release Link</label>
          <input
            value={releaseUrl}
            onChange={(e) => setReleaseUrl(e.target.value)}
            className="input w-full"
            placeholder="Spotify / YouTube / SoundCloud"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cover Image URL (optional)</label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="input w-full"
            placeholder="https://..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn w-full py-3">
          {loading ? 'Publishing...' : 'Publish Release'}
        </button>
      </form>
    </div>
  );
}
