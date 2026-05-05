'use client';

import React, { useCallback, useEffect } from 'react';
import { useDualRuntime } from '@/components/runtime/dream.DualRuntimeContainer';
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

/**
 * DreamBarDataBridge — pure data/callback provider for the DreamDM Bar.
 *
 * Runs on the /homedream route. Pushes server-fetched homeData into
 * DreamSystemContext so PersistentDreamBar (the true home container in
 * layout.tsx) can render the Surface Space / DreamSpace region divs.
 * Returns null — no layout output of its own.
 *
 * Per Bar Ownership Law §0 (docs/LAW.md): the DreamDM Bar IS home.
 * This component is purely a data bridge — it has no UI of its own.
 */
export default function DreamBarDataBridge({
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
    splitRatio,
    setSplitRatio,
    isBarMinimized,
    setIsBarMinimized,
    setHomeData,
  } = useDreamSystem();

  // Push server-fetched data into context so PersistentDreamBar can render it.
  useEffect(() => {
    setHomeData({ userId, profile: profile ?? null, initialPosts, isAdmin: isAdmin ?? false });
    return () => setHomeData(null);
  }, [userId, profile, initialPosts, isAdmin, setHomeData]);

  // Auth listener — redirect on sign-out
  useEffect(() => {
    const sb = createClient();
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = sb.auth.onAuthStateChange((event: string) => {
        if (event === 'SIGNED_OUT') {
          (window.top ?? window).location.href = '/login';
        }
      });
      subscription = result?.data?.subscription ?? null;
    } catch {
      // Supabase not configured / unavailable — skip the listener rather than
      // letting the throw bubble to error.tsx (which would replace the whole
      // post-login UI with the themed error page, appearing as a solid orange
      // screen on sunset/sunrise themes).
    }
    return () => subscription?.unsubscribe();
  }, []);

  const revealSplitRuntime = useCallback((nextRatio = DEFAULT_WORKFLOW_SPLIT) => {
    setIsBarMinimized(false);
    setSplitRatio((current) => {
      if (current >= 0.98 || current <= 0.02) {
        return nextRatio;
      }
      return current;
    });
  }, [setIsBarMinimized, setSplitRatio]);

  const returnHome = useCallback(() => {
    dualRuntime.goToHome();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
    closeBothMenus();
    closeDrEams();
  }, [closeBothMenus, closeDrEams, dualRuntime, revealSplitRuntime]);

  const openHomeDreamSpace = useCallback(() => {
    dualRuntime.goToHomeDreamSpace();
    revealSplitRuntime(DEFAULT_WORKFLOW_SPLIT);
  }, [dualRuntime, revealSplitRuntime]);

  /**
   * Smart-Home counterpart: make DreamSpace the dominant runtime.
   * Bound to the Home action when the DreamDM Bar is dragged toward the top
   * (DreamSpace dominant). Resets DreamSpace world to its default panel and
   * forces the dominance flag so the user always lands on the dreams home.
   */
  const returnDreamSpace = useCallback(() => {
    dualRuntime.setBottomRuntime('DreamSpace');
    dualRuntime.setDominantRuntime('DreamSpace');
    setIsBarMinimized(false);
    setSplitRatio((current) => (current >= 0.5 ? 0.25 : current));
    closeBothMenus();
    closeDrEams();
  }, [closeBothMenus, closeDrEams, dualRuntime, setIsBarMinimized, setSplitRatio]);

  const openInSurface = useCallback((id: SystemPanelId) => {
    dualRuntime.setTopRuntime({ type: 'panel', name: id });
    revealSplitRuntime(Math.max(splitRatio, 0.5));
  }, [dualRuntime, revealSplitRuntime, splitRatio]);

  useEffect(() => {
    registerRuntimeCallbacks({
      returnHome,
      openInSurface,
      openHomeDreamSpace,
      returnDreamSpace,
    });
    return unregisterRuntimeCallbacks;
  }, [openHomeDreamSpace, openInSurface, registerRuntimeCallbacks, returnDreamSpace, returnHome, unregisterRuntimeCallbacks]);

  // Dominant-region effect — keeps DualRuntime state in sync with the seam position
  useEffect(() => {
    if (splitRatio >= 0.55) {
      dualRuntime.setDominantRuntime('Surface Space');
      return;
    }
    if (splitRatio <= 0.45) {
      dualRuntime.setDominantRuntime('DreamSpace');
    }
  }, [dualRuntime, splitRatio]);

  // Publish runtime context to the dreamOSBus so other surfaces can react
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

  // Seam-Y dispatcher — keeps EnginDispatcher in sync with the seam position
  useEffect(() => {
    const dispatcher = EnginDispatcher.getInstance();
    const updateSeam = () => {
      const vh = window.innerHeight;
      const dividerHeight = isBarMinimized ? 0 : DIVIDER_H;
      const seamY = Math.round(((vh - dividerHeight) * splitRatio) + dividerHeight / 2);
      dispatcher.setDreamDMBarY(seamY);
    };

    updateSeam();
    window.addEventListener('resize', updateSeam);
    return () => window.removeEventListener('resize', updateSeam);
  }, [isBarMinimized, splitRatio]);

  return null;
}
