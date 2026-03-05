'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Image as ImageIcon, Music, Link as LinkIcon, Globe, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, visibility }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      router.push('/home');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Create Post</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="de-btn de-btn-primary"
            style={{ minHeight: 44, gap: 6 }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div className="de-widget">
            <div className="de-widget-body">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[200px] resize-none text-lg focus:outline-none"
                style={{
                  background: 'transparent',
                  color: 'var(--de-text)',
                  border: 'none',
                }}
                autoFocus
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm" style={{ color: content.length > 500 ? '#dc4444' : 'var(--de-text-dim)' }}>
                  {content.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="de-widget">
            <div className="de-widget-body">
              <div className="flex items-center gap-2">
                <span className="text-sm mr-2" style={{ color: 'var(--de-text-dim)' }}>Add:</span>
                <button type="button" className="p-2 rounded-full" style={{ background: 'rgba(42,138,184,0.1)' }} aria-label="Add image">
                  <ImageIcon className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                </button>
                <button type="button" className="p-2 rounded-full" style={{ background: 'rgba(42,138,184,0.1)' }} aria-label="Add music">
                  <Music className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                </button>
                <button type="button" className="p-2 rounded-full" style={{ background: 'rgba(42,138,184,0.1)' }} aria-label="Add link">
                  <LinkIcon className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="de-widget">
            <div className="de-widget-body">
              <div className="flex items-center gap-4">
                <span className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Visibility:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={visibility === 'public' ? 'de-btn de-btn-primary' : 'de-btn de-btn-ghost'}
                    style={{ minHeight: 40, gap: 6 }}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={visibility === 'private' ? 'de-btn de-btn-primary' : 'de-btn de-btn-ghost'}
                    style={{ minHeight: 40, gap: 6 }}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
