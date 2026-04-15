/**
 * Local Event Bus
 *
 * NOT a global singleton — each call to createEventBus() returns a
 * completely independent bus.  Engine assemblies receive their bus
 * via dependency injection.
 *
 * Usage:
 *   const bus = createEventBus<MyEvents>();
 *   bus.on('move', (pos) => console.log(pos));
 *   bus.emit('move', { x: 1, y: 2 });
 *   bus.destroy(); // clears all handlers
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventBus<Events extends Record<string, unknown> = Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  /** Remove all listeners and mark bus as destroyed. */
  destroy(): void;
  /** Whether destroy() has been called. */
  readonly destroyed: boolean;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * createEventBus<T>()
 *
 * Creates a new, scoped event bus.  Generic parameter T constrains
 * the event map so callers get typed payloads.
 */
export function createEventBus<
  Events extends Record<string, unknown> = Record<string, unknown>
>(): EventBus<Events> {
  const handlers = new Map<keyof Events, Set<EventHandler<unknown>>>();
  let _destroyed = false;

  function assertAlive() {
    if (_destroyed) throw new Error('EventBus: cannot use a destroyed bus.');
  }

  return {
    get destroyed() {
      return _destroyed;
    },

    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      assertAlive();
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler as EventHandler<unknown>);
    },

    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      handlers.get(event)?.delete(handler as EventHandler<unknown>);
    },

    emit<K extends keyof Events>(event: K, payload: Events[K]) {
      assertAlive();
      handlers.get(event)?.forEach((h) => h(payload));
    },

    destroy() {
      handlers.clear();
      _destroyed = true;
    },
  };
}

// ─── Dual-Runtime Hub ─────────────────────────────────────────────────────────

/**
 * createDualRuntimeHub(busA, busB)
 *
 * Creates an optional bridge that forwards every event emitted on
 * busA to busB and vice-versa (under a namespaced key to prevent
 * infinite loops).
 *
 * Returns a { stop() } handle to tear down the bridge.
 */
export function createDualRuntimeHub(
  busA: EventBus<Record<string, unknown>>,
  busB: EventBus<Record<string, unknown>>
): { stop(): void } {
  // We use a simple bridging pattern via a shared relay function.
  // Events forwarded across the bridge are tagged with `__bridged`
  // to prevent infinite re-forwarding.

  const bridgedKey = '__bridged';

  const relayAtoB: EventHandler<unknown> = (payload) => {
    if (
      payload !== null &&
      typeof payload === 'object' &&
      bridgedKey in (payload as object)
    )
      return;
    busB.emit('__bridge' as keyof Record<string, unknown>, {
      ...(payload as object),
      [bridgedKey]: true,
    });
  };

  const relayBtoA: EventHandler<unknown> = (payload) => {
    if (
      payload !== null &&
      typeof payload === 'object' &&
      bridgedKey in (payload as object)
    )
      return;
    busA.emit('__bridge' as keyof Record<string, unknown>, {
      ...(payload as object),
      [bridgedKey]: true,
    });
  };

  busA.on('__bridge' as keyof Record<string, unknown>, relayAtoB);
  busB.on('__bridge' as keyof Record<string, unknown>, relayBtoA);

  return {
    stop() {
      busA.off('__bridge' as keyof Record<string, unknown>, relayAtoB);
      busB.off('__bridge' as keyof Record<string, unknown>, relayBtoA);
    },
  };
}
