'use client';

/**
 * PersistentDreamBar — Shell-First DreamDMBar wrapper and home container.
 *
 * Also exported as `DreamDMContainer` for architectural clarity.
 * PersistentDreamBar IS the DreamDM Container: the always-mounted shell that
 * owns the dual-runtime split (HomeDream Surface + DreamSpace) and the
 * DreamDM Bar seam between them.
 *
 * The DreamDM Bar IS home. It is never unmounted during navigation and always
 * holds both runtime regions in React's tree:
 *   • HomeDream Surface (top) — shrinks when bar is dragged up
 *   • DreamSpace        (bottom) — shrinks when bar is dragged down
 *
 * VISIBILITY RULE:
 *   Both regions are always MOUNTED (React tree stays alive, state preserved).
 *   They are only VISIBLE + INTERACTIVE when DreamBarDataBridge is active
 *   (i.e. on /homedream). On all other routes they are hidden via display:none
 *   so they never cover page content, but their React state is preserved so
 *   returning to /homedream is instant with no re-mount.
 *
 * BAR MINIMIZE RULE (Bar Ownership Law §0):
 *   Hiding the bar collapses ONLY the bar UI (DIVIDER_H → 0px). Both runtime
 *   regions stay at exactly the split position they held — they do not move.
 *
 * Hidden on public / pre-login routes only.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DreamDMBar from '@/dreamdmbar/dreamsurface.dreamdmbar';
import NeuralSeamCanvas from '@/components/home/dream.NeuralSeamCanvas';
import RuntimeView from '@/components/runtime/dream.RuntimeView';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';
import { parseDreamDragData, surfaceForRuntime, transferDream, type DreamRuntime } from '@/lib/dreams/drag';
import { useDreamLayout } from '@/hooks/useDreamLayout';
import { useOS } from '@/lib/dreamenginOS/OSContext';

/** Routes where the bar must NOT appear (pre-login / public surfaces). */
const PUBLIC_ROUTES = ['/', '/login', '/join', '/policy', '/about'];

const DEFAULT_WORKFLOW_SPLIT = 0.5;

