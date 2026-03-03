'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedItem } from './types';

const ACTIVE_KEY = 'dreamengin:dreams:active';

function loadActive(): Set<string> {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

export function saveActive(ids: Set<string>) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify([...ids])); } catch { /* noop */ }
}

async function fetchNewsFeed(): Promise<FeedItem[]> {
  try {
    const res = await fetch('/api/news?limit=30');
    if (!res.ok) return [];
    const data = await res.json() as { stories?: Array<{ id: number; title: string; url?: string; by: string; score: number; descendants?: number; time: number }> };
    return (data.stories ?? []).map((s) => ({
      id: `news-${s.id}`,
      dreamId: 'news',
      dreamIcon: '📰',
      dreamLabel: 'Hacker News',
      type: 'news' as const,
      title: s.title,
      subtitle: s.url ? (() => { try { return new URL(s.url!).hostname.replace('www.',''); } catch { return ''; } })() : undefined,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      timestamp: s.time * 1000,
      score: s.score,
      comments: s.descendants ?? 0,
    }));
  } catch { return []; }
}

// Each dream connector returns items when that dream is active.
// Extend this map to plug in real connectors (Spotify, YouTube, etc.).
const CONNECTORS: Record<string, () => Promise<FeedItem[]>> = {
  news: fetchNewsFeed,
  music: async () => [{
    id: 'music-now', dreamId: 'music', dreamIcon: '🎵', dreamLabel: 'Music',
    type: 'music', title: 'New releases ready to explore',
    subtitle: 'DREAMengin Music Studio', timestamp: Date.now() - 60_000,
  }],
  messages: async () => [{
    id: 'msg-1', dreamId: 'messages', dreamIcon: '💬', dreamLabel: 'Messages',
    type: 'message', title: 'Your inbox is connected',
    subtitle: 'Tap to view messages', timestamp: Date.now() - 120_000,
    url: '/messages',
  }],
  analytics: async () => [{
    id: 'analytics-1', dreamId: 'analytics', dreamIcon: '📊', dreamLabel: 'Analytics',
    type: 'metric', title: 'Dashboard ready',
    subtitle: 'View your latest insights', timestamp: Date.now() - 180_000,
    url: '/analytics',
  }],
  games: async () => [{
    id: 'games-1', dreamId: 'games', dreamIcon: '🎮', dreamLabel: 'Games',
    type: 'game', title: 'Games loaded',
    subtitle: 'Tap to play', timestamp: Date.now() - 240_000,
    url: '/daydream/games',
  }],
};

export function useDreamFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [active, setActiveState] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (ids: Set<string>) => {
    setLoading(true);
    const results = await Promise.all(
      [...ids].map((id) => (CONNECTORS[id] ? CONNECTORS[id]() : Promise.resolve([])))
    );
    const merged = results.flat().sort((a, b) => b.timestamp - a.timestamp);
    setItems(merged);
    setLoading(false);
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const ids = loadActive();
    setActiveState(ids);
    if (ids.size > 0) {
      void refresh(ids);
      // Auto-refresh active dreams every 5 minutes
      timerRef.current = setInterval(() => { void refresh(ids); }, 5 * 60_000);
    } else {
      setLoading(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  const toggleDream = useCallback((dreamId: string) => {
    setActiveState((prev) => {
      const next = new Set(prev);
      if (next.has(dreamId)) next.delete(dreamId); else next.add(dreamId);
      saveActive(next);
      void refresh(next);
      return next;
    });
  }, [refresh]);

  const forceRefresh = useCallback(() => { void refresh(active); }, [refresh, active]);

  return { items, active, loading, toggleDream, forceRefresh };
}
