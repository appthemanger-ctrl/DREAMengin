'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import NavIndicator from '@/components/dreamnav/NavIndicator';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ userId, profile, initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const { dispatch, navigateTo, node } = useDreamNav();

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
    dispatch('home');
    closeAllMenus();
    setDrEamsOpen(false);
    setCoreFace('home');
    setCoreOpen(true);
  }, [dispatch, closeAllMenus]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    closeAllMenus();
    if (action === 'dr-eams')       { setDrEamsOpen(true); return; }
    if (action === 'settings')      { window.location.href = '/settings'; return; }
    if (action === 'account')       { window.location.href = '/edit-profile'; return; }
    if (action === 'feed-settings') { window.location.href = '/feed-settings'; return; }
    if (action === 'connectors')    { window.location.href = '/connectors'; return; }
    if (action === 'go-home')       { returnHome(); return; }
  }, [closeAllMenus, returnHome]);

  return (
    <>
      <StarfieldCanvas />
      <NavIndicator node={node} hidden={!showNavIndicator} />

      <HomeDreamRuntime
        profile={profile}
        posts={initialPosts}
        coreFace={coreFace}
        coreOpen={coreOpen}
        onToggleCoreFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
        onCloseCore={() => { setCoreFace('home'); setCoreOpen(false); }}
        onOpenDrEams={() => setDrEamsOpen(true)}
      />

      {/* Gold home button — single tap = Go Home, double tap = both menus (§6.1) */}
      <DreamNavControls
        onHome={returnHome}
        onBothMenus={() => setBothMenusOpen(true)}
      />

      {/* Shared dim backdrop for dual-menu display */}
      {bothMenusOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 68,
            background: 'rgba(2,8,24,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'de-menu-overlay-in 0.18s ease-out',
          }}
          onPointerDown={closeAllMenus}
        />
      )}

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
