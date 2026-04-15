'use client';

/**
 * EnginProvider — Lightweight context provider for an engine app.
 *
 * Surfaces:
 *   - engineId    : slug identifying which engine (games | music | code | lab | brand | create)
 *   - accentColor : CSS hex color for this engine
 *   - isReady     : true once the shell has mounted
 *
 * Usage: wrap the engine's layout with <EnginProvider> so all child panels
 * can call useEngin() to read shared state without prop-drilling.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type EngineId = 'games' | 'music' | 'code' | 'lab' | 'brand' | 'create';

interface EnginContextValue {
  engineId: EngineId;
  accentColor: string;
  isReady: boolean;
}

const EnginContext = createContext<EnginContextValue | null>(null);

interface EnginProviderProps {
  engineId: EngineId;
  accentColor: string;
  children: ReactNode;
}

export function EnginProvider({ engineId, accentColor, children }: EnginProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Brief mount delay for smooth entrance animation
    const t = setTimeout(() => setIsReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <EnginContext.Provider value={{ engineId, accentColor, isReady }}>
      {children}
    </EnginContext.Provider>
  );
}

export function useEngin(): EnginContextValue {
  const ctx = useContext(EnginContext);
  if (!ctx) throw new Error('useEngin must be used inside <EnginProvider>');
  return ctx;
}
