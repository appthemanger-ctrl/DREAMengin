// engin.eventbus — event-bus synchronization
// Typed pub/sub. No dream.* imports.

export type EnginEvent = {
  type: string;
  payload: unknown;
  sourceNamespace: 'dreamsurface';
};

type Handler = (e: EnginEvent) => void;

export interface EventBus {
  subscribe(type: string, handler: Handler): () => void;
  publish(e: EnginEvent): void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<Handler>>();

  function subscribe(type: string, handler: Handler): () => void {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(handler);
    return () => {
      listeners.get(type)?.delete(handler);
    };
  }

  function publish(e: EnginEvent): void {
    const handlers = listeners.get(e.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(e);
      }
    }
  }

  return { subscribe, publish };
}
