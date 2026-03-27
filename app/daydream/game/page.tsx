// app/daydream/game/page.tsx
// Legacy MADMAXI standalone page — now redirects to the Games hub.
// MADMAXI is the default (first) game in GamesHub. The standalone boot
// shell is removed per issue: "REMOVE THE OLD MADA MAXI AND MAKE THIS
// ONE THE DEFAULT". The GameRemote is now the universal controller for
// every game including MADMAXI, accessible via Side B or a second tab.

import { redirect } from 'next/navigation';
import { buildGameLaunchHref, DEFAULT_GAME_ID } from '@/lib/games/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'MADMAXI – DREAMengin',
  description: 'MADMAXI — Babylon.js 3-D side-scroller in the Games Daydream.',
};

export default function GamePage() {
  redirect(buildGameLaunchHref(DEFAULT_GAME_ID));
}
