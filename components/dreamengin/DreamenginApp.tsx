// components/dreamengin/DreamenginApp.tsx
// Top-level Dreamengin orchestration: engine state (refs), home controls, and overlay menus.

'use client';

import React, { useCallback, useRef, useState } from 'react';
import BabylonWorkspace from './BabylonWorkspace';
import HomeControls from './HomeControls';
import NexusMenu from './NexusMenu';
import OutdreamMenu from './OutdreamMenu';
import DrEamsPanel from './DrEamsPanel';
import { unitComplexFromAngle, clamp } from './engine/math';
import type { EngineState, FlightMode } from './engine/types';

function createEngineState(): EngineState {
  const yawQ = new Float32Array(2);
  unitComplexFromAngle(0, yawQ);
  return {
    x: 0,
    y: 0,
    scale: 1,
    depth: 0,
    yawQ,
    flight: { active: false, mode: 'in', thrust: 0, steerDelta: 0 },
    overlayLock: false,
  };
}

export default function DreamenginApp() {
  // Overlay state (React UI only)
  const [showNexus, setShowNexus] = useState(false);
  const [showOutdream, setShowOutdream] = useState(false);
  const [showDrEams, setShowDrEams] = useState(false);

  // Engine state lives in a ref to prevent React renders on pointer-move.
  const engineRef = useRef<EngineState>(createEngineState());

  const setOverlayLock = useCallback((locked: boolean) => {
    engineRef.current.overlayLock = locked;
  }, []);

  const closeAllOverlays = useCallback(() => {
    setShowNexus(false);
    setShowOutdream(false);
    setShowDrEams(false);
    setOverlayLock(false);
  }, [setOverlayLock]);

  const toggleNexus = useCallback(() => {
    setShowOutdream(false);
    setShowDrEams(false);
    setShowNexus((v) => {
      const next = !v;
      setOverlayLock(next);
      return next;
    });
  }, [setOverlayLock]);

  const toggleOutdream = useCallback(() => {
    setShowNexus(false);
    setShowDrEams(false);
    setShowOutdream((v) => {
      const next = !v;
      setOverlayLock(next);
      return next;
    });
  }, [setOverlayLock]);

  const openDrEams = useCallback(() => {
    setShowNexus(false);
    setShowOutdream(false);
    setShowDrEams(true);
    setOverlayLock(true);
  }, [setOverlayLock]);

  const closeDrEams = useCallback(() => {
    setShowDrEams(false);
    setOverlayLock(false);
  }, [setOverlayLock]);

  // ReturnHome (collision of home controls).
  const goHome = useCallback(() => {
    const s = engineRef.current;
    s.x = 0;
    s.y = 0;
    s.scale = 1;
    s.depth = 0;
    unitComplexFromAngle(0, s.yawQ);
    s.flight.active = false;
    s.flight.thrust = 0;
    s.flight.steerDelta = 0;
    closeAllOverlays();
  }, [closeAllOverlays]);

  // Flight control API (called by HomeControls). Deterministic: no inertia; pointerup ends flight.
  const startFlight = useCallback((mode: FlightMode) => {
    const s = engineRef.current;
    if (s.overlayLock) return;
    s.flight.active = true;
    s.flight.mode = mode;
    s.flight.thrust = 0;
    s.flight.steerDelta = 0;

    // Discrete depth: "in" means depth=1, "out" means depth=0.
    s.depth = mode === 'in' ? 1 : 0;
  }, []);

  const updateThrust = useCallback((thrust01: number) => {
    const s = engineRef.current;
    if (!s.flight.active || s.overlayLock) return;
    s.flight.thrust = clamp(thrust01, 0, 1);
  }, []);

  const steerBy = useCallback((deltaYawRad: number) => {
    const s = engineRef.current;
    if (!s.flight.active || s.overlayLock) return;
    // Accumulate; applied in BabylonWorkspace to keep ordering deterministic.
    s.flight.steerDelta += deltaYawRad;
  }, []);

  const endFlight = useCallback(() => {
    const s = engineRef.current;
    s.flight.active = false;
    s.flight.thrust = 0;
    s.flight.steerDelta = 0;
  }, []);

  // Zoom control (wheel/trackpad)
  const zoomBy = useCallback((dz: number) => {
    const s = engineRef.current;
    if (s.overlayLock) return;
    s.scale = clamp(s.scale + dz, 0.5, 4);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden relative touch-none">
      <BabylonWorkspace engineRef={engineRef} onZoom={zoomBy} />

      <HomeControls
        onDoubleTapBlue={toggleOutdream}
        onDoubleTapRed={toggleNexus}
        onGoHome={goHome}
        onFlightStart={startFlight}
        onFlightThrust={updateThrust}
        onFlightSteer={steerBy}
        onFlightEnd={endFlight}
      />

      {showNexus && (
        <NexusMenu
          onClose={() => {
            setShowNexus(false);
            setOverlayLock(false);
          }}
          onOpenDrEams={openDrEams}
        />
      )}
      {showOutdream && (
        <OutdreamMenu
          onClose={() => {
            setShowOutdream(false);
            setOverlayLock(false);
          }}
        />
      )}
      {showDrEams && <DrEamsPanel onClose={closeDrEams} />}
    </div>
  );
}
