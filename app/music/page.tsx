import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Music, Upload, ExternalLink, ArrowLeft, Play } from 'lucide-react';

export default async function MusicPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch music releases
  const { data: musicData } = await supabase
    .from('music_releases')
    .select(`
      *,
      profiles!inner(handle, display_name)
    `)
    .or(`visibility.eq.public,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Demo tracks to show UI when no real data exists
  const demoMusic = [
    {
      id: 'demo-1',
      title: 'Cosmic Dreams',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
    {
      id: 'demo-2',
      title: 'Infinity Loop',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'producer', display_name: 'Night Producer' }
    },
    {
      id: 'demo-3',
      title: 'Neural Pathways',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'synthwave', display_name: 'Synthwave Artist' }
    },
    {
      id: 'demo-4',
      title: 'Digital Sunrise',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'ambient', display_name: 'Ambient Sounds' }
    },
    {
      id: 'demo-5',
      title: 'Quantum Beat',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'beats', display_name: 'Beat Maker' }
    },
    {
      id: 'demo-6',
      title: 'Torus Flow',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'electronic', display_name: 'Electronic Vibes' }
    },
  ];

  const music = musicData && musicData.length > 0 ? musicData : demoMusic;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Music</h1>
          </div>
          <Link
            href="/music/upload"
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Upload className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mr-3">
              <Music className="w-5 h-5 text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Music</h1>
          </div>
          <Link
            href="/music/upload"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors active:scale-95 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Link>
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {music?.map((track) => (
            <div key={track.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-colors group">
              {track.embed_url ? (
                <iframe
                  src={track.embed_url}
                  width="100%"
                  height="180"
                  allow="autoplay; clipboard-write; encrypted-media"
                  className="border-0"
                />
              ) : track.audio_url ? (
                <div className="w-full bg-muted p-6 flex items-center justify-center relative">
                  <div className="w-full">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Music className="w-8 h-8 text-primary" />
                    </div>
                    <audio 
                      controls 
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={track.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 bg-muted flex items-center justify-center relative">
                  <Music className="w-12 h-12 text-muted-foreground" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{track.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  by @{track.profiles?.handle}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {track.embed_url?.includes('spotify') && (
                    <a
                      href={track.embed_url.replace('embed/', '').replace('track/', 'track/')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-500 bg-green-500/10 rounded-full hover:bg-green-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Spotify
                    </a>
                  )}
                  {track.embed_url?.includes('youtube') && (
                    <a
                      href={track.embed_url.replace('embed/', 'watch?v=')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 bg-red-500/10 rounded-full hover:bg-red-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      YouTube
                    </a>
                  )}
                  {track.audio_url && track.file_size_bytes && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full">
                      {(track.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo banner when showing demo items */}
        {(!musicData || musicData.length === 0) && music.length > 0 && (
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-sm text-primary font-medium">
              These are sample tracks. Upload your first track to share your music!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
