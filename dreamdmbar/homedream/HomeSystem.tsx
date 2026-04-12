'use client';

import React, { useCallback, useEffect } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { SystemPanelId } from '@/lib/panels/panelTypes';
import { createClient } from '@/lib/supabase/client';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';
import { EnginDispatcher } from '@/lib/runtime/EnginDispatcher';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';

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

  return (
    <>
      <StarfieldCanvas />

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
