'use client';

import { useMemo, useState } from 'react';
import type { Node } from '@/lib/dreamnav/delta';
import { delta } from '@/lib/dreamnav/delta';
import { create6DirGestureArbiter } from '@/lib/dreamnav/gestures6';

function isInteractiveTarget(t: EventTarget | null) {
  if (!(t instanceof Element)) return false;
  return Boolean(
    t.closest(
      'a,button,input,textarea,select,[role="button"],[contenteditable="true"]'
    )
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

  const arbiter = useMemo(
    () => create6DirGestureArbiter((dir) => setNode((prev) => delta(prev, dir))),
    []
  );

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
      style={{ touchAction: 'manipulation' }}
    >
      {children(node)}
      {debug ? (
        <div className="fixed top-4 left-4 z-50 text-xs bg-black/60 text-white px-3 py-2 rounded-xl">
          node: {String(node)}
        </div>
      ) : null}
    </div>
  );
}
