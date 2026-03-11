import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';
import GamesHub from '@/components/games/GamesHub';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – Dreamengin', description: 'Play, challenge, and compete.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'platformer', emoji: '∞',  label: 'Dr. Eams',     desc: '3-level platformer, play now',  color: '#2a8ab8', href: '/game' },
  { id: 'sprint',     emoji: '📝', label: 'Word Sprint',  desc: '60-second typing challenge',    color: '#10b981', href: '/daydream/games' },
  { id: 'memory',     emoji: '🧩', label: 'Memory Grid',  desc: 'Flip cards, match all pairs',   color: '#6366f1', href: '/daydream/games' },
  { id: 'tap',        emoji: '⚡', label: 'Speed Tap',    desc: 'Tap as fast as you can',        color: '#f59e0b', href: '/daydream/games' },
  { id: 'scores',     emoji: '🏆', label: 'Leaderboard',  desc: 'Your personal bests',           color: '#c8981a', href: '/daydream/games' },
  { id: 'media',      emoji: '🎬', label: 'Media Vault',  desc: 'Save your gaming moments',      color: '#ec4899', href: '/daydream/media-vault' },
];

/**
 * Games Daydream page.
 *
 * Side A: GamesHub — the canonical games hub component (reclassified from
 *   the previous inline layout).  All live games are registered here.
 * Side B: GameEngin — the control layer for personal bests, leaderboard
 *   sharing, game launcher, and the GameRemote controller.
 *
 * Wiring: GamesHub ←→ GameEngin via DaydreamShell (flip with Alt+F or the
 * engine button).
 */
export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Games"
      enginName="GameEngin"
      accentColor="#2a8ab8"
      widgets={WIDGETS}
      sideBComponent={GameEngin}
    >
      <GamesHub />
    </DaydreamShell>
  );
}
