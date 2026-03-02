'use client';

import React, { useCallback, useState } from 'react';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import LiveNewsFeed from '@/components/home/LiveNewsFeed';
import DreamsGrid from '@/components/home/DreamsGrid';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ profile, userId: _userId, initialPosts: _initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const [dreamMenuOpen, setDreamMenuOpen]   = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen]         = useState(false);
  const [menuAnchor, setMenuAnchor]         = useState({ x: 0, y: 0 });

  const closeAll = useCallback(() => {
    setDreamMenuOpen(false);
    setSystemMenuOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    closeAll();
    setDrEamsOpen(false);
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [closeAll]);

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
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Starfield background — fixed, behind everything */}
      <StarfieldCanvas />

      {/* Scrollable content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          paddingBottom: 120, // leave room for the floating controls
          background: 'linear-gradient(180deg, var(--de-bg-start, #020818) 0%, var(--de-bg-mid, #040d2c) 50%, var(--de-bg-end, #020818) 100%)',
        }}
      >
        {/* Page header */}
        <header style={{ padding: '24px 16px 8px', maxWidth: 700, margin: '0 auto' }}>
          {profile?.display_name || profile?.handle ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--de-gold, #d4a843)' }}>
                Welcome back
              </span>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading, #f0f4ff)', marginTop: 2 }}>
                {profile.display_name ?? `@${profile.handle}`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--de-heading, #f0f4ff)', marginBottom: 4 }}>
              Home
            </div>
          )}
        </header>

        {/* Main content stack */}
        <main
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Live news feed */}
          <LiveNewsFeed />

          {/* 48-item dreams grid */}
          <DreamsGrid />
        </main>
      </div>

      {/* ── Controls overlay (fixed, non-scrolling) ── */}
      <DreamNavControls
        onHome={returnHome}
        onOpenBothMenus={(anchor) => {
          setMenuAnchor(anchor);
          setDreamMenuOpen(true);
          setSystemMenuOpen(true);
        }}
        onOpenDreamsMenu={(anchor) => {
          setMenuAnchor(anchor);
          setSystemMenuOpen(false);
          setDreamMenuOpen(true);
        }}
        onOpenSystemMenu={(anchor) => {
          setMenuAnchor(anchor);
          setDreamMenuOpen(false);
          setSystemMenuOpen(true);
        }}
      />

      {/* Daydreams fan */}
      <DreamRadialMenu
        open={dreamMenuOpen}
        onClose={() => setDreamMenuOpen(false)}
        anchorX={menuAnchor.x}
        anchorY={menuAnchor.y}
        onSelectNode={closeAll}
      />

      {/* System fan */}
      <SystemRadialMenu
        open={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        anchorX={menuAnchor.x}
        anchorY={menuAnchor.y}
        onAction={onSystemAction}
      />

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </div>
  );
}
