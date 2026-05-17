/**
 * Local Event Bus — No Global Bridge
 *
 * Each engine assembly gets its own createEventBus() instance.
 * Modules communicate only when explicitly wired inside that engine.
 * The bus is passed to modules via dependency injection.
 *
 * Feature 42: Dual runtime hub creates a second bus and forwards
 * messages between sides.
 */

export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventBus<Events extends Record<string, unknown> = Record<string, unknown>> {
  /** Emit an event with a typed payload */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  /** Subscribe to an event */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  /** Unsubscribe from an event */
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  /** Subscribe once — automatically removed after first call */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  /** Remove all listeners for an event, or all listeners if no event given */
  clear(event?: keyof Events): void;
  /** List all active event names */
  events(): Array<keyof Events>;
}

/**
 * Factory — creates an isolated event bus instance.
 * Pass the returned bus to modules via dependency injection.
 *
 * @example
 * const bus = createEventBus<{ 'audio:play': { trackId: string }; 'audio:stop': void }>();
 * bus.on('audio:play', ({ trackId }) => console.log(trackId));
 * bus.emit('audio:play', { trackId: 'abc' });
 */
export function createEventBus<
  Events extends Record<string, unknown> = Record<string, unknown>,
>(): EventBus<Events> {
  const listeners = new Map<keyof Events, Set<EventHandler<unknown>>>();

  function getSet(event: keyof Events: Set<EventHandler<unknown>> {
    let s = listeners.get(event);
    if (!s) {
      s = new Set();
      listeners.set(event, s);
    }
    return s;
  }

  return {
    emit<K extends keyof Events>(event: K, payload: Events[K]) {
      const s = listeners.get(event);
      if (s) {
        for (const handler of s) {
          handler(payload);
        }
      }
    },

    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      getSet(event).add(handler as EventHandler<unknown>);
    },

    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      listeners.get(event)?.delete(handler as EventHandler<unknown>);
    },

    once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      const wrapper: EventHandler<unknown> = payload: Record<string, unknown> => {
        handler(payload as Events[K]);
        listeners.get(event)?.delete(wrapper);
      };
      getSet(event).add(wrapper);
    },

    clear(event?: keyof Events) {
      if (event !== undefined) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },

    events(): Array<keyof Events> {
      return Array.from(listeners.keys());
    },
  };
}

/**
 * Dual Runtime Hub bridge — forwards events from busA to busB and vice versa.
 * Used by the "Dual Runtime Hub" piece in Engin Forge assemblies.
 *
 * Returns a dispose function that tears down the forwarding.
 */
export function bridgeBuses(
  busA: EventBus,
  busB: EventBus,
  /** Events to forward from A → B */
  aToB: string[],
  /** Events to forward from B → A */
  bToA: string[],
): () => void {
  const forwardersAtoB = new Map<string, EventHandler<unknown>>();
  const forwardersBtoA = new Map<string, EventHandler<unknown>>();

  for (const event of aToB) {
    const fwd: EventHandler<unknown> = payload: Record<string, unknown> => busB.emit(event, payload);
    busA.on(event, fwd);
    forwardersAtoB.set(event, fwd);
  }

  for (const event of bToA) {
    const fwd: EventHandler<unknown> = payload: Record<string, unknown> => busA.emit(event, payload);
    busB.on(event, fwd);
    forwardersBtoA.set(event, fwd);
  }

  return () => {
    for (const [event, fwd] of forwardersAtoB) busA.off(event, fwd);
    for (const [event, fwd] of forwardersBtoA) busB.off(event, fwd);
  };
}
