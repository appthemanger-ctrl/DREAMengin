/**
 * app/engines/layout.tsx
 *
 * Root layout for all engine apps.
 *
 * Deliberately minimal: no main nav, no footer.
 * Each engine provides its own full-screen shell via EnginAppShell.
 * The only shared layer here is the <html> body background color.
 */

import type { ReactNode } from 'react';

export default function EnginesRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      {children}
    </div>
  );
}
