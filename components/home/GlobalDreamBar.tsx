'use client';

/**
 * GlobalDreamBar — global overlay menus only.
 *
 * DreamDMBar (the seam) now lives inside HomeSystem, co-located with the
 * dual-runtime it controls. It only renders when the home surface is active.
 *
 * This component handles only the true global overlays that need to appear
 * above any surface: DualBottomMenu and DrEamsPanel.
 *
 * Hidden on public/pre-login routes so unauthenticated users never see
 * system menus.
 */

import { useCallback }                              from 'react';
import { usePathname, useRouter }                   from 'next/navigation';
import DualBottomMenu, { type SystemMenuAction }    from '@/components/menus/DualBottomMenu';
import DrEamsPanel                                  from '@/components/dreamengin/DrEamsPanel';
import { useDreamSystem }                           from '@/lib/dreamdm/DreamSystemContext';

/** Routes where system menus must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/login', '/join', '/policy', '/about'];

export default function GlobalDreamBar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    bothMenusOpen,
    closeBothMenus,
    drEamsOpen,
    openDrEams,
    closeDrEams,
    runtimeCallbacks,
    openInSurface,
  } = useDreamSystem();

  // ── Go home (from "go-home" menu action) ─────────────────────────────────

  const handleHome = useCallback(() => {
    closeBothMenus();
    closeDrEams();
    // If HomeSystem is mounted use its returnHome; otherwise navigate to /homedream
    if (runtimeCallbacks?.returnHome) {
      runtimeCallbacks.returnHome();
    } else {
      router.push('/homedream');
    }
  }, [closeBothMenus, closeDrEams, runtimeCallbacks, router]);

  // ── System menu actions — prefer SPA panel when HomeSystem is active,
  //    fall back to route navigation otherwise so links always work.   ──────

  const handleSystemAction = useCallback((action: SystemMenuAction) => {
    closeBothMenus();
    if (action === 'dr-eams')       { openDrEams(); return; }
    if (action === 'go-home')       { handleHome(); return; }

    // When HomeSystem's runtimeCallbacks are registered (user is on /homedream),
    // open the feature inline in Surface Space — no routing, no page reload.
    // When they're not (user is on any other page), fall back to direct navigation.
    const hasSpaCallbacks = Boolean(runtimeCallbacks?.openInSurface);
    if (action === 'settings')      { hasSpaCallbacks ? openInSurface('settings')            : router.push('/settings');              return; }
    if (action === 'account')       { hasSpaCallbacks ? openInSurface('profile')             : router.push('/edit-profiledream');     return; }
    if (action === 'profiles')      { hasSpaCallbacks ? openInSurface('profile')             : router.push('/edit-profiledream');     return; }
    if (action === 'feed-settings') { hasSpaCallbacks ? openInSurface('feed-settings')       : router.push('/feed-settings');         return; }
    if (action === 'connectors')    { hasSpaCallbacks ? openInSurface('connectors')          : router.push('/connectors');            return; }
    if (action === 'marketplace')   { hasSpaCallbacks ? openInSurface('marketplace')         : router.push('/marketplace');           return; }
    if (action === 'appearance')    { hasSpaCallbacks ? openInSurface('settings/appearance') : router.push('/settings/appearance');   return; }
  }, [closeBothMenus, openDrEams, handleHome, openInSurface, runtimeCallbacks, router]);

  // ── Hide on public / pre-login routes ────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) return null;

  return (
    <>
      <DualBottomMenu
        open={bothMenusOpen}
        onClose={closeBothMenus}
        onSystemAction={handleSystemAction}
      />

      {drEamsOpen && <DrEamsPanel onClose={closeDrEams} />}
    </>
  );
}
