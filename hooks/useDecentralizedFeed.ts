'use client';

// hooks/useDecentralizedFeed.ts
// React hook for the decentralized social feed.
// Fetches from /api/social/decentralized and supports auto-refresh.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NormalizedPost } from '@/lib/social/decentralizedFeed';

interface DecentralizedFeedResponse {
  posts: NormalizedPost[];
  sources: string[];
}

export function useDecentralizedFeed(options?: {
  enabled?: boolean;
  refreshInterval?: number; // ms, default 60000
}): {
  posts: NormalizedPost[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  sources: string[];
} {
  const enabled = options?.enabled ?? true;
  const refreshInterval = options?.refreshInterval ?? 60_000;

  const [posts, setPosts] = useState<NormalizedPost[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!enabled) return;

    // Cancel any in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/social/decentralized', {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as DecentralizedFeedResponse;
      setPosts(data.posts ?? []);
      setSources(data.sources ?? []);
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;
    const id = setInterval(() => void fetchPosts(), refreshInterval);
    return () => clearInterval(id);
  }, [enabled, refreshInterval, fetchPosts]);

  return { posts, loading, error, refresh: fetchPosts, sources };
}
