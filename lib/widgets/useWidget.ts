
import { useEffect, useCallback } from "react";
import widgetBus from "./WidgetBus";

// ---- Core pub/sub hook (existing) ----

export function useWidget(channel: string, onReceive: (payload: any) => void) {
  useEffect(() => {
    widgetBus.on(channel, onReceive);
    return () => {
      widgetBus.off(channel, onReceive);
    };
  }, [channel, onReceive]);
}

export function emitWidget(channel: string, payload: any) {
  widgetBus.emit(channel, payload);
}

// ---- Shared Memory hook (§11) ----

export function useSharedMemory<T = unknown>(key: string): {
  get: () => T | undefined;
  set: (value: T) => void;
  clear: () => void;
} {
  return {
    get: useCallback(() => widgetBus.getMemory<T>(key), [key]),
    set: useCallback((value: T) => widgetBus.setMemory(key, value), [key]),
    clear: useCallback(() => widgetBus.clearMemory(key), [key]),
  };
}

// ---- Chain trigger helper (§11) ----

export { default as widgetBus } from "./WidgetBus";
