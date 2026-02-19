'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Action, NavState, Node } from '@/lib/dreamnav/delta';
import { DEFAULT_NAV_STATE, transition } from '@/lib/dreamnav/delta';
import { chooseAxisAction, type GCTDebug } from '@/lib/dreamnav/gctAssist';

type DreamNavApi = NavState & {
  dispatch: (a: Action) => void;
  navigateTo: (node: Node) => void;
  goBack: () => void;
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
const DOUBLE_TAP_MS = 280;
const TRIPLE_TAP_MS = 420;

export default function DreamNavSurface6({ debug = false, initialNode = 0, children }: { debug?: boolean; initialNode?: Node; children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>({ ...DEFAULT_NAV_STATE, node: initialNode });
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [gctDebug, setGctDebug] = useState<GCTDebug | null>(null);
  const [stageStyle, setStageStyle] = useState<React.CSSProperties>({ transform: 'translate3d(0,0,0) scale(1)', transition: 'none' });

  const pointerRef = useRef({ active: false, startX: 0, startY: 0, startAt: 0, lastX: 0, lastY: 0, lastAt: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, lastDist: 0 });
  const tapRef = useRef({ lastAt: 0, count: 0, timer: 0 as number | 0 });

  const isLocked = () => typeof window !== 'undefined' && Boolean((window as Window & { __deNavLocked?: boolean }).__deNavLocked);
  const isInScrollable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('[data-scrollable]'));

  const applyTransition = useCallback((action: Action) => {
    setLastAction(action);
    setNav((prev) => transition(prev, action));
  }, []);

  const navigateTo = useCallback((node: Node) => {
    setNav((prev) => ({ ...prev, node, heading: node === 0 ? null : prev.heading, lastNode: node === 0 ? null : prev.node }));
  }, []);

  const goBack = useCallback(() => applyTransition('go_back'), [applyTransition]);

  const animateCommit = useCallback((action: Action) => {
    if (action === 'home' || action === 'go_back') {
      applyTransition(action);
      return;
    }

    const distance = 44;
    const styleBase = { transition: 'transform 170ms ease-out' };
    if (action === 'swipe_left') setStageStyle({ ...styleBase, transform: `translate3d(${-distance}px,0,0) scale(1)` });
    else if (action === 'swipe_right') setStageStyle({ ...styleBase, transform: `translate3d(${distance}px,0,0) scale(1)` });
    else if (action === 'swipe_up') setStageStyle({ ...styleBase, transform: `translate3d(0,${-distance}px,0) scale(1)` });
    else if (action === 'swipe_down') setStageStyle({ ...styleBase, transform: `translate3d(0,${distance}px,0) scale(1)` });
    else if (action === 'depth_in') setStageStyle({ ...styleBase, transform: 'translate3d(0,0,0) scale(1.04)' });
    else if (action === 'depth_out') setStageStyle({ ...styleBase, transform: 'translate3d(0,0,0) scale(0.96)' });

    window.setTimeout(() => {
      applyTransition(action);
      setStageStyle({ transform: 'translate3d(0,0,0) scale(1)', transition: 'none' });
    }, 170);
  }, [applyTransition]);

  const dispatch = useCallback((action: Action) => {
    if (isLocked() && action !== 'home') return;
    animateCommit(action);
  }, [animateCommit]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked() && !isInScrollable(e.target)) {
      e.preventDefault();
      return;
    }
    if (isInScrollable(e.target)) return;

    e.preventDefault();
    pointerRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startAt: performance.now(),
      lastX: e.clientX,
      lastY: e.clientY,
      lastAt: performance.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.active || pinchRef.current.active) return;
    if (isLocked()) return;
    e.preventDefault();
    pointerRef.current.lastX = e.clientX;
    pointerRef.current.lastY = e.clientY;
    pointerRef.current.lastAt = performance.now();
  };

  const onPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.active || pinchRef.current.active) return;
    if (isLocked()) return;
    e.preventDefault();

    const p = pointerRef.current;
    const dx = p.lastX - p.startX;
    const dy = p.lastY - p.startY;
    const dt = Math.max(1, p.lastAt - p.startAt);
    const velocity = Math.hypot(dx, dy) / dt;
    pointerRef.current.active = false;

    if (Math.hypot(dx, dy) < SWIPE_DISTANCE_PX && velocity < VELOCITY_THRESHOLD) {
      const now = performance.now();
      const sinceLast = now - tapRef.current.lastAt;
      tapRef.current.lastAt = now;
      tapRef.current.count = sinceLast < DOUBLE_TAP_MS ? tapRef.current.count + 1 : 1;
      if (tapRef.current.timer) window.clearTimeout(tapRef.current.timer);
      tapRef.current.timer = window.setTimeout(() => {
        if (tapRef.current.count >= 3) animateCommit('depth_out');
        else if (tapRef.current.count === 2) animateCommit('depth_in');
        tapRef.current.count = 0;
      }, TRIPLE_TAP_MS);
      return;
    }

    const axisBias = Math.abs(Math.abs(dx) - Math.abs(dy));
    if (axisBias < 18) {
      const resolved = await chooseAxisAction({ dx, dy, magnitude: Math.hypot(dx, dy) });
      setGctDebug(resolved.debug);
      animateCommit(resolved.action === 'zoom_in' ? 'depth_in' : resolved.action === 'zoom_out' ? 'depth_out' : resolved.action);
      return;
    }

    setGctDebug(null);
    if (Math.abs(dx) >= Math.abs(dy)) animateCommit(dx < 0 ? 'swipe_left' : 'swipe_right');
    else animateCommit(dy < 0 ? 'swipe_up' : 'swipe_down');
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isInScrollable(e.target) || isLocked()) return;
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pinchRef.current = { active: true, startDist: d, lastDist: d };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current.active || e.touches.length !== 2) return;
    if (isLocked()) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    pinchRef.current.lastDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current.active || isLocked()) return;
    e.preventDefault();
    const { startDist, lastDist } = pinchRef.current;
    pinchRef.current.active = false;
    if (startDist <= 0) return;
    const scale = lastDist / startDist;
    if (scale > 1.08) animateCommit('depth_out');
    if (scale < 0.92) animateCommit('depth_in');
  };

  const api = useMemo(() => ({ ...nav, dispatch, navigateTo, goBack, lastAction }), [nav, dispatch, navigateTo, goBack, lastAction]);

  return (
    <Ctx.Provider value={api}>
      <div
        className="relative min-h-screen w-full overflow-hidden"
        style={{ touchAction: 'manipulation' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerRef.current.active = false; }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={stageStyle}>{children}</div>

        {debug && process.env.NODE_ENV !== 'production' ? (
          <div className="fixed left-3 top-3 z-50 rounded-xl bg-black/65 px-3 py-2 text-[11px] text-white">
            <div>node: {String(nav.node)}</div>
            <div>lastNode: {String(nav.lastNode)}</div>
            <div>stack: {nav.backStack?.join(',') || 'empty'}</div>
            <div>last: {lastAction ?? 'none'}</div>
            {gctDebug ? <div>gct: {gctDebug.used ? 'used' : 'fallback'} {gctDebug.selectedId ? `(${gctDebug.selectedId})` : ''}</div> : null}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}
