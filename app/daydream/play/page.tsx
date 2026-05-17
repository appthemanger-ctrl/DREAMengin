// SURFACE: dreamsurface.DaydreamPlay  (framework-mandated basename: page.tsx)
import { redirect } from 'next/navigation';
import { buildGameLaunchHref, DEFAULT_GAME_ID } from '@/lib/games/navigation';
import { connection } from 'next/server';

/**
 * Legacy play daydream route — repurposed to the Games Daydream.
 *
 * Play/gaming is a capability of GameEngin (Games Daydream), not a standalone
 * Daydream surface. Per docs/ARCHITECTURE.md §9, this legacy route is kept as
 * a redirect so traffic forwards to the canonical Games Daydream at /daydream/games.
 */

export default async function PlayDaydreamLegacyPage() {
  await connection();
  redirect(buildGameLaunchHref(DEFAULT_GAME_ID));
}
