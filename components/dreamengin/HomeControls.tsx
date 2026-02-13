// components/dreamengin/HomeControls.tsx
// Deterministic dual-control gesture system for DREAMengin.
//
// Priority: ReturnHome > overlayLock (enforced by engine) > doubleTap > hold->fly > drag(reposition) > press
//
// - Double-tap Blue: Outdream menu
// - Double-tap Red:  Nexus/System menu
// - ReturnHome: drag either control into the other (distance threshold)
// - Flight: press-and-hold Blue (IN) or Red (OUT). Upward drag increases thrust; pointerup ends flight.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type FlightMode = 'in' | 'out';

interface HomeControlsProps {
  onDoubleTapBlue: () => void;
  onDoubleTapRed: () => void;
  onGoHome: () => void;

  onFlightStart: (mode: FlightMode) => void;
  onFlightThrust: (thrust01: number) => void;
  onFlightSteer: (deltaYawRad: number) => void;
  onFlightEnd: () => void;
}

type ControlId = 'blue' | 'red';

type ControlState = 'IDLE' | 'PRESS' | 'DRAG' | 'FLY' | 'STEER';

interface XY {
  x: number;
  y: number;
}

const BTN = 74;
const GAP = 14;

const HOLD_ARM_MS = 320;
const DRAG_START_PX = 10;
const DOUBLE_TAP_MS = 260;

const HOME_TOUCH_PX = 62;
const HOME_TOUCH_PX2 = HOME_TOUCH_PX * HOME_TOUCH_PX;

