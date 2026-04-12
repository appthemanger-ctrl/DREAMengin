import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Music, Sparkles } from 'lucide-react';
import SoundRecorder from '@/components/music/SoundRecorder';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import StarMakerEngin from '@/engins/StarMakerEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { connection } from 'next/server';

export const metadata = {
  title: 'Artist Hub – DREAMengin',
  description: 'Your artist command center — record, release, and distribute your music.',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'record',      emoji: '🎙️', label: 'Record',         desc: 'Open the production studio',   color: '#2a8ab8', href: '/daydream/music' },
  { id: 'upload',      emoji: '📤', label: 'Upload Track',   desc: 'Add a track to your library',  color: '#6366f1', href: '/music/upload' },
  { id: 'releases',    emoji: '🎵', label: 'My Releases',    desc: 'Albums, singles, and EPs',     color: '#c8981a', href: '/music' },
  { id: 'distribute',  emoji: '🌍', label: 'Distribute',     desc: 'Send to Spotify, Apple, etc.', color: '#00bcd4', href: '/music' },
  { id: 'monetize',    emoji: '💰', label: 'Monetize',       desc: 'Royalties, splits, sync',      color: '#f59e0b', href: '/music' },
  { id: 'share',       emoji: '🔗', label: 'Share to Feed',  desc: 'Post a track or update',       color: '#ec4899', href: '/daydream/create' },
  { id: 'brand',       emoji: '🎨', label: 'Brand Hub',      desc: 'Your artist identity',         color: '#0ea5e9', href: '/daydream/brand' },
];

export default async function MusicArtistHubPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <DaydreamShell
      title="Artist Hub"
      enginName="StarMakerEngin"
      accentColor="#2a8ab8"
      daydreamType="music"
      widgets={WIDGETS}
      sideBComponent={StarMakerEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Artist Hub"
          subtitle="Record, release, and distribute your music."
          icon={<Music className="w-4 h-4" />}
          accentColor="#2a8ab8"
          badge="Daydream"
        />

        <div className="de-auth-content space-y-4">
          <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
            Manage your music here on Side A. Open StarMakerEngin (Side B) for production tools.
          </p>

          {/* Quick Sound Recorder */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Sparkles className="w-4 h-4" style={{ color: '#2a8ab8' }} />
              <span className="de-widget-title ml-2">Quick Capture</span>
            </div>
            <div className="de-widget-body">
              <SoundRecorder />
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
