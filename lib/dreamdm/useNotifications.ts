/**
 * useNotifications — fetch unread notification count for the current user.
 *
 * Polls `/api/notifications?unread_only=true` on mount and every POLL_INTERVAL_MS.
 * The returned `unreadCount` drives the badge on `<DreamDMBar>`.
 *
 * Architecture note: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Privacy: reads only the current user's notifications (RLS at DB layer).
 *
 * docs/dreamdm_bar_pass2.md §2.3 — Unread Count and Notification Integration
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL_MS = 60_000;
// ── Improvement 85: adaptive polling ────────────────────────────────────────
/** Poll more aggressively when there are unread notifications */
const ACTIVE_POLL_INTERVAL_MS = 30_000;
/** Maximum backoff interval on consecutive errors */
const MAX_BACKOFF_MS = 5 * 60_000;

interface UseNotificationsReturn {
  unreadCount: number;
  /** Optimistically set the unread count to zero (e.g., when navigating to /messages) */
  markAllRead: () => void;
  /** Trigger an immediate re-fetch */
  refresh: () => void;
  /** ── Improvement 86: lastRefreshedAt ─────────────────────────────────── */
  lastRefreshedAt: number | null;
  /** ── Improvement 87: consecutive poll errors ───────────────────────────
   * Number of consecutive poll failures. Reset to 0 on success. */
  pollErrors: number;
}

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [pollErrors, setPollErrors] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollErrorsRef = useRef(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unread_only=true&limit=1');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.unread_count === 'number') {
        setUnreadCount(data.unread_count);
      }
      // ── Improvement 86: track last refresh ────────────────────────────
      setLastRefreshedAt(Date.now());
      // ── Improvement 87: reset error counter on success ────────────────
      pollErrorsRef.current = 0;
      setPollErrors(0);
    } catch {
      // ── Improvement 87: exponential backoff on failure ─────────────────
      pollErrorsRef.current++;
      setPollErrors(pollErrorsRef.current);
      // Network error — keep last known count
    }
  }, []);

  useEffect(() => {
    fetchCount();

    const schedule = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // ── Improvement 85: adaptive interval ─────────────────────────────
      // When errors accumulate, back off exponentially up to MAX_BACKOFF_MS.
      // When unread notifications are present, poll more frequently.
      const backoff = pollErrorsRef.current > 0
        ? Math.min(POLL_INTERVAL_MS * Math.pow(2, pollErrorsRef.current - 1), MAX_BACKOFF_MS)
        : 0;
      const interval = backoff > 0
        ? backoff
        : unreadCount > 0
          ? ACTIVE_POLL_INTERVAL_MS
          : POLL_INTERVAL_MS;
      intervalRef.current = setInterval(fetchCount, interval);
    };

    schedule();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount, unreadCount]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, markAllRead, refresh: fetchCount, lastRefreshedAt, pollErrors };
}
