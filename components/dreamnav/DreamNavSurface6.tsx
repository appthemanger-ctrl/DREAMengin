'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Action, Heading, NavState, Node } from '@/lib/dreamnav/delta';
import { DEFAULT_NAV_STATE, reduceNav } from '@/lib/dreamnav/delta';
import { createGestureArbiter } from '@/lib/dreamnav/gestures6';

type DreamNavApi = NavState & {
  dispatch: (a: Action) => void;
};

const Ctx = createContext<DreamNavApi | null>(null);

export function useDreamNav(): DreamNavApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDreamNav must be used within <DreamNavSurface6>');
  return ctx;
}

export default function DreamNavSurface6({
  debug = false,
  initialNode = 0,
  children,
}: {
  debug?: boolean;
  initialNode?: Node;
  children: React.ReactNode;
}) {
  // v2 spec: pinch is inspection-only; depth navigation is driven by the home controls.
  const ENABLE_PINCH_DEPTH = false;

  const [nav, setNav] = useState<NavState>(() => ({
    ...DEFAULT_NAV_STATE,
    node: initialNode,
  }));

  // Animation direction (CSS class). Cleared after animation end.
  const [anim, setAnim] = useState<Heading>(null);
  const pendingAnim = useRef<Heading>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const allowVerticalSwipeRef = useRef(true);

  const dispatch = useCallback((a: Action) => {
    setNav((prev) => {
      const next = reduceNav(prev, a);
      if (next.node !== prev.node) pendingAnim.current = next.heading;
      return next;
    });
  }, []);

  // When node changes, kick the CSS animation once.
  useEffect(() => {
    const h = pendingAnim.current;
    if (!h) return;

    pendingAnim.current = null;
    setAnim(null);
    requestAnimationFrame(() => setAnim(h));
  }, [nav.node]);

  const api = useMemo<DreamNavApi>(() => ({ ...nav, dispatch }), [nav, dispatch]);

  const computeAllowVertical = useCallback((e: PointerEvent) => {
    const gutter = 26;
    const w = window.innerWidth || 0;

    // Edge "gesture gutters" always allow vertical navigation.
    if (e.clientX <= gutter || e.clientX >= w - gutter) return true;

    // If the page is scrollable, do not steal vertical swipes from scroll.
    const doc = document.documentElement;
    if (doc && doc.scrollHeight > window.innerHeight + 8) return false;

    // If within a scrollable container, do not steal vertical swipes.
    const root = rootRef.current;
    let el = e.target as HTMLElement | null;
    while (el && el !== root) {
      const style = window.getComputedStyle(el);
      const oy = style.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 8) {
        return false;
      }
      el = el.parentElement;
    }

    return true;
  }, []);

  // Pointer swipe gestures
  const arbiter = useMemo(
    () =>
      createGestureArbiter(dispatch, {
        canEmitVertical: () => allowVerticalSwipeRef.current,
      }),
    [dispatch]
  );

  // HOME event hook (buttons / menus can fire it)
  useEffect(() => {
    const onHome = () => dispatch('home');
    window.addEventListener('dreamnav:home', onHome);
    return () => window.removeEventListener('dreamnav:home', onHome);
  }, [dispatch]);

  // Wheel pinch (trackpad) — prevent browser zoom; optional depth transitions.
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only interpret "pinch" (Ctrl+wheel) as a depth gesture.
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (!ENABLE_PINCH_DEPTH) return;
      dispatch(e.deltaY < 0 ? 'depth_in' : 'depth_out');
    },
    [dispatch, ENABLE_PINCH_DEPTH]
  );

  // Touch pinch => depth transitions (2-finger).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let startDist: number | null = null;
    let lastDist: number | null = null;

    const dist = (a: Touch, b: Touch) => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 2) {
        startDist = dist(ev.touches[0], ev.touches[1]);
        lastDist = startDist;
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (startDist == null) return;
      if (ev.touches.length !== 2) return;

      lastDist = dist(ev.touches[0], ev.touches[1]);

      // Prevent page zoom while we interpret this gesture.
      ev.preventDefault();
    };

    const onTouchEnd = () => {
      if (startDist == null || lastDist == null) return;

      const delta = lastDist - startDist;

      // Deadzone to avoid firing on incidental micro-motions.
      if (ENABLE_PINCH_DEPTH && Math.abs(delta) > 26) dispatch(delta > 0 ? 'depth_in' : 'depth_out');

      startDist = null;
      lastDist = null;
    };

    // Important: passive:false so preventDefault works on iOS Safari.
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
      el.removeEventListener('touchcancel', onTouchEnd as any);
    };
  }, [dispatch]);

  return (
    <Ctx.Provider value={api}>
      <div
        ref={rootRef}
        className="relative w-full min-h-screen overflow-x-hidden touch-none"
        onWheel={onWheel}
        onPointerDown={(e) => {
          allowVerticalSwipeRef.current = computeAllowVertical(e.nativeEvent);
          arbiter.onPointerDown(e.nativeEvent);
        }}
        onPointerMove={(e) => arbiter.onPointerMove(e.nativeEvent)}
        onPointerUp={(e) => arbiter.onPointerUp(e.nativeEvent)}
        onPointerCancel={(e) => arbiter.onPointerCancel(e.nativeEvent)}
      >
        <div
          className={['dreamnav-stage', anim ? `dreamnav-slide-${anim}` : ''].join(' ')}
          onAnimationEnd={() => setAnim(null)}
        >
          {children}
        </div>

        {debug ? (
          <div className="fixed top-3 left-3 z-50 text-[10px] bg-black/60 text-white px-3 py-2 rounded-xl">
            node: {String(nav.node)} {nav.heading ? `(${nav.heading})` : ''}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}
