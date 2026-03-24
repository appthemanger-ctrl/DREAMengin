'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import DreamDMBar, { BAR_H } from '@/components/messaging/DreamDMBar';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId } from '@/lib/panels/panelTypes';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// Inner component that uses the dual runtime context
function HomeSystemInner({ userId, profile, initialPosts, isAdmin }: { userId: string; profile: ProfileLike | null; initialPosts: any[]; isAdmin?: boolean }) {
  const dualRuntime = useDualRuntime();
  const { registerRuntimeCallbacks, unregisterRuntimeCallbacks, closeBothMenus, closeDrEams, openBothMenus } = useDreamSystem();

  // barBlend: 0 = bar at bottom (Surface Space dominant), 1 = bar at top (DreamSpace dominant)
  const [barBlend, setBarBlend] = useState(0);

  // barInsets: safe-area pixels the bar occupies at top / bottom of the viewport.
  // Passed to RuntimeShell so content never hides behind the bar.
  // Default: bar is at the bottom at BAR_H (80 px) rest height.
  const [barInsets, setBarInsets] = useState<{ top: number; bottom: number }>({ top: 0, bottom: BAR_H });

  const handleBarInsets = useCallback((top: number, bottom: number) => {
    setBarInsets((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  // ── Return to HomeDream Surface ──────────────────────────────────────────

  const returnHome = useCallback(() => {
    const wasHomeActive = dualRuntime.isHomeActive();
    dualRuntime.goToHome();
    closeBothMenus();
    closeDrEams();
    setBarBlend(0);
    if (wasHomeActive) {
      console.log('[HomeSystem] Refreshing Home (already active)');
    }
  }, [dualRuntime, closeBothMenus, closeDrEams]);

  // ── DreamDMBar: direct callbacks (bar lives here, no context bridge needed) ──

  const handleBarRuntimeMode = useCallback((mode: 'home' | 'blend' | 'dreamspace') => {
    if (mode === 'dreamspace') {
      dualRuntime.setBottomRuntime('DreamSpace');
      dualRuntime.setDominantRuntime('DreamSpace');
      return;
    }
    if (mode === 'home') {
      dualRuntime.setTopRuntime('HomeDream Surface');
      dualRuntime.setDominantRuntime('Surface Space');
    }
  }, [dualRuntime]);

  const openDreamSpace = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
    dualRuntime.setDominantRuntime('DreamSpace');
    setBarBlend(1);
  }, [dualRuntime]);

  // Open DreamSpace world in Surface Space — allows both regions to show
  // DreamsSpacePanel simultaneously (two independent Daydream/Engin sessions).
  const openDreamSpaceInSurface = useCallback(() => {
    dualRuntime.goToDreamSpace();
    setBarBlend(0);
  }, [dualRuntime]);

  // Bar double-tap when at top → load HomeDream into DreamSpace (dual-home)
  const openHomeDreamSpace = useCallback(() => {
    dualRuntime.goToHomeDreamSpace();
    setBarBlend(1);
  }, [dualRuntime]);

  // ── Open a path in the Surface Space region (iframe) ─────────────────────

  const openInSurfaceRegion = useCallback((path: string) => {
    dualRuntime.setTopRuntime({ type: 'custom', path });
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  const backFromSurfaceRegion = useCallback(() => {
    dualRuntime.setTopRuntime('HomeDream Surface');
    dualRuntime.setDominantRuntime('Surface Space');
  }, [dualRuntime]);

  const openInDreamRegion = useCallback((path: string) => {
    dualRuntime.setBottomRuntime({ type: 'custom', path });
    dualRuntime.setDominantRuntime('DreamSpace');
  }, [dualRuntime]);

  const backFromDreamRegion = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
    dualRuntime.setDominantRuntime('DreamSpace');
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

  const isSurfaceDominant = dualRuntime.state.dominantRegion === 'Surface Space';

  // Wire Dr. Eams panel open — used by WorkspaceDashboard search bar and agent cards.
  // Per Phase 6 item 5: onOpenDrEams must call a real action (Constitution Art. II Rule 6).
  // openDrEams is provided by DreamSystemContext which lives in the layout wrapper,
  // so the state is shared with GlobalDreamBar (which renders the DrEamsPanel overlay).
  const { openDrEams } = useDreamSystem();

  return (
    <>
      <StarfieldCanvas />

      {/*
       * Dual runtime container.
       * Both surfaces are ALWAYS mounted (pre-active) — no translateY hide.
       * The DreamDMBar seam sits on top (z-index 102 via its own fixed style).
       * Dominant region gets z-index 2 and full opacity; non-dominant gets
       * z-index 1 and reduced opacity so it is visible but clearly behind.
       *
       * TRUE LAYOUT REFLOW — the region containers themselves are sized to
       * exclude the bar area via top/bottom driven by barInsets. RuntimeShell
       * therefore always receives a box that is exactly the safe area and
       * requires no internal clipping at all.
       */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>

        {/* ── Surface Space (top runtime) ──────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: barInsets.top,
            left: 0,
            right: 0,
            bottom: barInsets.bottom,
            zIndex: isSurfaceDominant ? 2 : 1,
            opacity: isSurfaceDominant ? 1 - (barBlend * 0.18) : 0.4 + (barBlend * 0.3),
            pointerEvents: isSurfaceDominant ? 'auto' : 'none',
            transition: 'opacity 180ms ease',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.surfaceSpaceWorld}
            isActive={isSurfaceDominant}
            profile={profile}
            posts={initialPosts}
            isAdmin={isAdmin}
            onOpenDrEams={openDrEams}
            onOpenDreamSpace={openDreamSpaceInSurface}
            onOpenInRegion={openInSurfaceRegion}
            onBackFromRegion={backFromSurfaceRegion}
          />
        </div>

        {/* ── DreamSpace (bottom runtime) — always mounted, pre-active ── */}
        <div
          style={{
            position: 'absolute',
            top: barInsets.top,
            left: 0,
            right: 0,
            bottom: barInsets.bottom,
            zIndex: isSurfaceDominant ? 1 : 2,
            opacity: isSurfaceDominant ? barBlend : 1,
            pointerEvents: isSurfaceDominant ? 'none' : 'auto',
            transition: 'opacity 180ms ease',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.dreamSpaceWorld}
            isActive={!isSurfaceDominant}
            profile={profile}
            posts={initialPosts}
            isAdmin={isAdmin}
            onOpenDrEams={openDrEams}
            onOpenDreamSpace={openDreamSpace}
            onOpenInRegion={openInDreamRegion}
            onBackFromRegion={backFromDreamRegion}
          />
        </div>
      </div>

      {/*
       * DreamDMBar — the seam between Surface Space and DreamSpace.
       * Lives here (inside HomeSystem) so it only renders when the home
       * surface is mounted. It is NOT in layout.tsx.
       * position:fixed internally — visually overlays both regions.
       */}
      <DreamDMBar
        onHome={returnHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={openHomeDreamSpace}
        onRuntimeModeChange={handleBarRuntimeMode}
        onRuntimeBlendChange={setBarBlend}
        onBarInsets={handleBarInsets}
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
