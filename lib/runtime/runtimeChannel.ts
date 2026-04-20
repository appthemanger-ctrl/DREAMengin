/**
 * runtimeChannel — solo-parity adapter for shared runtimes.
 *
 * Pass 5 (Shared Runtime) requires that an Engin's UI does not know whether
 * it is running solo or co-op. Both modes use the same component tree, the
 * same event hooks, and the same persistence — only the channel adapter
 * differs.
 *
 *   - LocalChannel    → in-memory pub/sub. The default. No network.
 *   - RealtimeChannel → Supabase Realtime broadcast wrapper. Imported lazily
 *                       so Engins still build & run when Supabase is absent
 *                       (DEV_BYPASS_AUTH or unconfigured local stack).
 *
 * Contract:
 *   const ch: RuntimeChannel<MyEvent> = createLocalChannel('engin:starmaker:1');
 *   const off = ch.subscribe((evt) => { ... });
 *   await ch.publish({ type: 'note', value: 42 });
 *   off();
 *   await ch.close();
 *
 * Solo == Co-op with one peer. That is the entire point.
 */

export type RuntimeChannelEvent = Record<string, unknown>;

export interface RuntimeChannel<T extends RuntimeChannelEvent = RuntimeChannelEvent> {
  /** Stable channel identity (e.g. `engin:starmaker:42`). */
  readonly id: string;
  /** Adapter kind — useful for diagnostics / instrumentation. */
  readonly kind: 'local' | 'realtime';
  /** Publish an event to all subscribers (including this client). */
  publish: (event: T) => Promise<void>;
  /** Subscribe to events. Returns an unsubscribe function. */
  subscribe: (listener: (event: T) => void) => () => void;
  /** Tear down the channel and release any resources. */
  close: () => Promise<void>;
}

/**
 * In-memory channel. Synchronous fan-out, suitable for solo Engins and tests.
 */
export function createLocalChannel<T extends RuntimeChannelEvent = RuntimeChannelEvent>(
  id: string,
): RuntimeChannel<T> {
  const listeners = new Set<(event: T) => void>();
  let closed = false;

  return {
    id,
    kind: 'local',
    async publish(event) {
      if (closed) return;
      // Snapshot to be safe against listeners that unsubscribe mid-iteration.
      for (const fn of Array.from(listeners)) {
        try {
          fn(event);
        } catch (err) {
          // A faulty listener must not break sibling listeners.
          if (typeof console !== 'undefined') {
            console.error('[runtimeChannel] listener threw', err);
          }
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      closed = true;
      listeners.clear();
    },
  };
}

/**
 * Realtime channel options — kept minimal so we can grow the surface
 * incrementally without breaking solo callers.
 */
export interface RealtimeChannelOptions {
  /** Broadcast event name. Defaults to `'message'`. */
  eventName?: string;
}

/**
 * Lightweight Supabase Realtime wrapper. Falls back to a LocalChannel when
 * the Supabase client is not configured or fails to load — Engins keep
 * working solo with no network and no surprise crashes.
 *
 * The Supabase client is loaded *dynamically* so this module remains
 * tree-shakeable for solo-only entry points.
 */
export async function createRealtimeChannel<
  T extends RuntimeChannelEvent = RuntimeChannelEvent,
>(id: string, options: RealtimeChannelOptions = {}): Promise<RuntimeChannel<T>> {
  const eventName = options.eventName ?? 'message';

  // Dynamic import keeps the solo path free of Supabase weight.
  let client: unknown;
  try {
    const mod: Record<string, unknown> = await import('@supabase/supabase-js').catch(
      () => ({}) as Record<string, unknown>,
    );
    // We deliberately do not assume a project-specific factory — callers in
    // the wider app can wrap this with their own client. If nothing is
    // available we degrade to a LocalChannel.
    client = (mod as { supabase?: unknown }).supabase ?? null;
  } catch {
    client = null;
  }

  if (!client || typeof (client as { channel?: unknown }).channel !== 'function') {
    // Graceful fallback. Solo-equivalent semantics.
    const local = createLocalChannel<T>(id);
    return { ...local, kind: 'realtime' };
  }

  const supabase = client as {
    channel: (name: string) => {
      on: (
        type: 'broadcast',
        opts: { event: string },
        cb: (payload: { payload: T }) => void,
      ) => unknown;
      send: (msg: { type: 'broadcast'; event: string; payload: T }) => Promise<unknown>;
      subscribe: (cb?: (status: string) => void) => unknown;
      unsubscribe: () => Promise<unknown>;
    };
  };

  const listeners = new Set<(event: T) => void>();
  const ch = supabase.channel(id);
  ch.on('broadcast', { event: eventName }, ({ payload }) => {
    for (const fn of Array.from(listeners)) {
      try {
        fn(payload);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.error('[runtimeChannel] realtime listener threw', err);
        }
      }
    }
  });
  ch.subscribe();

  return {
    id,
    kind: 'realtime',
    async publish(event) {
      // Mirror locally so the publisher receives its own event (parity with
      // LocalChannel and Supabase Realtime presence semantics).
      for (const fn of Array.from(listeners)) {
        try {
          fn(event);
        } catch {
          /* swallowed above */
        }
      }
      await ch.send({ type: 'broadcast', event: eventName, payload: event });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      listeners.clear();
      await ch.unsubscribe();
    },
  };
}

/**
 * Convenience factory — picks the right adapter for the given mode.
 * Solo Engins use this with `mode: 'solo'`; co-op Engins flip to `'shared'`.
 */
export async function createRuntimeChannel<
  T extends RuntimeChannelEvent = RuntimeChannelEvent,
>(
  id: string,
  mode: 'solo' | 'shared',
  options: RealtimeChannelOptions = {},
): Promise<RuntimeChannel<T>> {
  if (mode === 'solo') return createLocalChannel<T>(id);
  return createRealtimeChannel<T>(id, options);
}
