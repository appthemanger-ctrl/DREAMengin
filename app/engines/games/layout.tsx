/**
 * app/engines/games/layout.tsx
 *
 * Layout for the GameEngin standalone app.
 * Full-screen immersive shell — no shared nav or footer.
 */

import type { ReactNode } from 'react';

export const metadata = {
  title: 'GameEngin – DREAMengin',
  description: 'Full-feature game engine app with library, scores, and world builder.',
};

export default function GamesEnginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
