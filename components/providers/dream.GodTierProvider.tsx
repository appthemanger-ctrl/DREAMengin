'use client';

/**
 * GodTierProvider — mounts the useGodTier hook at the app root.
 *
 * This client component injects God Tier CSS custom properties onto :root
 * every animation frame, making all --gt-* tokens live everywhere in the app.
 * It has no visible UI of its own; it is purely a side-effect provider.
 */

import { useGodTier } from '@/lib/god-tier/useGodTier';
import { usePathname } from 'next/navigation';

export default function GodTierProvider() {
  const pathname = usePathname();

  // Derive activeTask from route for richer signals
  const activeTask =
    pathname.startsWith('/game')       ? 'game_session' :
    pathname.startsWith('/showcase')   ? 'hero_showcase' :
    pathname.startsWith('/shop')       ? 'purchase' :
    pathname.startsWith('/checkout')   ? 'checkout' :
    pathname.startsWith('/dream')      ? 'dream_browse' :
    'browse';

  // Run the god tier hook — CSS vars are injected onto :root inside the hook
  useGodTier({
    route: pathname,
    activeTask,
    primaryIntent: 'explore',
    nextLikelyRoutes: [],
  });

  // No visible output — pure side-effect
  return null;
}
