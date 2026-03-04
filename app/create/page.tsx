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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Create Post</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors active:scale-95 min-h-[44px]"
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

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[200px] p-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-lg"
              autoFocus
            />
            <div className="flex justify-end mt-2">
              <span className={`text-sm ${content.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Attachments */}
          <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground mr-2">Add:</span>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add image"
            >
              <ImageIcon className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add music"
            >
              <Music className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add link"
            >
              <LinkIcon className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground">Visibility:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  visibility === 'public'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  visibility === 'private'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
