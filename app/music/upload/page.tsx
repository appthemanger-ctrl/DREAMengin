'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa } from '../../../lib/supabase/client';

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
    if (!user) { alert('Please log in'); setLoading(false); return; }
    const { error } = await supa.from('music_releases').insert({
      artist_user_id: user.id, title, release_url: releaseUrl, cover_url: coverUrl || null
    });
    if (error) alert(error.message); else router.push('/music');
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <h1 className="text-xl font-semibold">Upload Music</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input className="input w-full" placeholder="Release Link" value={releaseUrl} onChange={e=>setReleaseUrl(e.target.value)} required />
        <input className="input w-full" placeholder="Cover Image URL (optional)" value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} />
        <button className="btn w-full" disabled={loading}>{loading?'Publishing...':'Publish Release'}</button>
      </form>
    </div>
  );
}
