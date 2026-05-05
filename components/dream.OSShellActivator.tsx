'use client';

/**
 * OSShellActivator — global, route-aware DreamDM Bar activator.
 *
 * Background
 * ──────────
 * The DREAMengin OS shell (DreamDM Bar + dual runtime regions) lives in
 * `app/layout.tsx` via `<PersistentDreamBar />`. Its visibility / seam-mode
 * gate is `isHomeActive = runtimeCallbacks !== null`.
 *
 * Until now, only `app/homedream/page.tsx` mounted `<DreamBarDataBridge />`,
 * which is the only thing that ever called `registerRuntimeCallbacks(...)`.
 * That left every other authenticated route stuck with the bar in nav-rail
 * mode and the runtime regions hidden, even though `DreamSystemContext`
 * already bootstraps `homeData` for any authenticated user.
 *
 * What this does
 * ──────────────
 * Mounted once globally (from `app/layout.tsx`), this component registers
 * the same runtime callbacks `DreamBarDataBridge` registers, on every
 * authenticated route. It deliberately does NOT touch `homeData` — that
 * stays bootstrapped by `DreamSystemProvider` and enriched by
 * `DreamBarDataBridge` on `/homedream`.
 *
 * Skip rules
 * ──────────
 *   • Pre-login / public routes (`/`, `/login`, `/join`, `/policy`,
 *     `/about`, `/auth/*`) — leave the shell completely off.
 *   • `/homedream` — DreamBarDataBridge is mounted there with richer data;
 *     this activator stays out of the way to avoid double-registration.
 */

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId } from '@/lib/panels/panelTypes';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';
import { EnginDispatcher } from '@/lib/runtime/EnginDispatcher';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';

const DEFAULT_WORKFLOW_SPLIT = 0.5;

/** Routes that must NEVER activate the OS shell. */
const PUBLIC_ROUTE_PREFIXES = ['/login', '/join', '/policy', '/about', '/auth'];

/** Route that owns its own bridge (DreamBarDataBridge with richer home data). */
const OWN_BRIDGE_ROUTES = new Set<string>(['/homedream']);

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  return PUBLIC_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function OSShellActivator() {
  const pathname = usePathname();
  const dualRuntime = useDualRuntime();
  const {
    registerRuntimeCallbacks,
    unregisterRuntimeCallbacks,
    closeBothMenus,
    closeDrEams,
    splitRatio,
    setSplitRatio,
    isBarMinimized,
    setIsBarMinimized,
    homeData,
  } = useDreamSystem();

  const skip =
    isPublicRoute(pathname) ||
    OWN_BRIDGE_ROUTES.has(pathname ?? '') ||
    !homeData?.userId;

  // ── Callback wiring ────────────────────────────────────────────────────
  // Mirrors DreamBarDataBridge so the bar/menus behave identically on every
  // authenticated route. No homeData mutation here.

  const revealSplitRuntime = useCallback(
    (nextRatio = DEFAULT_WORKFLOW_SPLIT) => {
      setIsBarMinimized(false);
      setSplitRatio((current) => {
        if (current >= 0.98 || current <= 0.02) return nextRatio;
        return current;
      });
    },
    [setIsBarMinimized, setSplitRatio],
  );

  const returnHome = useCallback(() => {
    dualRuntime.goToHome();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
    closeBothMenus();
    closeDrEams();
  }, [closeBothMenus, closeDrEams, dualRuntime, revealSplitRuntime]);

  const openHomeDreamSpace = useCallback(() => {
    dualRuntime.goToHomeDreamSpace();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
  }, [dualRuntime, revealSplitRuntime]);

  const returnDreamSpace = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
    dualRuntime.setDominantRuntime('DreamSpace');
    setIsBarMinimized(false);
    setSplitRatio((current) => (current >= 0.5 ? 0.25 : current));
    closeBothMenus();
    closeDrEams();
  }, [closeBothMenus, closeDrEams, dualRuntime, setIsBarMinimized, setSplitRatio]);

  const openInSurface = useCallback(
    (id: SystemPanelId) => {
      dualRuntime.setTopRuntime({ type: 'panel', name: id });
      revealSplitRuntime(Math.max(splitRatio, 0.5));
    },
    [dualRuntime, revealSplitRuntime, splitRatio],
  );

  useEffect(() => {
    if (skip) return;
    registerRuntimeCallbacks({
      returnHome,
      openInSurface,
      openHomeDreamSpace,
      returnDreamSpace,
    });
    return unregisterRuntimeCallbacks;
  }, [
    skip,
    openHomeDreamSpace,
    openInSurface,
    registerRuntimeCallbacks,
    returnDreamSpace,
    returnHome,
    unregisterRuntimeCallbacks,
  ]);

  // Dominant-region effect — keep DualRuntime state in sync with the seam.
  useEffect(() => {
    if (skip) return;
    if (splitRatio >= 0.55) {
      dualRuntime.setDominantRuntime('Surface Space');
      return;
    }
    if (splitRatio <= 0.45) {
      dualRuntime.setDominantRuntime('DreamSpace');
    }
  }, [skip, dualRuntime, splitRatio]);

  // Publish runtime context to the dreamOSBus so other surfaces can react.
  useEffect(() => {
    if (skip) return;
    dreamOSBus.publishRuntimeContext({
      region: 'Surface Space',
      world: dualRuntime.state.surfaceSpaceWorld,
      splitRatio,
      dominant: dualRuntime.state.dominantRegion === 'Surface Space',
    });
    dreamOSBus.publishRuntimeContext({
      region: 'DreamSpace',
      world: dualRuntime.state.dreamSpaceWorld,
      splitRatio: 1 - splitRatio,
      dominant: dualRuntime.state.dominantRegion === 'DreamSpace',
    });
  }, [
    skip,
    dualRuntime.state.dominantRegion,
    dualRuntime.state.dreamSpaceWorld,
    dualRuntime.state.surfaceSpaceWorld,
    splitRatio,
  ]);

  // Seam-Y dispatcher — keep EnginDispatcher in sync with the seam position.
  useEffect(() => {
    if (skip) return;
    const dispatcher = EnginDispatcher.getInstance();
    const updateSeam = () => {
      const vh = window.innerHeight;
      const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;
      const seamY = Math.round((vh - dividerHeight) * splitRatio + dividerHeight / 2);
      dispatcher.setDreamDMBarY(seamY);
    };
    updateSeam();
    window.addEventListener('resize', updateSeam);
    return () => window.removeEventListener('resize', updateSeam);
  }, [skip, isBarMinimized, splitRatio]);

  return null;
}
