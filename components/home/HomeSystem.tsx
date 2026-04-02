'use client';

/**
 * HomeSystem — Dual-runtime spatial hinge layout.
 *
 * Renders two independent runtime regions (Surface Space above, DreamSpace below)
 * separated by the DreamDM Bar acting as a true spatial divider.
 *
 * Both WebGPU/Babylon.js contexts are mounted and interactive at all times.
 * Dragging the bar resizes both regions in real time with snap points:
 *   0.9 → Surface focus (90 % top / 10 % bottom)
 *   0.5 → Balanced (50 / 50)
 *   0.1 → Dream focus (10 % top / 90 % bottom)
 *
 * Architecture justification: ARCHITECTURE.md §1 (Runtime regions) + §10 (render-on-demand).
 * Performance: both contexts stay alive — no unmount/remount on resize.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import DreamDMBar from '@/components/messaging/DreamDMBar';
import { DIVIDER_H, DEFAULT_SPLIT_RATIO } from '@/lib/dreamdm/barInteractions';
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

  /**
   * splitRatio: fraction of the available viewport height given to Surface Space.
   *   0.9 → 90 % Surface Space / 10 % DreamSpace  (default — Surface focus)
   *   0.5 → 50 / 50 balanced
   *   0.1 → 10 % Surface Space / 90 % DreamSpace  (Dream focus)
   *
   * The DreamDM Bar occupies DIVIDER_H px in the middle at all times.
   */
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isBarMinimized, setIsBarMinimized] = useState(false);

  // Keep dominantRegion in sync with splitRatio so world-navigation callbacks
  // still work as expected (they read dualRuntime.state.dominantRegion).
  const prevRatioRef = useRef(DEFAULT_SPLIT_RATIO);
  useEffect(() => {
    const prev = prevRatioRef.current;
    prevRatioRef.current = splitRatio;
    if (splitRatio === prev) return;
    if (splitRatio > 0.5 && dualRuntime.state.dominantRegion !== 'Surface Space') {
      dualRuntime.setDominantRuntime('Surface Space');
    } else if (splitRatio < 0.5 && dualRuntime.state.dominantRegion !== 'DreamSpace') {
      dualRuntime.setDominantRuntime('DreamSpace');
    }
  }, [splitRatio, dualRuntime]);

  // ── Return to HomeDream Surface ──────────────────────────────────────────

  const returnHome = useCallback(() => {
    const wasHomeActive = dualRuntime.isHomeActive();
    dualRuntime.goToHome();
    closeBothMenus();
    closeDrEams();
    // Snap to Surface focus so the user can see HomeDream prominently.
    setSplitRatio(DEFAULT_SPLIT_RATIO);
    if (wasHomeActive) {
      console.log('[HomeSystem] Refreshing Home (already active)');
    }
  }, [dualRuntime, closeBothMenus, closeDrEams]);

  // ── World navigation callbacks ────────────────────────────────────────────

  const openDreamSpace = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
    dualRuntime.setDominantRuntime('DreamSpace');
    setSplitRatio(0.1); // Dream focus
  }, [dualRuntime]);

  const openDreamSpaceInSurface = useCallback(() => {
    dualRuntime.goToDreamSpace();
    setSplitRatio(DEFAULT_SPLIT_RATIO);
  }, [dualRuntime]);

  const openHomeDreamSpace = useCallback(() => {
    dualRuntime.goToHomeDreamSpace();
    setSplitRatio(0.1); // DreamSpace gets dominant share
  }, [dualRuntime]);

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

  // Wire Dr. Eams panel open — used by WorkspaceDashboard search bar and agent cards.
  const { openDrEams } = useDreamSystem();

  // ── Layout geometry ───────────────────────────────────────────────────────
  // Available height for the two runtime regions (viewport minus the fixed divider bar).
  // When the DreamDM Bar is hidden, the first runtime should reclaim the full viewport.
  const availFraction = splitRatio;          // 0..1
  const availableRuntimeHeight = isBarMinimized ? '100dvh' : `(100dvh - ${DIVIDER_H}px)`;
  const surfaceHeight = isBarMinimized
    ? '100dvh'
    : `calc(${availFraction} * ${availableRuntimeHeight})`;
  const dreamHeight = isBarMinimized
    ? '0px'
    : `calc(${1 - availFraction} * ${availableRuntimeHeight})`;
  // Bar sits at the boundary; its top = surfaceHeight (same calc).
  const barOffsetTop  = isBarMinimized
    ? '100dvh'
    : `calc(${availFraction} * ${availableRuntimeHeight})`;

  return (
    <>
      <StarfieldCanvas />

      {/*
       * Split-screen layout.
       * Surface Space and DreamSpace are positioned as a flex column so both
       * are always rendered and interactive. The fixed-position DreamDM Bar
       * sits between them; region heights are driven by splitRatio so the bar
       * always lands exactly at the boundary.
       *
       * Both contexts remain mounted at all times — no opacity tricks, no
       * pointer-events blocking. This satisfies the "two persistent WebGPU
       * contexts" requirement.
       */}
      <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

        {/* ── Surface Space (top runtime) ──────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: surfaceHeight,
            overflow: 'hidden',
            // Surface Space is always interactive; its perceived "focus" is
            // communicated through size, not opacity.
            zIndex: 1,
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

        {/* ── DreamSpace (bottom runtime) — always mounted, pre-active ── */}
        <div
          style={{
            position: 'absolute',
            top: `calc(${barOffsetTop} + ${DIVIDER_H}px)`,
            left: 0,
            right: 0,
            height: dreamHeight,
            overflow: 'hidden',
            display: isBarMinimized ? 'none' : 'block',
            zIndex: 1,
          }}
        >
          <RuntimeView
            world={dualRuntime.state.dreamSpaceWorld}
            isActive={true}
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
       * DreamDM Bar — the spatial hinge between Surface Space and DreamSpace.
       * position:fixed internally; its top tracks barOffsetTop via splitRatio.
       * Dragging the handle calls onSplitChange which updates splitRatio and
       * immediately resizes both regions without any unmount/remount.
       */}
      <DreamDMBar
        onHome={returnHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={openHomeDreamSpace}
        splitRatio={splitRatio}
        onSplitChange={setSplitRatio}
        onMinimizedChange={setIsBarMinimized}
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
