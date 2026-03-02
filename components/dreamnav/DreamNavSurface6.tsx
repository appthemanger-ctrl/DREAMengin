'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Action, NavState, Node } from '@/lib/dreamnav/delta';
import { DEFAULT_NAV_STATE, transition } from '@/lib/dreamnav/delta';

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

export default function DreamNavSurface6({ debug = false, initialNode = 0, children }: { debug?: boolean; initialNode?: Node; children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>({ ...DEFAULT_NAV_STATE, node: initialNode });
  const [lastAction, setLastAction] = useState<Action | null>(null);

  const applyTransition = useCallback((action: Action) => {
    setLastAction(action);
    setNav((prev) => transition(prev, action));
  }, []);

  const navigateTo = useCallback((node: Node) => {
    setNav((prev) => ({ ...prev, node, heading: node === 0 ? null : prev.heading, lastNode: node === 0 ? null : prev.node }));
  }, []);

  const goBack = useCallback(() => applyTransition('go_back'), [applyTransition]);

  const dispatch = useCallback((action: Action) => {
    applyTransition(action);
  }, [applyTransition]);

  const api = useMemo(() => ({ ...nav, dispatch, navigateTo, goBack, lastAction }), [nav, dispatch, navigateTo, goBack, lastAction]);

  return (
    <Ctx.Provider value={api}>
      <div className="relative min-h-screen w-full overflow-hidden">
        {children}

        {debug && process.env.NODE_ENV !== 'production' ? (
          <div className="fixed left-3 top-3 z-50 rounded-xl bg-black/65 px-3 py-2 text-[11px] text-white">
            <div>node: {String(nav.node)}</div>
            <div>lastNode: {String(nav.lastNode)}</div>
            <div>stack: {nav.backStack?.join(',') || 'empty'}</div>
            <div>last: {lastAction ?? 'none'}</div>
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}
