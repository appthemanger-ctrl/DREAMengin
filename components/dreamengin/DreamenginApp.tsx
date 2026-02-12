// DreamenginApp.tsx
// This top‑level component orchestrates the spatial workspace, home controls and overlay menus.
// It exposes callbacks for panning, zooming and depth control to the HomeControls component.

'use client';

import React, { useState, useCallback } from 'react';
import BabylonWorkspace from './BabylonWorkspace';
import HomeControls from './HomeControls';
import NexusMenu from './NexusMenu';
import OutdreamMenu from './OutdreamMenu';
import DrEamsPanel from './DrEamsPanel';

export default function DreamenginApp() {
  // Camera state: translation (x,y) and scale.
  // We store the pan offsets and zoom level.  These values are passed down to the workspace.
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [depth, setDepth] = useState(0); // conceptual depth – base = 0, day_dream levels positive

  // Overlay state for menus and DrEams panel
  const [showNexus, setShowNexus] = useState(false);
  const [showOutdream, setShowOutdream] = useState(false);
  const [showDrEams, setShowDrEams] = useState(false);

  const toggleNexus = useCallback(() => {
    setShowOutdream(false);
    setShowDrEams(false);
    setShowNexus((v) => !v);
  }, []);

  const toggleOutdream = useCallback(() => {
    setShowNexus(false);
    setShowDrEams(false);
    setShowOutdream((v) => !v);
  }, []);

  const openDrEams = useCallback(() => {
    setShowNexus(false);
    setShowOutdream(false);
    setShowDrEams(true);
  }, []);

  // Pan the workspace by a delta.  Called from gesture handlers.
  const panBy = useCallback((dx: number, dy: number) => {
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  // Set absolute translation – used when resetting to home
  const setAbsolutePosition = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, []);

  // Adjust scale on zoom
  const zoomBy = useCallback((dz: number) => {
    setScale((prev) => Math.min(Math.max(prev + dz, 0.5), 4));
  }, []);

  // Move depth by delta; positive values move inward, negative outward
  const adjustDepth = useCallback((delta: number) => {
    setDepth((prev) => Math.max(prev + delta, 0));
  }, []);

  // Go home resets translation, zoom and depth
  const goHome = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setDepth(0);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden relative touch-none">
      <BabylonWorkspace
        position={position}
        scale={scale}
        depth={depth}
        onPan={panBy}
        onZoom={zoomBy}
      />
      <HomeControls
        onDoubleTapBlue={toggleOutdream}
        onDoubleTapRed={toggleNexus}
        onHoldBlue={adjustDepth}
        onHoldRed={(delta) => adjustDepth(-delta)}
        onGoHome={goHome}
      />
      {showNexus && (
        <NexusMenu onClose={() => setShowNexus(false)} onOpenDrEams={openDrEams} />
      )}
      {showOutdream && <OutdreamMenu onClose={() => setShowOutdream(false)} />}
      {showDrEams && <DrEamsPanel onClose={() => setShowDrEams(false)} />}
    </div>
  );
}
