'use client';

/**
 * GlobalDreamBar — root-level shell for DreamDMBar + DualBottomMenu + DrEamsPanel.
 *
 * System menu actions call openInSurface(panelId) — loads the feature as a
 * RuntimeWorld in Surface Space. Zero router.push(). Zero overlays. Zero routing.
 * The seam stays. The bar stays. Only the world in the region changes.
 *
 * Hidden on public/pre-login routes so unauthenticated users never see
 * the gold ball, DreamDM bar, or system menus.
 */

import { useCallback }                              from 'react';
import { useRouter, usePathname }                   from 'next/navigation';
import DreamDMBar                                   from '@/components/messaging/DreamDMBar';
import DualBottomMenu, { type SystemMenuAction }    from '@/components/menus/DualBottomMenu';
import DrEamsPanel                                  from '@/components/dreamengin/DrEamsPanel';
import { useDreamSystem }                           from '@/lib/dreamdm/DreamSystemContext';

/** Routes where GlobalDreamBar must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/login', '/join', '/policy', '/about'];

export default function GlobalDreamBar() {
  const router   = useRouter();
  const pathname = usePathname();

  const {
    bothMenusOpen,
    openBothMenus,
    closeBothMenus,
    drEamsOpen,
    openDrEams,
    closeDrEams,
    runtimeCallbacks,
    openInSurface,
  } = useDreamSystem();

  // ── Gold button: single-tap → menus, double-tap → home ───────────────────

  const handleHome = useCallback(() => {
    closeBothMenus();
    closeDrEams();
    if (runtimeCallbacks) {
      runtimeCallbacks.returnHome();
    } else {
      router.push('/homedream');
    }
  }, [closeBothMenus, closeDrEams, runtimeCallbacks, router]);

  // ── Gold button (bar at top): double-tap → HomeDream in DreamSpace ────────

  const handleHomeDreamSpace = useCallback(() => {
    closeBothMenus();
    closeDrEams();
    if (runtimeCallbacks?.homeDreamSpace) {
      runtimeCallbacks.homeDreamSpace();
    } else {
      router.push('/homedream');
    }
  }, [closeBothMenus, closeDrEams, runtimeCallbacks, router]);

  // ── System menu actions — all open in Surface Space via world dispatch ────
  // No router.push(). The panel loads INTO the region as a RuntimeWorld.

  const handleSystemAction = useCallback((action: SystemMenuAction) => {
    closeBothMenus();
    if (action === 'dr-eams')       { openDrEams(); return; }
    if (action === 'go-home')       { handleHome(); return; }
    if (action === 'settings')      { openInSurface('settings');             return; }
    if (action === 'account')       { openInSurface('profile');              return; }
    if (action === 'profiles')      { openInSurface('profile');              return; }
    if (action === 'feed-settings') { openInSurface('feed-settings');        return; }
    if (action === 'connectors')    { openInSurface('connectors');           return; }
    if (action === 'marketplace')   { openInSurface('marketplace');          return; }
    if (action === 'appearance')    { openInSurface('settings/appearance');  return; }
  }, [closeBothMenus, openDrEams, handleHome, openInSurface]);

  // ── Runtime bridge (only active when HomeSystem is mounted) ───────────────

  const onRuntimeModeChange  = runtimeCallbacks?.modeChange  ?? undefined;
  const onRuntimeBlendChange = runtimeCallbacks?.blendChange ?? undefined;

  // ── Hide on public / pre-login routes ────────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) return null;

  return (
    <>
      <DreamDMBar
        onHome={handleHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={handleHomeDreamSpace}
        onRuntimeModeChange={onRuntimeModeChange}
        onRuntimeBlendChange={onRuntimeBlendChange}
      />

      <DualBottomMenu
        open={bothMenusOpen}
        onClose={closeBothMenus}
        onSystemAction={handleSystemAction}
      />

      {drEamsOpen && <DrEamsPanel onClose={closeDrEams} />}
    </>
  );
}
