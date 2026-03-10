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

interface UseNotificationsReturn {
  unreadCount: number;
  /** Optimistically set the unread count to zero (e.g., when navigating to /messages) */
  markAllRead: () => void;
  /** Trigger an immediate re-fetch */
  refresh: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unread_only=true&limit=1');
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.unread_count === 'number') {
        setUnreadCount(data.unread_count);
      }
    } catch {
      // Network error — keep last known count
    }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, markAllRead, refresh: fetchCount };
}
