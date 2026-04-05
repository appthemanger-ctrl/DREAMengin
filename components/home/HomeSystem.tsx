'use client';

/**
 * HomeSystem — Full-screen Surface Space with floating DreamDM Bar.
 *
 * The bar is NOT a spatial divider. It floats as a position:fixed component
 * (z-index 100) above the full-screen Surface Space (z-index 1). DreamSpace
 * content is accessed through top-runtime navigation (replacing Surface Space
 * content), not as a persistent split-screen panel.
 *
 * Layout (bottom → top, in stacking order):
 *   1. StarfieldCanvas  — background
 *   2. Surface Space    — full viewport, the HomeDream feed and all panels
 *   3. DreamDM Bar      — position:fixed, always floating above content
 *
 * Architecture justification: ARCHITECTURE.md §1 (Runtime regions) + §10.
 */

import React, { useCallback, useEffect } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import DreamDMBar from '@/components/messaging/DreamDMBar';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId } from '@/lib/panels/panelTypes';
import { createClient } from '@/lib/supabase/client';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// Inner component that uses the dual runtime context
function HomeSystemInner({ userId, profile, initialPosts, isAdmin }: { userId: string; profile: ProfileLike | null; initialPosts: any[]; isAdmin?: boolean }) {
  const dualRuntime = useDualRuntime();
  const {
    registerRuntimeCallbacks,
    unregisterRuntimeCallbacks,
    closeBothMenus,
    closeDrEams,
    openBothMenus,
    openDrEams,
  } = useDreamSystem();

  // ── Global auth guard: if either runtime or any in-region iframe signs out,
  //    redirect the entire top-level window to /login immediately.
  //    Supabase shares its session via localStorage, so a signOut() call from
  //    any same-origin iframe fires SIGNED_OUT here too.
  useEffect(() => {
    const sb = createClient();
    const { data: { subscription } } = sb.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        (window.top ?? window).location.href = '/login';
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Return to HomeDream Surface ──────────────────────────────────────────

  const returnHome = useCallback(() => {
    dualRuntime.goToHome();
    closeBothMenus();
    closeDrEams();
  }, [dualRuntime, closeBothMenus, closeDrEams]);

  // ── World navigation callbacks ────────────────────────────────────────────

  /** Open DreamSpace content within Surface Space (replaces the top runtime). */
  const openDreamSpaceInSurface = useCallback(() => {
    dualRuntime.goToDreamSpace();
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  /**
   * Double-tap gold button while bar is pinned at the top.
   * Without a persistent DreamSpace panel, just return to HomeDream.
   */
  const openHomeDreamSpace = useCallback(() => {
    returnHome();
  }, [returnHome]);

  const openInSurfaceRegion = useCallback((path: string) => {
    dualRuntime.setTopRuntime({ type: 'custom', path });
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  const backFromSurfaceRegion = useCallback(() => {
    dualRuntime.setTopRuntime('HomeDream Surface');
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  // ── Open a system panel in Surface Space (called from global menus) ───────

  const openInSurface = useCallback((id: SystemPanelId) => {
    dualRuntime.setTopRuntime({ type: 'panel', name: id });
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  // Register only the callbacks that GlobalDreamBar's overlay menus still need
  useEffect(() => {
    registerRuntimeCallbacks({
      returnHome,
      openInSurface,
    });
    return unregisterRuntimeCallbacks;
  }, [returnHome, openInSurface, registerRuntimeCallbacks, unregisterRuntimeCallbacks]);

  return (
    <>
      <StarfieldCanvas />

      {/*
       * Surface Space — fills the entire viewport behind the floating bar.
       *
       * z-index: 1 so the DreamDM Bar (z-index 100+, position:fixed) always
       * floats above this region regardless of what RuntimeShell renders inside.
       *
       * The bar reports its height via onBarInsets so content components can
       * add the appropriate bottom padding if needed.
       */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <RuntimeView
          world={dualRuntime.state.surfaceSpaceWorld}
          isActive={true}
          profile={profile}
          posts={initialPosts}
          isAdmin={isAdmin}
          onOpenDrEams={openDrEams}
          onOpenDreamSpace={openDreamSpaceInSurface}
          onOpenInRegion={openInSurfaceRegion}
          onBackFromRegion={backFromSurfaceRegion}
        />
      </div>

      {/*
       * DreamDM Bar — the floating search + messaging command center.
       *
       * Runs in its natural bottom-sheet mode — NOT as a spatial screen divider.
       * Drag up → expands to show messages / search / Dr. Eams.
       * Drag back down → collapses to rest height at the screen bottom.
       * Only an intentional velocity fling can pin it to the top.
       */}
      <DreamDMBar
        onHome={returnHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={openHomeDreamSpace}
      />
    </>
  );
}

// Main export wraps with DualRuntimeContainer

export default function HomeSystem({ userId, profile, initialPosts, isAdmin }: { userId: string; profile: ProfileLike | null; initialPosts: any[]; isAdmin?: boolean }) {
  return (
    <DualRuntimeContainer>
      {() => (
        <HomeSystemInner
          userId={userId}
          profile={profile}
          initialPosts={initialPosts}
          isAdmin={isAdmin}
        />
      )}
    </DualRuntimeContainer>
  );
}
