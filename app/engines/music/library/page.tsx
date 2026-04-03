import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import MusicLibraryPanel from '@/components/engines/music/panels/MusicLibraryPanel';
import { connection } from 'next/server';

export const metadata = { title: 'Preset Library – StarMakerEngin', description: 'Browse presets and templates.' };

const ACCENT = '#a855f7';
const NAV_ITEMS = [
  { href: '/engines/music',         label: 'DAW',     emoji: '🎛️' },
  { href: '/engines/music/studio',  label: 'Studio',  emoji: '🎙️' },
  { href: '/engines/music/arrange', label: 'Arrange', emoji: '🎼' },
  { href: '/engines/music/library', label: 'Library', emoji: '📂' },
];

export default async function MusicLibraryPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <EnginAppShell
      engineName="StarMakerEngin"
      engineEmoji="🎵"
      accentColor={ACCENT}
      backHref="/daydream/music"
      backLabel="Music Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <MusicLibraryPanel />
    </EnginAppShell>
  );
}
