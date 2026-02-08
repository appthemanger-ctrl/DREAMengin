'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Music, Upload, Loader2, Youtube, Info } from 'lucide-react';

export default function UploadMusicPage() {
  const [title, setTitle] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError(err.message || 'Failed to upload music');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/music" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Upload Music</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Track Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
              required
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
            />
          </div>

          {/* Embed URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              YouTube or Spotify Link
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/track/..."
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
            />
            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Paste a YouTube or Spotify link and we will automatically convert it to an embed.</p>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Visibility
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors min-h-[48px] ${
                  visibility === 'public'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors min-h-[48px] ${
                  visibility === 'private'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Preview */}
          {embedUrl && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preview
              </label>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {embedUrl.includes('youtube') || embedUrl.includes('youtu.be') ? (
                  <iframe
                    src={embedUrl.includes('embed') ? embedUrl : `https://www.youtube.com/embed/${embedUrl.split('v=')[1]?.split('&')[0] || embedUrl.split('youtu.be/')[1]?.split('?')[0]}`}
                    width="100%"
                    height="200"
                    allow="autoplay; encrypted-media"
                    className="border-0"
                  />
                ) : embedUrl.includes('spotify') ? (
                  <iframe
                    src={embedUrl.includes('embed') ? embedUrl : `https://open.spotify.com/embed/track/${embedUrl.split('track/')[1]?.split('?')[0]}`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media"
                    className="border-0"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    <Music className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !title}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Track
              </>
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <h3 className="font-medium text-foreground mb-2">Supported Platforms</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>YouTube - paste any video or music URL</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Spotify - paste any track URL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
