'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa } from '../../../lib/supabase/client';

export default function AddPage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supa.auth.getUser();
    if (!user) { alert('Please log in'); setLoading(false); return; }
    const { error } = await supa.from('feed_items').insert({
      user_id: user.id, source: 'custom', source_account: 'manual',
      external_id: String(Date.now()), ts: new Date().toISOString(),
      title, summary, url: url || null,
    });
    if (error) alert(error.message); else router.push('/home');
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <h1 className="text-xl font-semibold">Add to DreamFeed</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="input w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea className="input w-full h-24" placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} />
        <input className="input w-full" placeholder="Link (optional)" value={url} onChange={e=>setUrl(e.target.value)} />
        <button className="btn w-full" disabled={loading}>{loading?'Adding...':'Add to Feed'}</button>
      </form>
    </div>
  );
}
