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

export default function DreamRCore({ sharerId }: Props) {
  useEffect(() => {
    // Subscribe to the global event bus for DR_ACTION events from HomeDream
    const unsub = (bridge as unknown as {
      on?: (event: string, handler: (payload: unknown) => void) => void;
      off?: (event: string, handler: (payload: unknown) => void) => void;
      subscribeEventActivity?: (observer: (emission: { event: string; payload: unknown }) => void) => () => void;
    });

    // Use the typed bridge subscriptions for each interaction type
    const subs = [
      bridge.subscribe('create', 'create:published', (payload) => {
        // Content published from DreamR — update ledger
        console.log(`[DreamRCore] Published: ${payload.contentId} via sharer ${sharerId}`);
        // TODO: POST to /api/dreamr/tally with { contentId, sharerId }
      }),
    ];

    return () => subs.forEach((u) => u());
  }, [sharerId]);

  // Logic-only component — renders nothing
  return null;
}
