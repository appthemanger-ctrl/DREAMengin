'use client';

/**
 * MusicEnginApp — Full-screen app shell for the Music Engine (StarMakerEngin).
 *
 * Routes:
 *   /engines/music          → full DAW (StarMakerEngin)
 *   /engines/music/studio   → recording studio panel
 *   /engines/music/arrange  → arrangement view
 *   /engines/music/library  → preset library
 */

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import StarMakerEngin from '@/components/daydream/StarMakerEngin';

const ACCENT = '#a855f7';
const BACK_HREF = '/daydream/music';

const NAV_ITEMS = [
  { href: '/engines/music',         label: 'DAW',      emoji: '🎛️' },
  { href: '/engines/music/studio',  label: 'Studio',   emoji: '🎙️' },
  { href: '/engines/music/arrange', label: 'Arrange',  emoji: '🎼' },
  { href: '/engines/music/library', label: 'Library',  emoji: '📂' },
];

export default function MusicEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="StarMakerEngin"
      engineEmoji="🎵"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Music Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <StarMakerEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
