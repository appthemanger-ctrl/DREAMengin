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
import DualBottomMenu, { type SystemMenuAction }    from '@/components/menus/dream.menu.DualBottomMenu';
import DrEamsPanel                                  from '@/components/dreamengin/dream.panel.DrEamsPanel';
import { useDreamSystem }                           from '@/lib/dreamdm/DreamSystemContext';
import { runHomeAction }                            from '@/lib/home-buttons/contextual-home';
import { isPublicSurfacePath }                      from '@/lib/routing/surfaces';

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
    splitRatio,
    setFocus,
  } = useDreamSystem();

  // -- Go home (from "go-home" menu action) ---------------------------------

  const handleHome = useCallback(() => {
    closeBothMenus();
    closeDrEams();
    // Update world focus to home region — this is the torus "camera back to origin" move.
    setFocus('home');
    // Smart Home — the DreamDM Bar IS home. Bar position decides scope:
    //   bar at bottom  → reset Surface (top runtime) only
    //   bar at top     → reset DreamSpace (bottom runtime) only
    //   bar in middle  → reset both runtimes
    // See lib/home-buttons/contextual-home.ts and docs/ARCHITECTURE.md §1.
    const fired = runHomeAction(splitRatio, runtimeCallbacks);
    if (!fired) {
      // No dual runtime mounted (we're outside /dreamdmbar) — navigate there.
      router.push('/dreamdmbar');
    }
  }, [closeBothMenus, closeDrEams, setFocus, runtimeCallbacks, router, splitRatio]);

  // -- System menu actions — prefer SPA panel when HomeSystem is active,
  //    fall back to route navigation otherwise so links always work.   ------

  const handleSystemAction = useCallback((action: SystemMenuAction) => {
    // NOTE: don't close the menu synchronously here. The PanelItem's onClick
    // already defers `onClose` to the next animation frame so the click that
    // dispatched this action can't be swallowed by the unmount. Closing again
    // here would re-introduce that race on iOS / Android.
    if (action === 'dr-eams')       { openDrEams(); return; }
    if (action === 'go-home')       { handleHome(); return; }

    // When HomeSystem's runtimeCallbacks are registered (user is on /dreamdmbar),
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
  }, [openDrEams, handleHome, openInSurface, runtimeCallbacks, router]);

  // -- Hide on public / pre-login routes ------------------------------------
  if (isPublicSurfacePath(pathname)) return null;

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
