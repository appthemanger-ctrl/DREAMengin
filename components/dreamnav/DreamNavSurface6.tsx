'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Node, Dir } from '@/lib/dreamnav/delta';
import { delta } from '@/lib/dreamnav/delta';
import { create6DirGestureArbiter } from '@/lib/dreamnav/gestures6';

function isInteractiveTarget(t: EventTarget | null) {
  if (!(t instanceof Element)) return false;
  return Boolean(
    t.closest('a,button,input,textarea,select,[role="button"],[contenteditable="true"]')
  );
}

export default function DreamNavSurface6({
  children,
  initialNode = 0,
  debug = false,
}: {
  children: (node: Node) => React.ReactNode;
  initialNode?: Node;
  debug?: boolean;
}) {
  const [node, setNode] = useState<Node>(initialNode);

  // Used only for subtle "widgets move" animations.
  const [transition, setTransition] = useState<{ key: number; dir: Dir } | null>(null);

  const emit = (dir: Dir) => {
    setTransition({ key: Date.now(), dir });
    setNode((prev) => delta(prev, dir));
  };

  const arbiter = useMemo(() => create6DirGestureArbiter(emit), []);

    // Optional external controls (your draggable Home button can dispatch this).
  useEffect(() => {
    const onHome = () => {
      setTransition({ key: Date.now(), dir: 'OUT' });
      setNode(0);
    };

    window.addEventListener('dreamnav:home', onHome as EventListener);
    return () => {
      window.removeEventListener('dreamnav:home', onHome as EventListener);
    };
  }, []);


  // Pinch-to-zoom -> IN/OUT (maps to your δ table, no UI buttons).
  const pinch = useRef<{ active: boolean; lastDist: number; cooldownUntil: number }>({
    active: false,
    lastDist: 0,
    cooldownUntil: 0,
  });

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(e.target)) return;
    if (e.touches.length !== 2) {
      pinch.current.active = false;
      return;
    }

    // Prevent browser pinch-zoom (only when 2 touches are active).
    e.preventDefault();

    const now = performance.now();
    if (now < pinch.current.cooldownUntil) return;

    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    const dist = Math.hypot(dx, dy);

    if (!pinch.current.active) {
      pinch.current.active = true;
      pinch.current.lastDist = dist;
      return;
    }

    const deltaDist = dist - pinch.current.lastDist;

    // Threshold tuned to be intentional.
    const TH = 28;

    if (deltaDist > TH) {
      // Fingers apart => zoom in => IN
      pinch.current.cooldownUntil = now + 220;
      pinch.current.lastDist = dist;
      emit('IN');
    } else if (deltaDist < -TH) {
      // Fingers together => zoom out => OUT
      pinch.current.cooldownUntil = now + 220;
      pinch.current.lastDist = dist;
      emit('OUT');
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(e.target)) return;
    if (Math.abs(e.deltaY) < 2) return;
    // Treat wheel as zoom: down = OUT (zoom out), up = IN (zoom in)
    if (e.deltaY > 0) emit('OUT');
    else emit('IN');
  };

  return (
    <div
      className="min-h-screen"
      onPointerDown={(e) => {
        if (isInteractiveTarget(e.target)) return;
        arbiter.onPointerDown(e.nativeEvent);
      }}
      onPointerMove={(e) => arbiter.onPointerMove(e.nativeEvent)}
      onPointerUp={(e) => {
        if (isInteractiveTarget(e.target)) return;
        arbiter.onPointerUp(e.nativeEvent);
      }}
      onPointerCancel={(e) => arbiter.onPointerCancel(e.nativeEvent)}
      onWheel={onWheel}
      onTouchMove={onTouchMove}
      // Avoid aggressive touch-action; we only preventDefault during 2-touch pinch.
      style={{ touchAction: 'manipulation' }}
    >
      <div
        key={transition?.key ?? 0}
        className={`dreamnav-stage ${transition ? `dreamnav-slide-${transition.dir}` : ''}`}
      >
        {children(node)}
      </div>

      {debug ? (
        <div className="fixed top-4 left-4 z-50 text-xs bg-black/60 text-white px-3 py-2 rounded-xl">
          node: {String(node)}
        </div>
      ) : null}
    </div>
  );
}
