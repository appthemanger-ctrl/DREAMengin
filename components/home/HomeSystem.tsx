'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// Inner component that uses the dual runtime context
function HomeSystemInner({ userId, profile, initialPosts, isAdmin }: { userId: string; profile: ProfileLike | null; initialPosts: any[]; isAdmin?: boolean }) {
  const dualRuntime = useDualRuntime();
  const { registerRuntimeCallbacks, unregisterRuntimeCallbacks, closeBothMenus, closeDrEams } = useDreamSystem();

  const [barBlend, setBarBlend] = useState(0);

  const returnHome = useCallback(() => {
    // Check if Home is already the active top runtime
    const wasHomeActive = dualRuntime.isHomeActive();

    // Make Home the active top runtime (or refresh if already active)
    dualRuntime.goToHome();

    closeBothMenus();
    closeDrEams();
    setBarBlend(0);

    // If Home was already active, this acts as a "refresh"
    if (wasHomeActive) {
      console.log('[HomeSystem] Refreshing Home (already active)');
    }
  }, [dualRuntime, closeBothMenus, closeDrEams]);

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

  const openHomeDreamSpace = useCallback(() => {
    // Load HomeDream Surface into the DreamSpace region (bar at top, dual-home).
    // Keeps the bar at the top so the user sees two HomeDream views at once.
    dualRuntime.goToHomeDreamSpace();
    setBarBlend(1);
  }, [dualRuntime]);

  // Register runtime callbacks with the global context so GlobalDreamBar
  // can bridge bar drag/tap events to this dual-runtime view.
  useEffect(() => {
    registerRuntimeCallbacks({
      returnHome,
      modeChange:    handleBarRuntimeMode,
      blendChange:   setBarBlend,
      homeDreamSpace: openHomeDreamSpace,
    });
    return unregisterRuntimeCallbacks;
  }, [returnHome, handleBarRuntimeMode, openHomeDreamSpace, registerRuntimeCallbacks, unregisterRuntimeCallbacks]);

  return (
    <>
      <StarfieldCanvas />

      {/* Dual Runtime Views */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate3d(0,0,0)',
            opacity: 1 - (barBlend * 0.18),
            pointerEvents: dualRuntime.state.dominantRegion === 'Surface Space' ? 'auto' : 'none',
            transition: 'opacity 180ms ease',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.surfaceSpaceWorld}
            isActive={dualRuntime.state.dominantRegion === 'Surface Space'}
            profile={profile}
            posts={initialPosts}
            isAdmin={isAdmin}
            onOpenDrEams={() => {/* DrEams panel is now managed globally via DreamSystemContext */}}
            onOpenDreamSpace={openDreamSpace}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate3d(0, ${(1 - barBlend) * 100}%, 0)`,
            opacity: 0.45 + (barBlend * 0.55),
            pointerEvents: dualRuntime.state.dominantRegion === 'DreamSpace' ? 'auto' : 'none',
            transition: 'transform 180ms ease, opacity 180ms ease',
            willChange: 'transform, opacity',
          }}
        >
          <RuntimeView
            world={dualRuntime.state.dreamSpaceWorld}
            isActive={dualRuntime.state.dominantRegion === 'DreamSpace'}
            profile={profile}
            posts={initialPosts}
            isAdmin={isAdmin}
            onOpenDrEams={() => {/* DrEams panel is now managed globally via DreamSystemContext */}}
            onOpenDreamSpace={openDreamSpace}
          />
        </div>
      </div>
    </>
  );
}

// Main export wraps with DualRuntimeContainer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

