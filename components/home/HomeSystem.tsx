'use client';

import React, { useCallback, useState } from 'react';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import DualBottomMenu, { type SystemMenuAction } from '@/components/menus/DualBottomMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import DreamDMBar from '@/components/messaging/DreamDMBar';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// Inner component that uses the dual runtime context
function HomeSystemInner({ userId, profile, initialPosts, isAdmin }: { userId: string; profile: ProfileLike | null; initialPosts: any[]; isAdmin?: boolean }) {
  const dualRuntime = useDualRuntime();

  const [bothMenusOpen, setBothMenusOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen]       = useState(false);
  const [barBlend, setBarBlend]           = useState(0);

  const closeAllMenus = useCallback(() => {
    setBothMenusOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    // Check if Home is already the active top runtime
    const wasHomeActive = dualRuntime.isHomeActive();

    // Make Home the active top runtime (or refresh if already active)
    dualRuntime.goToHome();

    closeAllMenus();
    setDrEamsOpen(false);
    setBarBlend(0);

    // If Home was already active, this acts as a "refresh"
    if (wasHomeActive) {
      console.log('[HomeSystem] Refreshing Home (already active)');
    }
  }, [closeAllMenus, dualRuntime]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    closeAllMenus();
    if (action === 'dr-eams')       { setDrEamsOpen(true); return; }
    if (action === 'settings')      { window.location.href = '/settings'; return; }
    if (action === 'account')       { window.location.href = '/edit-profiledream'; return; }
    if (action === 'profiles')      { window.location.href = '/edit-profiledream'; return; }
    if (action === 'feed-settings') { window.location.href = '/feed-settings'; return; }
    if (action === 'connectors')    { window.location.href = '/connectors'; return; }
    if (action === 'marketplace')   { window.location.href = '/marketplace'; return; }
    if (action === 'appearance')    { window.location.href = '/settings'; return; }
    if (action === 'go-home')       { returnHome(); return; }
  }, [closeAllMenus, returnHome]);

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
            onOpenDrEams={() => setDrEamsOpen(true)}
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
            onOpenDrEams={() => setDrEamsOpen(true)}
            onOpenDreamSpace={openDreamSpace}
          />
        </div>
      </div>

      {/* DreamDM Bar — gold button embedded; single-tap opens menus, double-tap goes home */}
      <DreamDMBar
        onHome={returnHome}
        onBothMenus={() => setBothMenusOpen(true)}
        onRuntimeModeChange={handleBarRuntimeMode}
        onRuntimeBlendChange={setBarBlend}
      />

      {/* Dual bottom menu — Daydreams (left) + DreamMenu (right), mobile-first bottom sheet */}
      <DualBottomMenu
        open={bothMenusOpen}
        onClose={closeAllMenus}
        onSystemAction={onSystemAction}
      />

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
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

