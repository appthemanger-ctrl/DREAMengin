'use client';

import React, { createContext, useContext, useReducer } from 'react';
import type { Action, Node } from '@/lib/dreamnav/delta';
import { DEFAULT_NAV_STATE, reduceNav } from '@/lib/dreamnav/delta';

interface DreamNavCtx {
  node: Node;
  dispatch: (action: Action) => void;
}

const DreamNavContext = createContext<DreamNavCtx | null>(null);

export function DreamNavProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reduceNav, DEFAULT_NAV_STATE);

  return (
    <DreamNavContext.Provider value={{ node: state.node, dispatch }}>
      {children}
    </DreamNavContext.Provider>
  );
}

export function useDreamNav(): DreamNavCtx {
  const ctx = useContext(DreamNavContext);
  if (!ctx) throw new Error('useDreamNav must be used inside <DreamNavProvider>');
  return ctx;
}
