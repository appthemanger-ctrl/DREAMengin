'use client';

/**
 * PersistentDreamBar — Shell-First DreamDMBar wrapper.
 *
 * Renders DreamDMBar inside app/layout.tsx so it is NEVER unmounted during
 * client-side navigation. Previously the bar lived inside HomeSystem (mounted
 * only at /homedream), causing it to flash or ghost whenever the user
 * navigated between pages.
 *
 * Behaviour:
 *   - Hidden on public / pre-login routes (landing, login, policy, about).
 *   - When HomeSystem is mounted (/homedream), the bar operates in divider mode:
 *     splitRatio and isBarMinimized come from DreamSystemContext, which
 *     HomeSystem writes. The bar controls the Surface Space / DreamSpace seam.
 *   - On all other authenticated pages, the bar operates in nav mode:
 *     no splitRatio is passed so the bar anchors to the bottom and acts as a
 *     persistent navigation and messaging rail.
 */

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DreamDMBar from '@/dreamdmbar/DreamDMBar';
import NeuralSeamCanvas from '@/components/home/NeuralSeamCanvas';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

/** Routes where the bar must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/', '/login', '/join', '/policy', '/about'];

export default function PersistentDreamBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const {
    openBothMenus,
    runtimeCallbacks,
    splitRatio,
    setSplitRatio,
    isBarMinimized: _isBarMinimized,
    setIsBarMinimized,
  } = useDreamSystem();

  const handleHome = useCallback(() => {
    if (runtimeCallbacks?.returnHome) {
      runtimeCallbacks.returnHome();
    } else {
      router.push('/homedream');
    }
  }, [runtimeCallbacks, router]);

  const handleHomeDreamSpace = useCallback(() => {
    runtimeCallbacks?.openHomeDreamSpace?.();
  }, [runtimeCallbacks]);

  // Hide on public / pre-login surfaces
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  // Only wire split-mode props when the dual runtime (HomeSystem) is active.
  // On other pages the bar anchors to the bottom and acts as a nav rail.
  const isHomeSystemActive = runtimeCallbacks !== null;

  return (
    <>
      <NeuralSeamCanvas active={isHomeSystemActive} splitRatio={splitRatio} />
      <DreamDMBar
        onHome={handleHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={isHomeSystemActive ? handleHomeDreamSpace : undefined}
        splitRatio={isHomeSystemActive ? splitRatio : undefined}
        onSplitChange={isHomeSystemActive ? setSplitRatio : undefined}
        onMinimizedChange={isHomeSystemActive ? setIsBarMinimized : undefined}
      />
    </>
  );
}
