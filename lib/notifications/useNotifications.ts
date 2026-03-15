'use client';

/**
 * lib/notifications/useNotifications.ts
 *
 * React hook: live notification feed wired to the real /api/notifications
 * backend.
 *
 * Architecture justification:
 *   - docs/AXIOMS.md: every visible action must do something real.
 *     The notification bell in WorkspaceDashboard showed a fake static dot.
 *     This hook replaces that with live data from the real DB table.
 *   - docs/ARCHITECTURE.md §10: render-on-demand — this hook polls only
 *     when the panel is open and on a fixed POLL_INTERVAL (not a tight loop).
 *   - docs/LAW.md §3: every visible action must do something real.
 *
 * Privacy: all reads are auth-gated server-side by /api/notifications (which
 * calls supabase.auth.getUser()). No client-side auth bypass.
 *
 * Performance: 30-second poll interval — light touch, respects battery rules
 * (docs/ARCHITECTURE.md §10 "render-on-demand pattern").
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyOptimisticDelete,
  applyOptimisticMarkAll,
  applyOptimisticRead,
  getUnreadCount,
  normalizeDbRow,
  sortByRecent,
  type DbNotificationRow,
  type UiNotification,
} from './notificationHelpers';

// Poll every 30 s — unobtrusive; follows render-on-demand spirit
const POLL_INTERVAL_MS = 30_000;

export interface UseNotificationsReturn {
  /** Sorted (newest-first), normalised notification list */
  notifications: UiNotification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** True on the first load before any data has arrived */
  isLoading: boolean;
  /** Non-null when the last fetch failed */
  error: string | null;
  /** Mark a single notification as read (optimistic + API) */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read (optimistic + API) */
  markAllAsRead: () => Promise<void>;
  /** Delete a single notification (optimistic + API) */
  deleteNotification: (id: string) => Promise<void>;
  /** Force a re-fetch right now */
  reload: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch from API ────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30', {
        credentials: 'include',
        // Prevent aggressive caching so the count is always fresh
        cache: 'no-store',
      });

      if (!res.ok) {
        // 401 → user is not logged in → silently stop, don't show error
        if (res.status === 401) {
          setIsLoading(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as Record<string, unknown>).error as string || `HTTP ${res.status}`,
        );
      }

      const data = await res.json() as {
        notifications?: DbNotificationRow[];
        unread_count?: number;
      };

      const rows: DbNotificationRow[] = data.notifications ?? [];
      const normalised = rows.map(normalizeDbRow);
      setNotifications(sortByRecent(normalised));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial load + polling ────────────────────────────────────────────────

  useEffect(() => {
    void fetchNotifications();

    timerRef.current = setInterval(() => {
      void fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchNotifications]);

  // ── Mark single as read ───────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update first
    setNotifications((prev) => applyOptimisticRead(prev, id));

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_ids: [id] }),
      });
    } catch {
      // Revert on failure by re-fetching
      void fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Mark all as read ──────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => applyOptimisticMarkAll(prev));

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mark_all: true }),
      });
    } catch {
      void fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Delete one notification ───────────────────────────────────────────────

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => applyOptimisticDelete(prev, id));

    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      void fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Expose ────────────────────────────────────────────────────────────────

  return {
    notifications,
    unreadCount: getUnreadCount(notifications),
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reload: fetchNotifications,
  };
}
