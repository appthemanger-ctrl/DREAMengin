'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type UserOverrides,
  type StoredTheme,
  DEFAULT_OVERRIDES,
  THEME_PRESETS,
  applyTheme,
  loadStoredTheme,
  saveTheme,
  getPreset,
} from '@/lib/ui/theme-engine';

interface ThemeContextValue {
  presetId: string;
  overrides: UserOverrides;
  setPreset: (id: string) => void;
  setOverrides: (o: Partial<UserOverrides>) => void;
  resetOverrides: () => void;
  starfieldStyle: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState('dream-ice');
  const [overrides, setOverridesState] = useState<UserOverrides>(DEFAULT_OVERRIDES);
  const [mounted, setMounted] = useState(false);

  // Load stored theme on mount
  useEffect(() => {
    const stored = loadStoredTheme();
    setPresetIdState(stored.presetId);
    setOverridesState(stored.overrides);
    applyTheme(stored.presetId, stored.overrides);
    setMounted(true);
  }, []);

  const setPreset = useCallback((id: string) => {
    setPresetIdState(id);
    setOverridesState((prev) => {
      applyTheme(id, prev);
      saveTheme(id, prev);
      return prev;
    });
  }, []);

  const setOverrides = useCallback((partial: Partial<UserOverrides>) => {
    setOverridesState((prev) => {
      const next = { ...prev, ...partial };
      applyTheme(presetId, next);
      saveTheme(presetId, next);
      return next;
    });
  }, [presetId]);

  const resetOverrides = useCallback(() => {
    setOverridesState(DEFAULT_OVERRIDES);
    applyTheme(presetId, DEFAULT_OVERRIDES);
    saveTheme(presetId, DEFAULT_OVERRIDES);
  }, [presetId]);

  const starfieldStyle = useMemo(() => getPreset(presetId).tokens.starfieldStyle, [presetId]);

  const value = useMemo<ThemeContextValue>(
    () => ({ presetId, overrides, setPreset, setOverrides, resetOverrides, starfieldStyle }),
    [presetId, overrides, setPreset, setOverrides, resetOverrides, starfieldStyle],
  );

  // Apply default theme immediately on SSR to prevent flash
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
