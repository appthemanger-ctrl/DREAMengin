'use client';

/**
 * GameEnginApp — Full-screen app shell for the Games Engine.
 *
 * Wraps the existing GameEngin Side-B panel inside the immersive
 * EnginAppShell layout so it feels like a standalone app.
 *
 * Routes:
 *   /engines/games          → main GameEngin hub
 *   /engines/games/library  → game library browser
 *   /engines/games/scores   → scores & leaderboard
 *   /engines/games/builder  → world builder tool
 */

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import GameEngin from '@/engins/GameEngin';

const ACCENT = '#c8981a';
const BACK_HREF = '/daydream/games';

const NAV_ITEMS = [
  { href: '/engines/games',         label: 'Hub',     emoji: '🎮' },
  { href: '/engines/games/library', label: 'Library', emoji: '📚' },
  { href: '/engines/games/scores',  label: 'Scores',  emoji: '🏆' },
  { href: '/engines/games/builder', label: 'Builder', emoji: '🗺️' },
];

export default function GameEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="GameEngin"
      engineEmoji="🎮"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Games Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <GameEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
