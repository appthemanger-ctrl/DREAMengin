'use client';

/**
 * GlobalDreamBar — root-level shell for DreamDMBar + DualBottomMenu + DrEamsPanel.
 *
 * Rendered once in app/layout.tsx so the bar and menus persist across every
 * surface (route) without remounting.  HomeSystem registers its runtime
 * callbacks (blend, mode, returnHome) via DreamSystemContext so the bar can
 * still drive the dual-runtime view when the home surface is active.
 */

import { useCallback }                              from 'react';
import { useRouter }                                from 'next/navigation';
import DreamDMBar                                   from '@/components/messaging/DreamDMBar';
import DualBottomMenu, { type SystemMenuAction }    from '@/components/menus/DualBottomMenu';
import DrEamsPanel                                  from '@/components/dreamengin/DrEamsPanel';
import { useDreamSystem }                           from '@/lib/dreamdm/DreamSystemContext';

export default function GlobalDreamBar() {
  const router = useRouter();

  const {
    bothMenusOpen,
    openBothMenus,
    closeBothMenus,
    drEamsOpen,
    openDrEams,
    closeDrEams,
    runtimeCallbacks,
  } = useDreamSystem();

  // ── Gold button: single-tap → menus, double-tap → home ───────────────────

  const handleHome = useCallback(() => {
    closeBothMenus();
    closeDrEams();
    if (runtimeCallbacks) {
      // HomeSystem is active — use its returnHome (resets dual-runtime)
      runtimeCallbacks.returnHome();
    } else {
      // Any other surface — navigate to home
      router.push('/');
    }
  }, [closeBothMenus, closeDrEams, runtimeCallbacks, router]);

  // ── System menu actions ───────────────────────────────────────────────────

  const handleSystemAction = useCallback((action: SystemMenuAction) => {
    closeBothMenus();
    if (action === 'dr-eams')       { openDrEams(); return; }
    if (action === 'settings')      { router.push('/settings'); return; }
    if (action === 'account')       { router.push('/edit-profiledream'); return; }
    if (action === 'profiles')      { router.push('/edit-profiledream'); return; }
    if (action === 'feed-settings') { router.push('/feed-settings'); return; }
    if (action === 'connectors')    { router.push('/connectors'); return; }
    if (action === 'marketplace')   { router.push('/marketplace'); return; }
    if (action === 'appearance')    { router.push('/settings'); return; }
    if (action === 'go-home')       { handleHome(); return; }
  }, [closeBothMenus, openDrEams, handleHome, router]);

  // ── Runtime bridge (only active when HomeSystem is mounted) ───────────────

  const onRuntimeModeChange  = runtimeCallbacks?.modeChange  ?? undefined;
  const onRuntimeBlendChange = runtimeCallbacks?.blendChange ?? undefined;

  return (
    <>
      <DreamDMBar
        onHome={handleHome}
        onBothMenus={openBothMenus}
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
