'use client';
/**
 * DreamRCore — the "Brain" reactor for the DreamR remote-control architecture.
 *
 * Lives inside the DreamR surface. Listens for DR_ACTION events emitted
 * by HomeDream (the "Remote") over the Dual Runtime Bridge, then executes
 * ledger logic: discovery check → tally update.
 *
 * Architecture: Remote-Control pattern (docs/ARCHITECTURE.md §1)
 *   HomeDream  = touch interface (emits DR_ACTION)
 *   DreamRCore = logic reactor   (receives DR_ACTION, writes to ledger)
 *
 * Privacy: no raw user data in bridge payloads — only IDs (AXIOM 4).
 */

import { useEffect } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

interface Props {
  sharerId: string;
}

export default function DreamRCore() { sharerId }: Props {
  useEffect(() => {
    // bridge.subscribe(channel, event, handler) → returns UnsubscribeFn
    const subs = [
      bridge.subscribe('create', 'create:published', payload: Record<string, unknown> => {
        const contentId = typeof payload['contentId'] === 'string' ? payload['contentId'] : '';
        console.log('[DreamRCore] Published:', contentId, 'via sharer', sharerId);
        void fetch('/api/dreamr/tally', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId, sharerId }),
        }).catch(() => {/* non-fatal */});
      }),

      bridge.subscribe('games', 'games:achievement-unlocked', payload: Record<string, unknown> => {
        const title = typeof payload['title'] === 'string' ? payload['title'] : 'Achievement';
        console.log('[DreamRCore] Game achievement:', title);
      }),

      bridge.subscribe('music', 'music:session-end', payload: Record<string, unknown> => {
        const sessionId = typeof payload['sessionId'] === 'string' ? payload['sessionId'] : '';
        console.log('[DreamRCore] Music session ended:', sessionId);
      }),
    ];

    return () => subs.forEach((u: Record<string, unknown>) => u());
  }, [sharerId]);

  // Logic-only component — renders nothing
  return null;
}
