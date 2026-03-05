'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Music, Upload, Loader2, Youtube, Globe, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function UploadMusicPage() {
  const [title, setTitle] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Convert YouTube/Spotify URLs to embed format
      let finalEmbedUrl = embedUrl;
      if (embedUrl.includes('youtube.com/watch')) {
        const videoId = embedUrl.split('v=')[1]?.split('&')[0];
        finalEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
        finalEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('spotify.com/track/')) {
        const trackId = embedUrl.split('track/')[1]?.split('?')[0];
        finalEmbedUrl = `https://open.spotify.com/embed/track/${trackId}`;
      }

      const { error: insertError } = await supabase
        .from('music_releases')
        .insert({
          user_id: user.id,
          owner_id: user.id,
          title,
          embed_url: finalEmbedUrl || null,
          visibility
        });

      if (insertError) throw insertError;

      router.push('/music');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload music');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/music" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Music className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Upload Music</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Track details */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Track Details</span></div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Track Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
              />
            </label>

            {/* Embed URL */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>YouTube or Spotify Link</span>
              <input
                type="url"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/track/..."
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
              />
              <span style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>Paste a YouTube or Spotify link — we will automatically convert it to an embed.</span>
            </label>

            {/* Visibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Visibility</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={visibility === 'public' ? 'de-btn de-btn-primary' : 'de-btn de-btn-ghost'}
                  style={{ flex: 1, gap: 6, minHeight: 44 }}
                >
                  <Globe className="w-4 h-4" /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={visibility === 'private' ? 'de-btn de-btn-primary' : 'de-btn de-btn-ghost'}
                  style={{ flex: 1, gap: 6, minHeight: 44 }}
                >
                  <Lock className="w-4 h-4" /> Private
                </button>
              </div>
            </div>

            {error && (
              <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {embedUrl && (
            <div style={{ borderTop: '1px solid rgba(160,195,240,0.2)', padding: '14px 18px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Preview</span>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--de-border)' }}>
                {embedUrl.includes('youtube') || embedUrl.includes('youtu.be') ? (
                  <iframe
                    src={embedUrl.includes('embed') ? embedUrl : `https://www.youtube.com/embed/${embedUrl.split('v=')[1]?.split('&')[0] || embedUrl.split('youtu.be/')[1]?.split('?')[0]}`}
                    width="100%"
                    height="200"
                    allow="autoplay; encrypted-media"
                    style={{ border: 0, display: 'block' }}
                  />
                ) : embedUrl.includes('spotify') ? (
                  <iframe
                    src={embedUrl.includes('embed') ? embedUrl : `https://open.spotify.com/embed/track/${embedUrl.split('track/')[1]?.split('?')[0]}`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media"
                    style={{ border: 0, display: 'block' }}
                  />
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(42,138,184,0.06)' }}>
                    <Music className="w-12 h-12" style={{ color: 'var(--de-text-dim)' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !title}
              className="de-btn de-btn-primary"
              style={{ width: '100%', gap: 8 }}
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</> : <><Upload className="w-5 h-5" /> Upload Track</>}
            </button>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Supported Platforms</span></div>
          <div className="de-widget-body" style={{ padding: 0 }}>
            <div className="de-row">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,68,68,0.1)' }}>
                <Youtube className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>YouTube</p>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Paste any video or music URL</p>
              </div>
            </div>
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(30,215,96,0.1)' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1db954' }}>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Spotify</p>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Paste any track URL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
