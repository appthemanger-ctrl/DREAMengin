'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import DualRuntimeContainer, { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';
import RuntimeView from '@/components/runtime/RuntimeView';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import NavIndicator from '@/components/dreamnav/NavIndicator';
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
  const { dispatch, navigateTo, node } = useDreamNav();
  const dualRuntime = useDualRuntime();

  const [bothMenusOpen, setBothMenusOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen]       = useState(false);
  const [coreFace, setCoreFace]           = useState<'home' | 'profile'>('home');
  const [coreOpen, setCoreOpen]           = useState(true);

  // Read showNavIndicator setting from localStorage (default true)
  const [showNavIndicator, setShowNavIndicator] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dreamengin:showNavIndicator');
      if (saved !== null) setShowNavIndicator(saved !== 'false');
    } catch { /* noop */ }
  }, []);

  const closeAllMenus = useCallback(() => {
    setBothMenusOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    // Check if Home is already the active top runtime
    const wasHomeActive = dualRuntime.isHomeActive();

    // Make Home the active top runtime (or refresh if already active)
    dualRuntime.goToHome();

    // Traditional navigation dispatch for backwards compatibility
    dispatch('home');
    closeAllMenus();
    setDrEamsOpen(false);
    setCoreFace('home');
    setCoreOpen(true);

    // If Home was already active, this acts as a "refresh"
    // The spec says: "if Home is already the active top runtime, refresh Home"
    if (wasHomeActive) {
      // Trigger a visual refresh indicator or reload logic here if needed
      console.log('[HomeSystem] Refreshing Home (already active)');
    }
  }, [dispatch, closeAllMenus, dualRuntime]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    closeAllMenus();
    if (action === 'dr-eams')       { setDrEamsOpen(true); return; }
    if (action === 'settings')      { window.location.href = '/settings'; return; }
    if (action === 'account')       { window.location.href = '/edit-profiledream'; return; }
    if (action === 'feed-settings') { window.location.href = '/feed-settings'; return; }
    if (action === 'connectors')    { window.location.href = '/connectors'; return; }
    if (action === 'go-home')       { returnHome(); return; }
  }, [closeAllMenus, returnHome]);

  const handleBarRuntimeMode = useCallback((mode: 'home' | 'blend' | 'dreamspace') => {
    if (mode === 'dreamspace') {
      dualRuntime.setBottomRuntime('dreamspace');
      dualRuntime.setDominantRuntime('bottom');
      return;
    }

    if (mode === 'home') {
      dualRuntime.setTopRuntime('home');
      dualRuntime.setDominantRuntime('top');
    }
  }, [dualRuntime]);

  return (
    <>
      <StarfieldCanvas />
      <NavIndicator node={node} hidden={!showNavIndicator} />

      {/* Dual Runtime Views */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <RuntimeView
          world={dualRuntime.state.topRuntime}
          isActive={dualRuntime.state.dominantRuntime === 'top'}
          profile={profile}
          posts={initialPosts}
          isAdmin={isAdmin}
          onOpenDrEams={() => setDrEamsOpen(true)}
        />
        <RuntimeView
          world={dualRuntime.state.bottomRuntime}
          isActive={dualRuntime.state.dominantRuntime === 'bottom'}
          profile={profile}
          posts={initialPosts}
          isAdmin={isAdmin}
          onOpenDrEams={() => setDrEamsOpen(true)}
        />
      </div>

      {/*
        DreamDM Bar — draggable window (Pass 3 - CORRECTED SPEC).
        The gold button is now embedded inside DreamDMBar.
        Gold button attaches to TOP of bar, detaches only when position goes off-screen.
        When detached, it screen-locks and does NOT move with scroll.
        Single-tap gold = open radial menus; double-tap = go home.
      */}
      <DreamDMBar
        onHome={returnHome}
        onBothMenus={() => setBothMenusOpen(true)}
        onRuntimeModeChange={handleBarRuntimeMode}
      />

      {/* Daydreams menu — left side when paired, center when solo */}
      <DreamRadialMenu
        open={bothMenusOpen}
        onClose={closeAllMenus}
        side="left"
        onSelectNode={(n) => {
          closeAllMenus();
          navigateTo(n as import('@/lib/dreamnav/delta').Node);
        }}
      />

      {/* System menu — right side when paired, center when solo */}
      <SystemRadialMenu
        open={bothMenusOpen}
        onClose={closeAllMenus}
        side="right"
        onAction={onSystemAction}
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
