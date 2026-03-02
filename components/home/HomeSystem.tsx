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

  const [dreamMenuOpen, setDreamMenuOpen]   = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen]         = useState(false);
  const [coreFace, setCoreFace]             = useState<'home' | 'profile'>('home');
  const [coreOpen, setCoreOpen]             = useState(true);
  // DreamNavControls starts locked; track lock state to hide NavIndicator when not navigating
  const [navLocked, setNavLocked]           = useState(true);
  // Read showNavIndicator setting from localStorage (default true)
  const [showNavIndicator, setShowNavIndicator] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dreamengin:showNavIndicator');
      if (saved !== null) setShowNavIndicator(saved !== 'false');
    } catch { /* noop */ }
  }, []);

  const closeAll = useCallback(() => {
    setDreamMenuOpen(false);
    setSystemMenuOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    dispatch('home');
    closeAll();
    setDrEamsOpen(false);
    setCoreFace('home');
    setCoreOpen(true);
  }, [dispatch, closeAll]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    closeAll();
    if (action === 'dr-eams')       { setDrEamsOpen(true); return; }
    if (action === 'settings')      { window.location.href = '/settings'; return; }
    if (action === 'account')       { window.location.href = '/edit-profile'; return; }
    if (action === 'feed-settings') { window.location.href = '/feed-settings'; return; }
    if (action === 'connectors')    { window.location.href = '/connectors'; return; }
    if (action === 'go-home')       { returnHome(); return; }
  }, [closeAll, returnHome]);

  return (
    <>
      <StarfieldCanvas />
      <NavIndicator node={node} hidden={navLocked || !showNavIndicator} />

      <HomeDreamRuntime
        profile={profile}
        coreFace={coreFace}
        coreOpen={coreOpen}
        onToggleCoreFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
        onCloseCore={() => { setCoreFace('home'); setCoreOpen(false); }}
        onOpenDrEams={() => setDrEamsOpen(true)}
      />

      <DreamNavControls
        onHome={returnHome}
        onLockChange={setNavLocked}
        onOpenBothMenus={() => {
          setDreamMenuOpen(true);
          setSystemMenuOpen(true);
        }}
        onOpenDreamsMenu={() => {
          setSystemMenuOpen(false);
          setDreamMenuOpen(true);
        }}
        onOpenSystemMenu={() => {
          setDreamMenuOpen(false);
          setSystemMenuOpen(true);
        }}
      />

      {/* Daydreams menu — right side when both open (SPEC §3.1), center otherwise */}
      <DreamRadialMenu
        open={dreamMenuOpen}
        onClose={() => setDreamMenuOpen(false)}
        side={dreamMenuOpen && systemMenuOpen ? 'right' : 'center'}
        onSelectNode={(n) => {
          closeAll();
          navigateTo(n);
        }}
      />

      {/* System menu — left side when both open (SPEC §3.1), center otherwise */}
      <SystemRadialMenu
        open={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        side={dreamMenuOpen && systemMenuOpen ? 'left' : 'center'}
        onAction={onSystemAction}
      />

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