export default function PersistentDreamBar() {
  const pathname    = usePathname();
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
  const os = useOS();
  const { layout, updateDreamLayout } = useDreamLayout();

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── All callbacks before any early return (Rules of Hooks) ───────────────

  const revealSplitRuntime = useCallback((nextRatio = DEFAULT_WORKFLOW_SPLIT) => {
    setIsBarMinimized(false);
    setSplitRatio((current) => {
      if (current >= 0.98 || current <= 0.02) return nextRatio;
      return current;
    });
  }, [setIsBarMinimized, setSplitRatio]);

  const handleHomeDreamSpace = useCallback(() => {
    if (runtimeCallbacks?.openHomeDreamSpace) {
      runtimeCallbacks.openHomeDreamSpace();
    } else {
      dualRuntime.goToHomeDreamSpace();
      revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
    }
  }, [runtimeCallbacks, dualRuntime, revealSplitRuntime]);

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

  const handleDreamDrop = useCallback((event: React.DragEvent<HTMLDivElement>, toRuntime: DreamRuntime) => {
    const raw = event.dataTransfer.getData('application/x-dreamengin-dream')
      || event.dataTransfer.getData('text/plain');
    const dreamData = parseDreamDragData(raw);
    if (!dreamData) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const position = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) };
    const toSurface = surfaceForRuntime(toRuntime);
    const fromRuntime = dreamData.runtime;
    void transferDream({ ...dreamData, runtime: toRuntime, surface: toSurface, position }, fromRuntime, toRuntime, position);
    os.bus.emit('dream:transfer', { dreamData, fromRuntime, toRuntime, position });
    const fromSurface = dreamData.surface;
    const nextLayout = {
      home: { dreams: layout.home.dreams.filter((id) => id !== dreamData.dream_id) },
      dreamspace: { dreams: layout.dreamspace.dreams.filter((id) => id !== dreamData.dream_id) },
    };
    nextLayout[toSurface].dreams = [...nextLayout[toSurface].dreams, dreamData.dream_id];
    if (fromSurface !== toSurface) {
      updateDreamLayout(nextLayout);
    }
  }, [layout, os.bus, updateDreamLayout]);

  const swapDreamRuntimes = useCallback(() => {
    const nextLayout = {
      home: { dreams: layout.dreamspace.dreams },
      dreamspace: { dreams: layout.home.dreams },
      hidden: layout.hidden ?? [],
    };
    void fetch('/api/dreams/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreamData: { dream_id: '__swap__', type: 'runtime-swap' }, fromRuntime: 'HOME', toRuntime: 'FACE', swap: true }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Runtime swap failed');
        updateDreamLayout(nextLayout, 0);
        os.bus.emit('dream:transfer', {
          gesture: 'swap-runtimes',
          home: nextLayout.home.dreams,
          dreamspace: nextLayout.dreamspace.dreams,
        });
        window.dispatchEvent(new CustomEvent('dream:transfer', {
          detail: { gesture: 'swap-runtimes', home: nextLayout.home.dreams, dreamspace: nextLayout.dreamspace.dreams },
        }));
      })
      .catch((error) => console.error('[Dream runtime swap]', error));
  }, [layout.dreamspace.dreams, layout.hidden, layout.home.dreams, os.bus, updateDreamLayout]);

  // Hide on public / pre-login surfaces only
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  // isHomeActive: DreamBarDataBridge is mounted → regions visible + bar in divider mode.
  // When false: regions are display:none (mounted but invisible) + bar is nav-rail mode.
  const isHomeActive = runtimeCallbacks !== null;

  // ── Layout ────────────────────────────────────────────────────────────────
  //
  // Bar minimize rule: collapsing the bar means DIVIDER_H → 0. The region
  // CSS heights still reference splitRatio so both runtimes stay at their
  // exact positions. Only the bar strip itself disappears.
  const dividerHeight   = isBarMinimized ? 0 : DIVIDER_H;
  const runtimeSplitRatio = splitRatio;
  const topHeight       = `calc((100% - ${dividerHeight}px) * ${runtimeSplitRatio})`;
  const bottomRegionTop = `calc(${topHeight} + ${dividerHeight}px)`;
  const bottomHeight    = `calc(100% - ${bottomRegionTop})`;
  const seamOffset      = viewportHeight > 0
    ? Math.round(((viewportHeight - dividerHeight) * runtimeSplitRatio) + dividerHeight / 2)
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <NeuralSeamCanvas active={isHomeActive} splitRatio={splitRatio} />

      {/* ── HomeDream Surface (top runtime) ──────────────────────────────────
          Always MOUNTED in React. display:none when not on /homedream so it
          never covers page content. State preserved across navigation. */}
      <div
        style={{
          display: isHomeActive ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: topHeight,
          zIndex: 1,
          overflow: 'hidden',
          borderBottom: isBarMinimized ? '1px solid rgba(93,232,255,0.12)' : 'none',
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDreamDrop(event, 'HOME')}
      >
        {homeData && (
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
        )}
      </div>

      {/* ── DreamDM Bar (the seam) ────────────────────────────────────────────
          Split props only wired when isHomeActive so the bar stays as a
          simple nav-rail on other pages (no seam, no divider mode touch capture). */}
      <DreamDMBar
        onBothMenus={openBothMenus}
        splitRatio={isHomeActive ? splitRatio : undefined}
        onSplitChange={isHomeActive ? setSplitRatio : undefined}
        onMinimizedChange={isHomeActive ? setIsBarMinimized : undefined}
        onSwapRuntimes={isHomeActive ? swapDreamRuntimes : undefined}
      />

      {/* ── DreamSpace (bottom runtime) ──────────────────────────────────────
          Always MOUNTED in React. display:none when not on /homedream. */}
      <div
        style={{
          display: isHomeActive ? 'block' : 'none',
          position: 'fixed',
          left: 0,
          right: 0,
          top: bottomRegionTop,
          height: bottomHeight,
          zIndex: 1,
          overflow: 'hidden',
          borderTop: isBarMinimized ? '1px solid rgba(232,192,64,0.1)' : 'none',
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDreamDrop(event, 'FACE')}
      >
        {homeData && (
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
        )}
      </div>
    </>
  );
}

/**
 * DreamDMContainer — canonical architectural alias for PersistentDreamBar.
 *
 * PersistentDreamBar is the implementation name; DreamDMContainer is the
 * architectural name used in diagrams and specs. Both refer to the same
 * always-mounted shell component that owns the dual-runtime split and the
 * DreamDM Bar seam.
 *
 * Usage:
 *   import PersistentDreamBar from '@/components/home/dream.bar.PersistentDreamBar';
 *   // or (named import)
 *   import { DreamDMContainer } from '@/components/home/dream.bar.PersistentDreamBar';
 */
export const DreamDMContainer = PersistentDreamBar;
