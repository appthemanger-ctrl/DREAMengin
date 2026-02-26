'use client';

import React, { useCallback, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import AppearanceWidget from '@/components/dreamengin/AppearanceWidget';
import ViewAllDreamsOverlay from '@/components/dreamengin/ViewAllDreamsOverlay';
import NavIndicator from '@/components/dreamnav/NavIndicator';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

/** Simple modal overlay used for Settings/Account/Search panels */
function SystemOverlay({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
      onPointerDown={onClose}
    >
      <div
        className="de-sheet"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(22rem, 92vw)',
          padding: '28px 24px',
          color: 'var(--de-heading)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="de-tag" style={{ marginBottom: '6px' }}>System</div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--de-heading)' }}>{title}</div>
        <p style={{ fontSize: '13px', color: 'var(--de-text-dim)', lineHeight: 1.5, marginBottom: '20px' }}>
          This panel is within the DREAMengin system. Navigation happens instantly.
        </p>
        <button type="button" className="de-btn de-btn-ghost" style={{ width: '100%' }} onClick={onClose}>
          Close Panel
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ userId, profile, initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const { dispatch, navigateTo, node } = useDreamNav();

  const [dreamMenuOpen, setDreamMenuOpen]   = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [bothMenusOpen, setBothMenusOpen]   = useState(false);
  const [drEamsOpen, setDrEamsOpen]         = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen]       = useState(false);
  const [overlay, setOverlay]               = useState<string | null>(null);
  const [coreFace, setCoreFace]             = useState<'home' | 'profile'>('home');
  const [coreOpen, setCoreOpen]             = useState(true);

  const closeAll = useCallback(() => {
    setDreamMenuOpen(false);
    setSystemMenuOpen(false);
    setBothMenusOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    dispatch('home');
    closeAll();
    setDrEamsOpen(false);
    setAppearanceOpen(false);
    setViewAllOpen(false);
    setOverlay(null);
    setCoreFace('home');
    setCoreOpen(true);
  }, [dispatch, closeAll]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    closeAll();
    if (action === 'dr-eams')         { setDrEamsOpen(true);     return; }
    if (action === 'appearance')      { setAppearanceOpen(true); return; }
    if (action === 'view-all-dreams') { setViewAllOpen(true);    return; }
    if (action === 'search')          { setOverlay('Search');    return; }
    if (action === 'settings')        { window.location.href = '/settings'; return; }
    if (action === 'account')         { window.location.href = '/edit-profile'; return; }
    if (action === 'go-home')         { returnHome(); return; }
    if (action === 'edit-layout')     { setOverlay('Edit Layout'); return; }
  }, [closeAll, returnHome]);

  // Synthetic anchor near bottom-center for menus
  const makeAnchor = (offsetX = 0) => {
    if (typeof window === 'undefined') return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return new DOMRect(w / 2 - 26 + offsetX, h - 80, 52, 52);
  };

  return (
    <>
      <StarfieldCanvas />
      <NavIndicator node={node} />

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
        onOpenDreamsMenu={() => {
          setSystemMenuOpen(false);
          setBothMenusOpen(false);
          setDreamMenuOpen(true);
        }}
        onOpenSystemMenu={() => {
          setDreamMenuOpen(false);
          setBothMenusOpen(false);
          setSystemMenuOpen(true);
        }}
        onOpenBothMenus={() => {
          setDreamMenuOpen(false);
          setSystemMenuOpen(false);
          setBothMenusOpen(true);
        }}
      />

      {/* Daydreams menu */}
      <DreamRadialMenu
        open={dreamMenuOpen || bothMenusOpen}
        anchor={bothMenusOpen ? makeAnchor(-60) : makeAnchor(-60)}
        onClose={() => { setDreamMenuOpen(false); if (bothMenusOpen) setBothMenusOpen(false); }}
        onSelectNode={(n) => {
          closeAll();
          navigateTo(n);
        }}
      />

      {/* System menu */}
      <SystemRadialMenu
        open={systemMenuOpen || bothMenusOpen}
        anchor={bothMenusOpen ? makeAnchor(60) : makeAnchor(60)}
        onClose={() => { setSystemMenuOpen(false); if (bothMenusOpen) setBothMenusOpen(false); }}
        onAction={onSystemAction}
      />

      {overlay    ? <SystemOverlay title={overlay}  onClose={() => setOverlay(null)} /> : null}
      {viewAllOpen ? <ViewAllDreamsOverlay onClose={() => setViewAllOpen(false)} onReturnHome={returnHome} /> : null}
      {drEamsOpen     ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
      {appearanceOpen ? <AppearanceWidget onClose={() => setAppearanceOpen(false)} /> : null}
    </>
  );
}
