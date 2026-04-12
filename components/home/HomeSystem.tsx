'use client';

/**
 * components/home/HomeSystem.tsx
 *
 * Canonical reference copy of HomeSystem — kept in sync with
 * dreamdmbar/homedream/HomeSystem.tsx for test readability.
 *
 * Shell-First architecture: DreamDMBar is no longer rendered here.
 * It lives in app/layout.tsx via PersistentDreamBar so it is never
 * unmounted during client-side navigation.
 *
 * splitRatio and isBarMinimized are shared via DreamSystemContext
 * so the persistent bar and HomeSystem stay in sync.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId } from '@/lib/panels/panelTypes';
import { createClient } from '@/lib/supabase/client';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';
import { EnginDispatcher } from '@/lib/runtime/EnginDispatcher';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import { seamClipboard, type SeamClipboardMimeType } from '@/lib/runtime/seamClipboard';
import { RUNTIME_REGIONS } from '@/lib/identity/canonical-names';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

const DEFAULT_WORKFLOW_SPLIT = 0.5;

function HomeSystemInner({
  userId,
  profile,
  initialPosts,
  isAdmin,
}: {
  userId: string;
  profile: ProfileLike | null;
  initialPosts: any[];
  isAdmin?: boolean;
}) {
  const dualRuntime = useDualRuntime();
  const {
    registerRuntimeCallbacks,
    unregisterRuntimeCallbacks,
    closeBothMenus,
    closeDrEams,
    openDrEams,
    splitRatio,
    setSplitRatio,
    isBarMinimized,
    setIsBarMinimized,
  } = useDreamSystem();
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [seamDragOver, setSeamDragOver] = useState<boolean>(false);

  useEffect(() => {
    const sb = createClient();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        (window.top ?? window).location.href = '/login';
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const revealSplitRuntime = useCallback((nextRatio = DEFAULT_WORKFLOW_SPLIT) => {
    setIsBarMinimized(false);
    setSplitRatio((current) => {
      if (current >= 0.98 || current <= 0.02) {
        return nextRatio;
      }
      return current;
    });
  }, []);

  const returnHome = useCallback(() => {
    dualRuntime.goToHome();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
    closeBothMenus();
    closeDrEams();
  }, [closeBothMenus, closeDrEams, dualRuntime, revealSplitRuntime]);

  const openDreamSpaceInSurface = useCallback(() => {
    dualRuntime.goToDreamSpace();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
  }, [dualRuntime, revealSplitRuntime]);

  const openHomeDreamSpace = useCallback(() => {
    dualRuntime.goToHomeDreamSpace();
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

  const openInSurface = useCallback((id: SystemPanelId) => {
    dualRuntime.setTopRuntime({ type: 'panel', name: id });
    revealSplitRuntime(Math.max(splitRatio, 0.5));
  }, [dualRuntime, revealSplitRuntime, splitRatio]);

  useEffect(() => {
    registerRuntimeCallbacks({
      returnHome,
      openInSurface,
      openHomeDreamSpace,
    });
    return unregisterRuntimeCallbacks;
  }, [openHomeDreamSpace, openInSurface, registerRuntimeCallbacks, returnHome, unregisterRuntimeCallbacks]);

  useEffect(() => {
    if (splitRatio >= 0.55) {
      dualRuntime.setDominantRuntime('Surface Space');
      return;
    }
    if (splitRatio <= 0.45) {
      dualRuntime.setDominantRuntime('DreamSpace');
    }
  }, [dualRuntime, splitRatio]);

  useEffect(() => {
    dreamOSBus.publishRuntimeContext({
      region: 'Surface Space',
      world: dualRuntime.state.surfaceSpaceWorld,
      splitRatio,
      dominant: dualRuntime.state.dominantRegion === 'Surface Space',
    });
    dreamOSBus.publishRuntimeContext({
      region: 'DreamSpace',
      world: dualRuntime.state.dreamSpaceWorld,
      splitRatio: 1 - splitRatio,
      dominant: dualRuntime.state.dominantRegion === 'DreamSpace',
    });
  }, [
    dualRuntime.state.dominantRegion,
    dualRuntime.state.dreamSpaceWorld,
    dualRuntime.state.surfaceSpaceWorld,
    splitRatio,
  ]);

  useEffect(() => {
    const dispatcher = EnginDispatcher.getInstance();
    const updateSeam = () => {
      const viewportHeight = window.innerHeight;
      setViewportHeight(viewportHeight);
      const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;
      const seamY = Math.round(((viewportHeight - dividerHeight) * splitRatio) + dividerHeight / 2);
      dispatcher.setDreamDMBarY(seamY);
    };

    updateSeam();
    window.addEventListener('resize', updateSeam);
    return () => window.removeEventListener('resize', updateSeam);
  }, [isBarMinimized, splitRatio]);

  const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;
  const topHeight = `calc((100% - ${dividerHeight}px) * ${splitRatio})`;
  const bottomRegionTop = `calc(${topHeight} + ${dividerHeight}px)`;
  const bottomHeight = `calc(100% - ${bottomRegionTop})`;
  const seamOffset =
    viewportHeight > 0
      ? Math.round(((viewportHeight - dividerHeight) * splitRatio) + dividerHeight / 2)
      : undefined;

  // ── Seam drop zone handlers ──────────────────────────────────────────────────

  const handleSeamDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSeamDragOver(true);
  }, []);

  const handleSeamDragLeave = useCallback(() => {
    setSeamDragOver(false);
  }, []);

  const handleSeamDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Try application/x-dream-artifact first — richest payload type.
      const artifactData = e.dataTransfer.getData('application/x-dream-artifact');
      const textData = e.dataTransfer.getData('text/plain');
      const content = artifactData || textData;
      const mimeType: SeamClipboardMimeType = artifactData
        ? 'application/x-dream-artifact'
        : 'text/plain';
      // Determine which region the drag originated from based on Y position
      // relative to the seam centre. Fall back to a proportional estimate when
      // viewportHeight hasn't been measured yet.
      const seamY = seamOffset ?? Math.round(viewportHeight * splitRatio);
      const sourceRegion =
        e.clientY < seamY
          ? RUNTIME_REGIONS.SURFACE_SPACE
          : RUNTIME_REGIONS.DREAM_SPACE;
      const targetRegion =
        sourceRegion === RUNTIME_REGIONS.SURFACE_SPACE
          ? RUNTIME_REGIONS.DREAM_SPACE
          : RUNTIME_REGIONS.SURFACE_SPACE;
      // Route through the workflow registry + broadcast on the bus.
      seamClipboard.set({ content, mimeType, sourceRegion, targetRegion });
      setSeamDragOver(false);
    },
    [seamOffset, viewportHeight, splitRatio],
  );

  return (
    <>

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
          profile={profile}
          posts={initialPosts}
          isAdmin={isAdmin}
          onOpenDrEams={openDrEams}
          onOpenDreamSpace={openDreamSpaceInSurface}
          onOpenInRegion={openInSurfaceRegion}
          onBackFromRegion={backFromSurfaceRegion}
          seamOffsetPx={seamOffset}
          splitRatio={splitRatio}
          seamVisible={!isBarMinimized}
          dominantRegion={dualRuntime.state.dominantRegion}
        />
      </div>

      {/* ── Seam drop zone — transparent, sits exactly over the DreamDM Bar seam.
           Drag artifacts through here to trigger cross-engin workflow routing.
           No visual styling: the bus activity IS the feedback.          ── */}
      <div
        aria-hidden="true"
        data-seam-drop-zone={seamDragOver ? 'active' : 'idle'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: topHeight,
          height: `${dividerHeight}px`,
          zIndex: 10,
        }}
        onDragOver={handleSeamDragOver}
        onDrop={handleSeamDrop}
        onDragLeave={handleSeamDragLeave}
      />

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
          profile={profile}
          posts={initialPosts}
          isAdmin={isAdmin}
          onOpenDrEams={openDrEams}
          onOpenDreamSpace={openHomeDreamSpace}
          onOpenInRegion={openInDreamRegion}
          onBackFromRegion={backFromDreamRegion}
          seamOffsetPx={seamOffset}
          splitRatio={splitRatio}
          seamVisible={!isBarMinimized}
          dominantRegion={dualRuntime.state.dominantRegion}
        />
      </div>
    </>
  );
}

export default function HomeSystem({
  userId,
  profile,
  initialPosts,
  isAdmin,
}: {
  userId: string;
  profile: ProfileLike | null;
  initialPosts: any[];
  isAdmin?: boolean;
}) {
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
