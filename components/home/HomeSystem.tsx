'use client';

import React, { useCallback, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import HomeControls from '@/components/controls/HomeControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import ViewAllDreamsOverlay from '@/components/dreamengin/ViewAllDreamsOverlay';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

function LightweightOverlay({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/35" onPointerDown={onClose}>
      <div className="mx-auto mt-24 w-[min(24rem,92vw)] rounded-3xl border border-white/15 bg-slate-950/92 p-4 text-white" onPointerDown={(e) => e.stopPropagation()}>
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">System</div>
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-white/70">Panel placeholder in current spatial state (no route navigation).</p>
        <button type="button" className="mt-4 min-h-11 rounded-xl border border-white/20 px-4 text-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function HomeSystem({ userId, profile, initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const { dispatch, navigateTo } = useDreamNav();

  const [dreamMenuAnchor, setDreamMenuAnchor] = useState<DOMRect | null>(null);
  const [systemMenuAnchor, setSystemMenuAnchor] = useState<DOMRect | null>(null);

  const [drEamsOpen, setDrEamsOpen] = useState(false);
  const [viewAllDreamsOpen, setViewAllDreamsOpen] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);

  const [coreFace, setCoreFace] = useState<'home' | 'profile'>('home');

  const returnHome = useCallback(() => {
    dispatch('home');
    setDreamMenuAnchor(null);
    setSystemMenuAnchor(null);
    setDrEamsOpen(false);
    setViewAllDreamsOpen(false);
    setOverlay(null);
    setCoreFace('home');
  }, [dispatch]);

  const onSystemAction = (action: SystemMenuAction) => {
    if (action === 'dr-eams') {
      setDrEamsOpen(true);
      return;
    }
    if (action === 'view-all-dreams') {
      setViewAllDreamsOpen(true);
      return;
    }
    if (action === 'search') setOverlay('Search');
    if (action === 'settings') setOverlay('Settings');
    if (action === 'account') setOverlay('Account');
    if (action === 'edit-layout') setOverlay('Edit Layout');
  };

  return (
    <>
      <HomeDreamRuntime
        userId={userId}
        profile={profile}
        initialPosts={initialPosts}
        coreFace={coreFace}
        coreOpen
        onToggleCoreFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
        onCloseCore={() => setCoreFace('home')}
      />

      <HomeControls
        onReturnHome={returnHome}
        onOpenDreamMenu={(anchor) => {
          setSystemMenuAnchor(null);
          setDreamMenuAnchor(anchor);
        }}
        onOpenSystemMenu={(anchor) => {
          setDreamMenuAnchor(null);
          setSystemMenuAnchor(anchor);
        }}
      />

      <DreamRadialMenu
        open={Boolean(dreamMenuAnchor)}
        anchor={dreamMenuAnchor}
        onClose={() => setDreamMenuAnchor(null)}
        onSelectNode={(node) => {
          navigateTo(node);
        }}
      />

      <SystemRadialMenu
        open={Boolean(systemMenuAnchor)}
        anchor={systemMenuAnchor}
        onClose={() => setSystemMenuAnchor(null)}
        onAction={onSystemAction}
      />

      {overlay ? <LightweightOverlay title={overlay} onClose={() => setOverlay(null)} /> : null}
      {viewAllDreamsOpen ? <ViewAllDreamsOverlay onClose={() => setViewAllDreamsOpen(false)} onReturnHome={returnHome} /> : null}
      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