const MAX_THRUST_PX = 220;
const STEER_RAD_PER_PX = 0.0042;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function dist2(a: XY, b: XY): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export default function HomeControls(props: HomeControlsProps) {
  const { onDoubleTapBlue, onDoubleTapRed, onGoHome, onFlightStart, onFlightThrust, onFlightSteer, onFlightEnd } = props;

  // Resting (home) positions (persisted). While interacting, elements move via transform (no React re-render).
  const [blueHome, setBlueHome] = useState<XY>({ x: 0, y: 0 });
  const [redHome, setRedHome] = useState<XY>({ x: 0, y: 0 });

  const blueEl = useRef<HTMLDivElement | null>(null);
  const redEl = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    flightActive: false as boolean,
    throttle: null as ControlId | null,

    // per-control
    blue: {
      state: 'IDLE' as ControlState,
      pointerId: null as number | null,
      pressT: 0,
      lastTapT: 0,
      start: { x: 0, y: 0 } as XY,     // pointerdown position (client)
      offset: { x: 0, y: 0 } as XY,    // current transform offset
      holdTimer: 0 as any,
    },
    red: {
      state: 'IDLE' as ControlState,
      pointerId: null as number | null,
      pressT: 0,
      lastTapT: 0,
      start: { x: 0, y: 0 } as XY,
      offset: { x: 0, y: 0 } as XY,
      holdTimer: 0 as any,
    },
  });

  const defaultHome = useMemo(() => {
    if (typeof window === 'undefined') return { blue: { x: 0, y: 0 }, red: { x: 0, y: 0 } };
    const x = window.innerWidth / 2;
    const y = window.innerHeight - (BTN + 24);
    return {
      blue: { x: x - (BTN + GAP) / 2, y },
      red: { x: x + (BTN + GAP) / 2, y },
    };
  }, []);

  // Load persisted positions
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('dreamengin.homeControls.v3');
      if (!raw) {
        setBlueHome(defaultHome.blue);
        setRedHome(defaultHome.red);
        return;
      }
      const parsed = JSON.parse(raw) as { blue?: XY; red?: XY };
      setBlueHome(parsed.blue ?? defaultHome.blue);
      setRedHome(parsed.red ?? defaultHome.red);
    } catch {
      setBlueHome(defaultHome.blue);
      setRedHome(defaultHome.red);
    }
  }, [defaultHome]);

  // Persist positions when they change
  useEffect(() => {
    try {
      window.localStorage.setItem('dreamengin.homeControls.v3', JSON.stringify({ blue: blueHome, red: redHome }));
    } catch {
      // ignore
    }
  }, [blueHome, redHome]);

  const getHome = (id: ControlId): XY => (id === 'blue' ? blueHome : redHome);

  const getEl = (id: ControlId): HTMLDivElement | null => (id === 'blue' ? blueEl.current : redEl.current);

  const setOffset = (id: ControlId, dx: number, dy: number) => {
    const el = getEl(id);
    if (!el) return;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    const c = stateRef.current[id];
    c.offset.x = dx;
    c.offset.y = dy;
  };

  const clearOffset = (id: ControlId) => setOffset(id, 0, 0);

  const cancelHoldTimer = (id: ControlId) => {
    const c = stateRef.current[id];
    if (c.holdTimer) {
      clearTimeout(c.holdTimer);
      c.holdTimer = 0;
    }
  };

  const resetControl = (id: ControlId) => {
    const c = stateRef.current[id];
    cancelHoldTimer(id);
    c.state = 'IDLE';
    c.pointerId = null;
    c.pressT = 0;
    c.start.x = 0;
    c.start.y = 0;
    c.offset.x = 0;
    c.offset.y = 0;
    clearOffset(id);
  };

  const endFlightIfNeeded = () => {
    const s = stateRef.current;
    if (!s.flightActive) return;
    s.flightActive = false;
    s.throttle = null;
    onFlightEnd();
  };

  const maybeReturnHome = () => {
    // Use current transformed centers.
    const blueCenter = { x: blueHome.x + stateRef.current.blue.offset.x + BTN / 2, y: blueHome.y + stateRef.current.blue.offset.y + BTN / 2 };
    const redCenter = { x: redHome.x + stateRef.current.red.offset.x + BTN / 2, y: redHome.y + stateRef.current.red.offset.y + BTN / 2 };
    if (dist2(blueCenter, redCenter) <= HOME_TOUCH_PX2) {
      // ReturnHome outranks everything.
      endFlightIfNeeded();
      onGoHome();
      // Snap both back to their resting positions.
      resetControl('blue');
      resetControl('red');
      return true;
    }
    return false;
  };

  const beginFlight = (throttle: ControlId) => {
    const s = stateRef.current;
    if (s.flightActive) return;
    s.flightActive = true;
    s.throttle = throttle;
    onFlightStart(throttle === 'blue' ? 'in' : 'out');
    onFlightThrust(0);
  };

  const updateThrustFromOffset = (id: ControlId) => {
    const c = stateRef.current[id];
    // Upward drag (negative dy) increases thrust.
    const thrust = clamp01((-c.offset.y) / MAX_THRUST_PX);
    onFlightThrust(thrust);
  };

  const applySteerDelta = (dx: number) => {
    if (dx === 0) return;
    onFlightSteer(dx * STEER_RAD_PER_PX);
  };

  const handlePointerDown = (id: ControlId, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const c = stateRef.current[id];
    if (c.pointerId !== null) return;

    c.pointerId = e.pointerId;
    c.state = stateRef.current.flightActive ? 'STEER' : 'PRESS';
    c.pressT = performance.now();
    c.start.x = e.clientX;
    c.start.y = e.clientY;
    c.offset.x = 0;
    c.offset.y = 0;

    const el = getEl(id);
    el?.setPointerCapture?.(e.pointerId);

    cancelHoldTimer(id);

    if (!stateRef.current.flightActive) {
      // Hold-to-fly timer.
      c.holdTimer = setTimeout(() => {
        // Only fire if still a press and not dragged.
        if (c.state !== 'PRESS' || c.pointerId === null) return;
        beginFlight(id);
        c.state = 'FLY';
      }, HOLD_ARM_MS);
    }
  };

  const handlePointerMove = (id: ControlId, e: React.PointerEvent) => {
    e.stopPropagation();
    const c = stateRef.current[id];
    if (c.pointerId === null || e.pointerId !== c.pointerId) return;

    const dx = e.clientX - c.start.x;
    const dy = e.clientY - c.start.y;

    // If we're steering, use delta-x as yaw.
    if (c.state === 'STEER') {
      const prevX = c.offset.x;
      setOffset(id, dx, dy);
      applySteerDelta(dx - prevX);
      void maybeReturnHome();
      return;
    }

    // PRESS: decide DRAG vs stay PRESS until hold.
    if (c.state === 'PRESS') {
      const moved = Math.hypot(dx, dy);
      if (moved >= DRAG_START_PX) {
        cancelHoldTimer(id);
        c.state = 'DRAG';
      }
    }

    // DRAG: reposition control (visual only until pointerup)
    if (c.state === 'DRAG') {
      setOffset(id, dx, dy);
      void maybeReturnHome();
      return;
    }

    // FLY: update thrust continuously + optional snap-back visual.
    if (c.state === 'FLY') {
      setOffset(id, dx, dy);
      updateThrustFromOffset(id);
      void maybeReturnHome();
      return;
    }
  };

  const handlePointerUp = (id: ControlId, e: React.PointerEvent) => {
    e.stopPropagation();
    const c = stateRef.current[id];
    if (c.pointerId === null || e.pointerId !== c.pointerId) return;

    cancelHoldTimer(id);

    const now = performance.now();
    const moved = Math.hypot(c.offset.x, c.offset.y);

    // If this control was throttle, flight ends immediately on thumb-up.
    const s = stateRef.current;
    const wasThrottle = s.flightActive && s.throttle === id;

    if (c.state === 'FLY' || wasThrottle) {
      endFlightIfNeeded();
      // Snap back to resting position (do not commit the moved offset).
      resetControl(id);

      // If the other control was used for steering, snap it back too.
      const other: ControlId = id === 'blue' ? 'red' : 'blue';
      const oc = stateRef.current[other];
      if (oc.state === 'STEER' || oc.state === 'DRAG') {
        resetControl(other);
      }
      return;
    }

    if (c.state === 'STEER') {
      // End steering; snap back.
      resetControl(id);
      return;
    }

    if (c.state === 'DRAG') {
      // Commit reposition.
      if (moved > 0) {
        const home = getHome(id);
        const next = { x: home.x + c.offset.x, y: home.y + c.offset.y };
        if (id === 'blue') setBlueHome(next);
        else setRedHome(next);
      }
      resetControl(id);
      return;
    }

    // Tap / double tap. (Single tap does nothing by design.)
    if (c.state === 'PRESS') {
      const dt = now - c.pressT;
      const isTap = moved < DRAG_START_PX && dt < HOLD_ARM_MS;

      if (isTap) {
        const last = c.lastTapT || 0;
        const isDouble = now - last <= DOUBLE_TAP_MS;
        c.lastTapT = now;

        if (isDouble) {
          c.lastTapT = 0;
          if (id === 'blue') onDoubleTapBlue();
          else onDoubleTapRed();
        }
      }
    }

    resetControl(id);
  };

  // Defensive cleanup (pointercancel / window blur)
  useEffect(() => {
    const onBlur = () => {
      endFlightIfNeeded();
      resetControl('blue');
      resetControl('red');
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const InfinityHalf = ({ side }: { side: 'left' | 'right' }) => {
    // Inline SVG halves of an infinity symbol. Left half for blue, right for red.
    const flip = side === 'right';
    return (
      <svg width="40" height="18" viewBox="0 0 80 36" className="opacity-90">
        <g transform={flip ? 'translate(80,0) scale(-1,1)' : undefined}>
          <path
            d="M10 18c8-10 18-10 28 0s20 10 28 0"
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M10 18c8 10 18 10 28 0s20-10 28 0"
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  };

  const Control = ({ id, color }: { id: ControlId; color: string }) => {
    const home = getHome(id);
    return (
      <div
        ref={id === 'blue' ? blueEl : redEl}
        className="absolute rounded-full flex items-center justify-center select-none touch-none"
        style={{
          width: BTN,
          height: BTN,
          left: home.x,
          top: home.y,
          backgroundColor: color,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          border: '2px solid rgba(255,255,255,0.18)',
          willChange: 'transform',
        }}
        onPointerDown={(e) => handlePointerDown(id, e)}
        onPointerMove={(e) => handlePointerMove(id, e)}
        onPointerUp={(e) => handlePointerUp(id, e)}
        onPointerCancel={(e) => handlePointerUp(id, e)}
      >
        <InfinityHalf side={id === 'blue' ? 'left' : 'right'} />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="pointer-events-auto">
        <Control id="blue" color="rgba(59,130,246,0.92)" />
        <Control id="red" color="rgba(239,68,68,0.92)" />
      </div>
    </div>
  );
}
