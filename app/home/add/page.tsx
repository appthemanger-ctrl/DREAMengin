'use client';
import { useState } from 'react';
import { supa } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
    if (!user) {
      alert('Please log in');
      setLoading(false);
      return;
    }

    const { error } = await supa.from('feed_items').insert({
      user_id: user.id,
      source: 'custom',
      source_account: 'manual',
      external_id: String(Date.now()),
      ts: new Date().toISOString(),
      title,
      summary,
      url: url || null,
    });

    if (!error) {
      router.push('/home');
    } else {
      alert(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold text-red-600 mb-2">Add to DreamFeed</h1>
      <p className="text-gray-600 mb-6">Create a custom feed item</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder="What happened?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="input w-full h-24 resize-y"
            placeholder="Short description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Link (optional)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input w-full"
            placeholder="https://..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? 'Adding...' : 'Add to Feed'}
        </button>
      </form>
    </div>
  );
}
