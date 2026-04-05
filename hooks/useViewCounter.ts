'use client';

/**
 * useViewCounter — records a view for a feed post after it has been
 * visible (in the viewport) for at least DWELL_MS milliseconds (spec §3).
 *
 * Uses IntersectionObserver to detect visibility and a timer to measure dwell.
 * Once a view is recorded, the hook stops observing so each post counts once
 * per mount.
 *
 * @param postId  — the ID of the post being observed (the specific instance,
 *                  not necessarily the root post; the server resolves the root).
 * @param enabled — set false to suppress tracking (e.g. own profile preview).
 */

import { useEffect, useRef } from 'react';

/** Minimum time the post must be in the viewport before a view is counted. */
const DWELL_MS = 3000;

/** Intersection threshold — post must be ≥50% visible. */
const VISIBILITY_THRESHOLD = 0.5;

export function useViewCounter(
  ref: React.RefObject<Element | null>,
  postId: string | null | undefined,
  enabled = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    if (!postId || !enabled || !ref.current) return;

    const el = ref.current;

    /** Records the view by calling the server API. Fire-and-forget. */
    function recordView() {
      if (countedRef.current) return;
      countedRef.current = true;
      fetch(`/api/posts/${postId}/view`, { method: 'POST' }).catch(() => {
        // Silently ignore network errors — view count is best-effort.
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Start dwell timer.
          timerRef.current = setTimeout(() => {
            recordView();
            observer.unobserve(el);
          }, DWELL_MS);
        } else {
          // Post scrolled out before dwell completed — cancel timer.
          if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: VISIBILITY_THRESHOLD },
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [postId, enabled, ref]);
}
