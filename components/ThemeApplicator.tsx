'use client';

import { useEffect } from 'react';

export interface DeTheme {
  from:  string;
  mid:   string;
  to:    string;
  angle: string;
  btnFrom: string;
  btnTo:   string;
}

export const THEME_PRESETS: Record<string, { label: string; emoji: string; theme: DeTheme }> = {
  default: {
    label: 'Sky & Gold',
    emoji: '🌤️',
    theme: { from: '#c8dff5', mid: '#d8eaf8', to: '#f5e8c4', angle: '148deg', btnFrom: '#2a8ab8', btnTo: '#c8981a' },
  },
  ocean: {
    label: 'Ocean & Coral',
    emoji: '🌊',
    theme: { from: '#b8e0f7', mid: '#cce8f5', to: '#fde8d8', angle: '160deg', btnFrom: '#0e7ab8', btnTo: '#e05a3a' },
  },
  aurora: {
    label: 'Aurora',
    emoji: '🌌',
    theme: { from: '#c5d8f8', mid: '#d8e4f8', to: '#e8d4f8', angle: '145deg', btnFrom: '#4a70d8', btnTo: '#a855d8' },
  },
  sunrise: {
    label: 'Sunrise',
    emoji: '🌅',
    theme: { from: '#fde8c8', mid: '#fdf0d8', to: '#c8dff5', angle: '175deg', btnFrom: '#e8881a', btnTo: '#2a8ab8' },
  },
  mint: {
    label: 'Mint & Sky',
    emoji: '🌿',
    theme: { from: '#c8f0e8', mid: '#d8f0ef', to: '#c8dff5', angle: '150deg', btnFrom: '#0aa880', btnTo: '#2a8ab8' },
  },
};

export function applyTheme(theme: DeTheme) {
  const root = document.documentElement;
  root.style.setProperty('--de-theme-from',    theme.from);
  root.style.setProperty('--de-theme-mid',     theme.mid);
  root.style.setProperty('--de-theme-to',      theme.to);
  root.style.setProperty('--de-theme-angle',   theme.angle);
  root.style.setProperty('--de-theme-btn-from', theme.btnFrom);
  root.style.setProperty('--de-theme-btn-to',   theme.btnTo);
}

export default function ThemeApplicator() {
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('de-theme');
        if (raw) applyTheme(JSON.parse(raw) as DeTheme);
      } catch { /* ignore */ }
    };
    load();
    window.addEventListener('de-theme-changed', load);
    return () => window.removeEventListener('de-theme-changed', load);
  }, []);

  return null;
}
