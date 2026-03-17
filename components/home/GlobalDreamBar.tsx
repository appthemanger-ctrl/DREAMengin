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
import { usePathname }                              from 'next/navigation';
import DualBottomMenu, { type SystemMenuAction }    from '@/components/menus/DualBottomMenu';
import DrEamsPanel                                  from '@/components/dreamengin/DrEamsPanel';
import { useDreamSystem }                           from '@/lib/dreamdm/DreamSystemContext';

/** Routes where system menus must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/login', '/join', '/policy', '/about'];

export default function GlobalDreamBar() {
  const pathname = usePathname();

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
    runtimeCallbacks?.returnHome?.();
  }, [closeBothMenus, closeDrEams, runtimeCallbacks]);

  // ── System menu actions — all open in Surface Space via world dispatch ────

  const handleSystemAction = useCallback((action: SystemMenuAction) => {
    closeBothMenus();
    if (action === 'dr-eams')       { openDrEams(); return; }
    if (action === 'go-home')       { handleHome(); return; }
    if (action === 'settings')      { openInSurface('settings');            return; }
    if (action === 'account')       { openInSurface('profile');             return; }
    if (action === 'profiles')      { openInSurface('profile');             return; }
    if (action === 'feed-settings') { openInSurface('feed-settings');       return; }
    if (action === 'connectors')    { openInSurface('connectors');          return; }
    if (action === 'marketplace')   { openInSurface('marketplace');         return; }
    if (action === 'appearance')    { openInSurface('settings/appearance'); return; }
  }, [closeBothMenus, openDrEams, handleHome, openInSurface]);

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
