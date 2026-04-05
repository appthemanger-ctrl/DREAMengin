import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import LibraryPanel from '@/components/engines/games/panels/LibraryPanel';
import { connection } from 'next/server';

export const metadata = { title: 'Game Library – GameEngin', description: 'Browse all available games.' };

const ACCENT = '#c8981a';
const NAV_ITEMS = [
  { href: '/engines/games',         label: 'Hub',     emoji: '🎮' },
  { href: '/engines/games/library', label: 'Library', emoji: '📚' },
  { href: '/engines/games/scores',  label: 'Scores',  emoji: '🏆' },
  { href: '/engines/games/builder', label: 'Builder', emoji: '🗺️' },
];

export default async function GamesLibraryPage() {
  await connection();
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { /* Supabase not configured — treat as unauthenticated */ }
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <EnginAppShell
      engineName="GameEngin"
      engineEmoji="🎮"
      accentColor={ACCENT}
      backHref="/daydream/games"
      backLabel="Games Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <LibraryPanel />
    </EnginAppShell>
  );
}
