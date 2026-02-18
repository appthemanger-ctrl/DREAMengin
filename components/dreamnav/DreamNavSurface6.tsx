'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Action, NavState, Node } from '@/lib/dreamnav/tau';
import { DEFAULT_NAV_STATE, transition } from '@/lib/dreamnav/tau';
import { chooseAxisAction, type GCTDebug } from '@/lib/dreamnav/gctAssist';

type DreamNavApi = NavState & {
  dispatch: (a: Action) => void;
  navigateTo: (node: Node) => void;
  lastAction: Action | null;
};

const Ctx = createContext<DreamNavApi | null>(null);

export function useDreamNav(): DreamNavApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDreamNav must be used within <DreamNavSurface6>');
  return ctx;
}

const SWIPE_DISTANCE_PX = 45;
const VELOCITY_THRESHOLD = 0.45;
const ZOOM_IN_THRESHOLD = 0.92;
const ZOOM_OUT_THRESHOLD = 1.08;

export default function DreamNavSurface6({ debug = false, initialNode = 0, children }: { debug?: boolean; initialNode?: Node; children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>({ ...DEFAULT_NAV_STATE, node: initialNode });
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [gctDebug, setGctDebug] = useState<GCTDebug | null>(null);
  const [stageStyle, setStageStyle] = useState<React.CSSProperties>({ transform: 'translate3d(0,0,0) scale(1)', transition: 'none' });

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ active: false, startX: 0, startY: 0, startAt: 0, lastX: 0, lastY: 0, lastAt: 0, moved: false });
  const pinchRef = useRef({ active: false, startDist: 0, lastDist: 0 });

  const applyTransition = useCallback((action: Action) => {
    setLastAction(action);
    setNav((prev) => transition(prev, action));
  }, []);

  const navigateTo = useCallback((node: Node) => {
    setNav((prev) => ({ node, heading: node === 0 ? null : prev.heading }));
  }, []);

  const animateCommit = useCallback((action: Action) => {
    const distance = 44;
    const styleBase = { transition: 'transform 170ms ease-out' };
    if (action === 'swipe_left') setStageStyle({ ...styleBase, transform: `translate3d(${-distance}px,0,0) scale(1)` });
    else if (action === 'swipe_right') setStageStyle({ ...styleBase, transform: `translate3d(${distance}px,0,0) scale(1)` });
    else if (action === 'swipe_up') setStageStyle({ ...styleBase, transform: `translate3d(0,${-distance}px,0) scale(1)` });
    else if (action === 'swipe_down') setStageStyle({ ...styleBase, transform: `translate3d(0,${distance}px,0) scale(1)` });
    else if (action === 'zoom_in') setStageStyle({ ...styleBase, transform: 'translate3d(0,0,0) scale(1.06)' });
    else if (action === 'zoom_out') setStageStyle({ ...styleBase, transform: 'translate3d(0,0,0) scale(0.94)' });

    window.setTimeout(() => {
      applyTransition(action);
      setStageStyle({ transform: 'translate3d(0,0,0) scale(1)', transition: 'none' });
    }, 170);
  }, [applyTransition]);

  const dispatch = useCallback((action: Action) => {
    animateCommit(action);
  }, [animateCommit]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.pointerType === 'touch' && (e.nativeEvent as PointerEvent).isPrimary === false) return;
    pointerRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startAt: performance.now(),
      lastX: e.clientX,
      lastY: e.clientY,
      lastAt: performance.now(),
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (!p.active || pinchRef.current.active) return;
    e.preventDefault();
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.lastAt = performance.now();
    if (!p.moved && Math.hypot(p.lastX - p.startX, p.lastY - p.startY) > 2) p.moved = true;
  };

  const onPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (!p.active || pinchRef.current.active) return;
    e.preventDefault();

    const dx = p.lastX - p.startX;
    const dy = p.lastY - p.startY;
    const dt = Math.max(1, p.lastAt - p.startAt);
    const velocity = Math.hypot(dx, dy) / dt;
    pointerRef.current.active = false;

    if (Math.hypot(dx, dy) < SWIPE_DISTANCE_PX && velocity < VELOCITY_THRESHOLD) return;

    const axisBias = Math.abs(Math.abs(dx) - Math.abs(dy));
    if (axisBias < 18) {
      const resolved = await chooseAxisAction({ dx, dy, magnitude: Math.hypot(dx, dy) });
      setGctDebug(resolved.debug);
      animateCommit(resolved.action);
      return;
    }

    setGctDebug(null);
    if (Math.abs(dx) >= Math.abs(dy)) {
      animateCommit(dx < 0 ? 'swipe_left' : 'swipe_right');
      return;
    }
    animateCommit(dy < 0 ? 'swipe_up' : 'swipe_down');
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pinchRef.current = { active: true, startDist: d, lastDist: d };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current.active || e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    pinchRef.current.lastDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current.active) return;
    e.preventDefault();
    const { startDist, lastDist } = pinchRef.current;
    pinchRef.current.active = false;
    if (startDist <= 0) return;
    const scale = lastDist / startDist;
    if (scale > ZOOM_OUT_THRESHOLD) animateCommit('zoom_out');
    if (scale < ZOOM_IN_THRESHOLD) animateCommit('zoom_in');
  };

  const api = useMemo(() => ({ ...nav, dispatch, navigateTo, lastAction }), [nav, dispatch, navigateTo, lastAction]);

  return (
    <Ctx.Provider value={api}>
      <div
        ref={surfaceRef}
        className="relative min-h-screen w-full overflow-hidden touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerRef.current.active = false;
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={stageStyle}>{children}</div>

        {debug && process.env.NODE_ENV !== 'production' ? (
          <div className="fixed left-3 top-3 z-50 rounded-xl bg-black/65 px-3 py-2 text-[11px] text-white">
            <div>node: {String(nav.node)}</div>
            <div>last: {lastAction ?? 'none'}</div>
            {gctDebug ? <div>gct: {gctDebug.used ? 'used' : 'fallback'} {gctDebug.selectedId ? `(${gctDebug.selectedId})` : ''}</div> : null}
            {gctDebug?.scores?.length ? (
              <div className="mt-1 text-[10px] text-white/80">
                {gctDebug.scores.map((score) => `${score.id}:${score.correlation}`).join(' · ')}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}
