'use client';

/**
 * PersistentDreamBar — Shell-First DreamDMBar wrapper and home container.
 *
 * Renders DreamDMBar inside app/layout.tsx so it is NEVER unmounted during
 * client-side navigation. The DreamDM Bar IS the home container — it holds
 * both the HomeDream Surface (top) and DreamSpace (bottom) runtime regions
 * on top of and underneath of them.
 *
 * Behaviour:
 *   - Hidden on public / pre-login routes (landing, login, policy, about).
 *   - When HomeSystem is mounted (/homedream), the bar operates in divider mode:
 *     splitRatio and isBarMinimized come from DreamSystemContext, which
 *     HomeSystem writes. The bar owns the Surface Space / DreamSpace regions.
 *   - On all other authenticated pages, only the DreamDMBar is rendered:
 *     no splitRatio is passed so the bar anchors to the bottom and acts as a
 *     persistent navigation and messaging rail.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DreamDMBar from '@/dreamdmbar/dreamsurface.dreamdmbar';
import NeuralSeamCanvas from '@/components/home/dream.NeuralSeamCanvas';
import RuntimeView from '@/components/runtime/dream.RuntimeView';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { runHomeAction } from '@/lib/home-buttons/contextual-home';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

/** Routes where the bar must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/', '/login', '/join', '/policy', '/about'];

const DEFAULT_WORKFLOW_SPLIT = 0.5;

export default function PersistentDreamBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const dualRuntime = useDualRuntime();
  const {
    openBothMenus,
    openDrEams,
    runtimeCallbacks,
    splitRatio,
    setSplitRatio,
    isBarMinimized,
    setIsBarMinimized,
    homeData,
  } = useDreamSystem();

  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── All callbacks must be declared before any early return (Rules of Hooks) ─

  const handleHome = useCallback(() => {
    // Smart Home — the DreamDM Bar IS home. Bar position decides scope:
    //   bar at bottom  → reset Surface (top runtime) only
    //   bar at top     → reset DreamSpace (bottom runtime) only
    //   bar in middle  → reset both runtimes
    // See lib/home-buttons/contextual-home.ts and docs/ARCHITECTURE.md §1.
    const fired = runHomeAction(splitRatio, runtimeCallbacks);
    if (!fired) {
      // No dual runtime mounted (we're outside /homedream) — navigate there.
      router.push('/homedream');
    }
  }, [runtimeCallbacks, router, splitRatio]);

  const handleHomeDreamSpace = useCallback(() => {
    runtimeCallbacks?.openHomeDreamSpace?.();
  }, [runtimeCallbacks]);

  const revealSplitRuntime = useCallback((nextRatio = DEFAULT_WORKFLOW_SPLIT) => {
    setIsBarMinimized(false);
    setSplitRatio((current) => {
      if (current >= 0.98 || current <= 0.02) {
        return nextRatio;
      }
      return current;
    });
  }, [setIsBarMinimized, setSplitRatio]);

  const openDreamSpaceInSurface = useCallback(() => {
    dualRuntime.goToDreamSpace();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
  }, [dualRuntime, revealSplitRuntime]);

  const openInSurfaceRegion = useCallback((path: string) => {
    dualRuntime.setTopRuntime({ type: 'custom', path });
    revealSplitRuntime(Math.max(splitRatio, 0.5));
  }, [dualRuntime, revealSplitRuntime, splitRatio]);

  const backFromSurfaceRegion = useCallback(() => {
    dualRuntime.setTopRuntime('HomeDream Surface');
  }, [dualRuntime]);

  const openInDreamRegion = useCallback((path: string) => {
    dualRuntime.setBottomRuntime({ type: 'custom', path });
    revealSplitRuntime(Math.min(splitRatio, 0.5));
  }, [dualRuntime, revealSplitRuntime, splitRatio]);

  const backFromDreamRegion = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
  }, [dualRuntime]);

  // Hide on public / pre-login surfaces
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  // Only wire split-mode props and region rendering when the dual runtime (HomeSystem) is active.
  // On other pages the bar anchors to the bottom and acts as a nav rail.
  const isHomeSystemActive = runtimeCallbacks !== null;

  // ── Region layout — non-hook calculations, safe after the early return ──────
  // Per Bar Ownership Law §0 (docs/LAW.md): hiding the bar must NOT change
  // the split ratio and must NOT hide either runtime. Both HomeDream and
  // DreamSpace remain rendered at whatever split they held the moment the
  // bar was hidden, and each continues to scroll independently inside its
  // own frozen region. The bar is the root container that owns both
  // runtimes; hiding it removes only the bar's own UI.
  const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;
  const runtimeSplitRatio = splitRatio;
  const topHeight = `calc((100% - ${dividerHeight}px) * ${runtimeSplitRatio})`;
  const bottomRegionTop = `calc(${topHeight} + ${dividerHeight}px)`;
  const bottomHeight = `calc(100% - ${bottomRegionTop})`;
  const seamOffset =
    viewportHeight > 0
      ? Math.round(((viewportHeight - dividerHeight) * runtimeSplitRatio) + dividerHeight / 2)
      : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <NeuralSeamCanvas active={isHomeSystemActive} splitRatio={splitRatio} />

      {/* ── Surface Space (top runtime region) ──────────────────────────────── */}
      {isHomeSystemActive && homeData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: topHeight,
            zIndex: 1,
            overflow: 'hidden',
            borderBottom: isBarMinimized ? '1px solid rgba(93,232,255,0.12)' : 'none',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.surfaceSpaceWorld}
            isActive={true}
            profile={homeData.profile}
            posts={homeData.initialPosts}
            isAdmin={homeData.isAdmin}
            onOpenDrEams={openDrEams}
            onOpenDreamSpace={openDreamSpaceInSurface}
            onOpenInRegion={openInSurfaceRegion}
            onBackFromRegion={backFromSurfaceRegion}
            seamOffsetPx={seamOffset}
            splitRatio={runtimeSplitRatio}
            seamVisible={!isBarMinimized}
            dominantRegion={dualRuntime.state.dominantRegion}
          />
        </div>
      )}

      {/* ── DreamDM Bar (the seam — holds both regions) ─────────────────────── */}
      <DreamDMBar
        onHome={handleHome}
        onBothMenus={openBothMenus}
        onHomeDreamSpace={isHomeSystemActive ? handleHomeDreamSpace : undefined}
        splitRatio={isHomeSystemActive ? splitRatio : undefined}
        onSplitChange={isHomeSystemActive ? setSplitRatio : undefined}
        onMinimizedChange={isHomeSystemActive ? setIsBarMinimized : undefined}
      />

      {/* ── DreamSpace (bottom runtime region) ──────────────────────────────── */}
      {isHomeSystemActive && homeData && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: bottomRegionTop,
            height: bottomHeight,
            zIndex: 1,
            overflow: 'hidden',
            borderTop: isBarMinimized ? '1px solid rgba(232,192,64,0.1)' : 'none',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.dreamSpaceWorld}
            isActive={true}
            profile={homeData.profile}
            posts={homeData.initialPosts}
            isAdmin={homeData.isAdmin}
            onOpenDrEams={openDrEams}
            onOpenDreamSpace={handleHomeDreamSpace}
            onOpenInRegion={openInDreamRegion}
            onBackFromRegion={backFromDreamRegion}
            seamOffsetPx={seamOffset}
            splitRatio={runtimeSplitRatio}
            seamVisible={!isBarMinimized}
            dominantRegion={dualRuntime.state.dominantRegion}
          />
        </div>
      )}
    </>
  );
}
