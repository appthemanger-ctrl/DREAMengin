// components/dreamengin/DreamenginApp.tsx
// Top-level Dreamengin orchestration: kernel scene, home controls, and overlay menus.

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import HomeControls from './HomeControls';
import NexusMenu from './NexusMenu';
import OutdreamMenu from './OutdreamMenu';
import DrEamsPanel from './DrEamsPanel';
import CanvasDropZone, { type AssetImportPayload } from './CanvasDropZone';
import DREAMenginOS from './DREAMenginOS';
import { DreamNavProvider } from '@/components/dreamnav/DreamNavSurface6';

export default function DreamenginApp() {
  const pathname = usePathname();
  const mountedRef = useRef(true);
  const [showNexus, setShowNexus] = useState(false);
  const [showOutdream, setShowOutdream] = useState(false);
  const [showDrEams, setShowDrEams] = useState(false);
  const [importedAssets, setImportedAssets] = useState(0);
  const [lastImportCategory, setLastImportCategory] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const EDGE_PX = 24;
    const TOP_PX = 80;
    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const dy = touch.clientY - startY;
      if (startX < EDGE_PX || startX > window.innerWidth - EDGE_PX) {
        e.preventDefault();
        return;
      }
      if (window.scrollY === 0 && startY < TOP_PX && dy > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', onTouchStart as EventListener);
      window.removeEventListener('touchmove', onTouchMove as EventListener);
    };
  }, []);

  const closeAllOverlays = useCallback(() => {
    setShowNexus(false);
    setShowOutdream(false);
    setShowDrEams(false);
  }, []);

  const toggleNexus = useCallback(() => {
    setShowOutdream(false);
    setShowDrEams(false);
    setShowNexus((value) => !value);
  }, []);

  const toggleOutdream = useCallback(() => {
    setShowNexus(false);
    setShowDrEams(false);
    setShowOutdream((value) => !value);
  }, []);

  const openDrEams = useCallback(() => {
    setShowNexus(false);
    setShowOutdream(false);
    setShowDrEams(true);
  }, []);

  const closeDrEams = useCallback(() => {
    setShowDrEams(false);
  }, []);

  const openBothMenus = useCallback(() => {
    setShowDrEams(false);
    setShowNexus(true);
    setShowOutdream(true);
  }, []);

  const goHome = useCallback(() => {
    closeAllOverlays();
    setLastImportCategory(null);
  }, [closeAllOverlays]);

  const handleImport = useCallback((payload: AssetImportPayload) => {
    if (!mountedRef.current) return;
    setImportedAssets((count) => count + 1);
    setLastImportCategory(payload.category);
  }, []);

  const subsystemState = useMemo(() => ({
    nexusOpen: showNexus,
    outdreamOpen: showOutdream,
    drEamsOpen: showDrEams,
    importedAssets,
    lastImportCategory,
    route: pathname,
  }), [importedAssets, lastImportCategory, pathname, showDrEams, showNexus, showOutdream]);

  return (
    <DreamNavProvider>
      <CanvasDropZone className="w-full h-full" onImport={handleImport}>
        <div className="relative h-full w-full overflow-hidden touch-none">
          <DREAMenginOS subsystems={subsystemState} />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-4">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/12 bg-slate-950/45 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-200 backdrop-blur-md">
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${showNexus ? 'bg-amber-400/20 text-amber-100' : 'bg-white/5 text-slate-200'}`}
                onClick={toggleNexus}
              >
                Nexus
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${showOutdream ? 'bg-amber-400/20 text-amber-100' : 'bg-white/5 text-slate-200'}`}
                onClick={toggleOutdream}
              >
                Outdream
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${showDrEams ? 'bg-sky-400/20 text-sky-100' : 'bg-white/5 text-slate-200'}`}
                onClick={openDrEams}
              >
                Dr. Eams
              </button>
              <span className="rounded-full bg-white/5 px-3 py-1">
                Imports {importedAssets}
              </span>
            </div>
          </div>

          <HomeControls onBothMenus={openBothMenus} onHome={goHome} />

          {showNexus && (
            <NexusMenu
              onClose={() => setShowNexus(false)}
              onOpenDrEams={openDrEams}
              onViewAllDreams={() => setShowNexus(false)}
            />
          )}
          {showOutdream && (
            <OutdreamMenu
              onClose={() => setShowOutdream(false)}
            />
          )}
          {showDrEams && <DrEamsPanel onClose={closeDrEams} />}
        </div>
      </CanvasDropZone>
    </DreamNavProvider>
  );
}
