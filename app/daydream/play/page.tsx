import { redirect } from 'next/navigation';

/**
 * Legacy play daydream route — repurposed to the Games Daydream.
 *
 * Play/gaming is a capability of GameEngin (Games Daydream), not a standalone
 * Daydream surface. Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md:
 * "Rename and repurpose before rebuilding." This route now forwards traffic
 * to the canonical Games Daydream at /daydream/games.
 */
export const dynamic = 'force-dynamic';

export default function PlayDaydreamLegacyPage() {
  redirect('/daydream/games');
}
