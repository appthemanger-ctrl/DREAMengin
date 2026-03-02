'use client';

import React, { useCallback, useState } from 'react';
import CoreDream from '@/components/core/CoreDream';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import DreamRadialMenu from '@/components/menus/DreamRadialMenu';
import SystemRadialMenu, { type SystemMenuAction } from '@/components/menus/SystemRadialMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ profile }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const [dreamMenuOpen, setDreamMenuOpen]   = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen]         = useState(false);
  const [coreFace, setCoreFace]             = useState<'home' | 'profile'>('home');
  const [coreOpen, setCoreOpen]             = useState(true);
  const [menuAnchor, setMenuAnchor]         = useState({ x: 0, y: 0 });

  const closeAll = useCallback(() => {
    setDreamMenuOpen(false);
    setSystemMenuOpen(false);
  }, []);

  const returnHome = useCallback(() => {
    closeAll();
    setDrEamsOpen(false);
    setCoreFace('home');
    setCoreOpen(true);
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
    <>
      <StarfieldCanvas />

      <div
        className="fixed inset-0 z-10 grid place-items-center"
        style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 62%, var(--de-bg-end) 100%)' }}
      >
        <CoreDream
          face={coreFace}
          isOpen={coreOpen}
          onToggleFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
          onClose={() => { setCoreFace('home'); setCoreOpen(false); }}
          onOpenDrEams={() => setDrEamsOpen(true)}
          profile={profile}
        />
      </div>

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

      {/* Daydreams fan — fans out from gold button */}
      <DreamRadialMenu
        open={dreamMenuOpen}
        onClose={() => setDreamMenuOpen(false)}
        anchorX={menuAnchor.x}
        anchorY={menuAnchor.y}
        onSelectNode={closeAll}
      />

      {/* System fan — fans out from gold button */}
      <SystemRadialMenu
        open={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        anchorX={menuAnchor.x}
        anchorY={menuAnchor.y}
        onAction={onSystemAction}
      />

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
