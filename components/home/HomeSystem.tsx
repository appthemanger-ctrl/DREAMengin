'use client';

import React, { useCallback, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import ViewAllDreamsOverlay from '@/components/dreamengin/ViewAllDreamsOverlay';
import NavIndicator from '@/components/dreamnav/NavIndicator';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

/** Simple modal overlay used for Settings / Account / Search panels */
function SystemOverlay({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(2,8,24,0.6)', backdropFilter: 'blur(8px)' }}
      onPointerDown={onClose}
    >
      <div
        className="de-glass de-rounded"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(22rem, 92vw)',
          padding: '28px 24px',
          color: 'var(--de-white)',
          borderRadius: '24px',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="de-tag" style={{ marginBottom: '6px' }}>System</div>
        <div className="de-label" style={{ fontSize: '20px', marginBottom: '8px' }}>{title}</div>
        <p style={{ fontSize: '13px', color: 'var(--de-text-dim)', lineHeight: 1.5, marginBottom: '20px' }}>
          This panel operates within the DREAMengin spatial system. No page navigation occurs.
        </p>
        <button
          type="button"
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'rgba(37,99,235,0.25)',
            border: '1px solid rgba(37,99,235,0.45)',
            borderRadius: '12px',
            color: '#93c5fd',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ userId, profile, initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const { dispatch, navigateTo, node } = useDreamNav();

  const [dreamMenuAnchor, setDreamMenuAnchor]   = useState<DOMRect | null>(null);
  const [systemMenuAnchor, setSystemMenuAnchor] = useState<DOMRect | null>(null);
  const [drEamsOpen, setDrEamsOpen]             = useState(false);
  const [viewAllOpen, setViewAllOpen]           = useState(false);
  const [overlay, setOverlay]                   = useState<string | null>(null);
  const [coreFace, setCoreFace]                 = useState<'home' | 'profile'>('home');
  const [coreOpen, setCoreOpen]                 = useState(true);

  const returnHome = useCallback(() => {
    dispatch('home');
    setDreamMenuAnchor(null);
    setSystemMenuAnchor(null);
    setDrEamsOpen(false);
    setViewAllOpen(false);
    setOverlay(null);
    setCoreFace('home');
    setCoreOpen(true);
  }, [dispatch]);

  const onSystemAction = useCallback((action: SystemMenuAction) => {
    if (action === 'dr-eams')         { setDrEamsOpen(true);      return; }
    if (action === 'view-all-dreams') { setViewAllOpen(true);     return; }
    if (action === 'search')          { setOverlay('Search');      return; }
    if (action === 'settings')        { setOverlay('Settings');    return; }
    if (action === 'account')         { setOverlay('Account');     return; }
    if (action === 'edit-layout')     { setOverlay('Edit Layout'); return; }
  }, []);

  return (
    <>
      {/* ── Starfield background ── */}
      <StarfieldCanvas />

      {/* ── Node indicator (top centre) ── */}
      <NavIndicator node={node} />

      {/* ── Main node content ── */}
      <HomeDreamRuntime
        userId={userId}
        profile={profile}
        initialPosts={initialPosts}
        coreFace={coreFace}
        coreOpen={coreOpen}
        onToggleCoreFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
        onCloseCore={() => { setCoreFace('home'); setCoreOpen(false); }}
      />

      {/* ── Draggable controls (Blue/Red) with nav lock ── */}
      <DreamNavControls
        onHome={returnHome}
        onOpenDreamsMenu={() => {
          setSystemMenuAnchor(null);
          // Use a synthetic anchor at the centre bottom of the screen
          const w = window.innerWidth;
          const h = window.innerHeight;
          setDreamMenuAnchor(new DOMRect(w / 2 - 26, h - 72, 52, 52));
        }}
        onOpenSystemMenu={() => {
          setDreamMenuAnchor(null);
          const w = window.innerWidth;
          const h = window.innerHeight;
          setSystemMenuAnchor(new DOMRect(w / 2 + 26, h - 72, 52, 52));
        }}
        onDepthIn={() => dispatch('depth_in')}
        onDepthOut={() => dispatch('depth_out')}
      />

      {/* ── Radial menus ── */}
      <DreamRadialMenu
        open={Boolean(dreamMenuAnchor)}
        anchor={dreamMenuAnchor}
        onClose={() => setDreamMenuAnchor(null)}
        onSelectNode={(n) => {
          setDreamMenuAnchor(null);
          navigateTo(n);
        }}
      />
      <SystemRadialMenu
        open={Boolean(systemMenuAnchor)}
        anchor={systemMenuAnchor}
        onClose={() => setSystemMenuAnchor(null)}
        onAction={onSystemAction}
      />

      {/* ── Overlays ── */}
      {overlay  ? <SystemOverlay title={overlay}  onClose={() => setOverlay(null)}  /> : null}
      {viewAllOpen ? <ViewAllDreamsOverlay onClose={() => setViewAllOpen(false)} onReturnHome={returnHome} /> : null}
      {drEamsOpen  ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
