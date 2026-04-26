'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UserDreamLayout {
  home: { dreams: string[] };
  dreamspace: { dreams: string[] };
  hidden?: string[];
}

const DEFAULT_LAYOUT: UserDreamLayout = {
  home: { dreams: [] },
  dreamspace: { dreams: [] },
  hidden: [],
};

function normalizeLayout(value: unknown): UserDreamLayout {
  const obj = value && typeof value === 'object' ? value as Record<string, any> : {};
  return {
    home: { dreams: Array.isArray(obj.home?.dreams) ? obj.home.dreams.filter((id: unknown) => typeof id === 'string') : [] },
    dreamspace: { dreams: Array.isArray(obj.dreamspace?.dreams) ? obj.dreamspace.dreams.filter((id: unknown) => typeof id === 'string') : [] },
    hidden: Array.isArray(obj.hidden) ? obj.hidden.filter((id: unknown) => typeof id === 'string') : [],
  };
}

export function useDreamLayout() {
  const [layout, setLayout] = useState<UserDreamLayout>(DEFAULT_LAYOUT);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/user/layout', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    setLayout(normalizeLayout(payload.layout));
  }, []);

  const updateDreamLayout = useCallback((next: UserDreamLayout, debounceMs = 500) => {
    setLayout(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fetch('/api/user/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: next }),
      });
    }, debounceMs);
  }, []);

  const resetDreamLayout = useCallback(() => updateDreamLayout(DEFAULT_LAYOUT, 0), [updateDreamLayout]);

  useEffect(() => {
    void refresh();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [refresh]);

  return { layout, refresh, updateDreamLayout, resetDreamLayout };
}
