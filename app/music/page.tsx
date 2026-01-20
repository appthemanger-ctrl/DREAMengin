import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Music, Upload, ExternalLink } from 'lucide-react';

export default async function MusicPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch music releases
  let music;
  if (user) {
    // Show user's own music plus public music
    const { data } = await supabase
      .from('music_releases')
      .select(`
        *,
        profiles!inner(handle, display_name)
      `)
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    music = data;
  } else {
    // Show only public music
    const { data } = await supabase
      .from('music_releases')
      .select(`
        *,
        profiles!inner(handle, display_name)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });
    music = data;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Music className="w-8 h-8 mr-3 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-900">Music</h1>
          </div>
          {user && (
            <Link
              href="/music/upload"
              className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Link>
          )}
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {music?.map((track) => (
            <div key={track.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {track.embed_url ? (
                <iframe
                  src={track.embed_url}
                  width="100%"
                  height="200"
                  allow="autoplay; clipboard-write; encrypted-media"
                  className="border-0"
                />
              ) : (
                <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                  <Music className="w-12 h-12 text-slate-400" />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">{track.title}</h3>
                <p className="text-sm text-slate-600 mb-3">
                  by @{track.profiles?.handle}
                </p>
                {track.embed_url?.includes('spotify') && (
                  <a
                    href={track.embed_url.replace('embed/', '').replace('track/', 'track/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in Spotify
                  </a>
                )}
                {track.embed_url?.includes('youtube') && (
                  <a
                    href={track.embed_url.replace('embed/', 'watch?v=')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {music?.length === 0 && (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No music yet</h2>
            <p className="text-slate-600 mb-4">Upload your first track or embed from YouTube/Spotify!</p>
            {user && (
              <Link
                href="/music/upload"
                className="inline-flex items-center bg-slate-800 text-white px-6 py-3 rounded-md hover:bg-slate-700"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Music
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}