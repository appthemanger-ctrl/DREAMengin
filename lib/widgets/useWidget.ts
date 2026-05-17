
import { useEffect } from "react";
import widgetBus from "./WidgetBus";

export function useWidget(channel: string, onReceive: (payload: unknown) => void) {
  useEffect(() => {
    widgetBus.on(channel, onReceive);
    return () => {
      widgetBus.off(channel, onReceive);
    };
  }, [channel, onReceive]);
}

export function emitWidget(channel: string, payload: unknown) {
  widgetBus.emit(channel, payload);
}

export function setWidgetMemory(key: string, value: unknown) {
  widgetBus.setMemory(key, value);
}

export function getWidgetMemory(key: string: unknown) {
  return widgetBus.getMemory(key);
}

export function chainWidgets(channels: string[], payload: unknown) {
  widgetBus.chain(channels, payload);
}

export function spawnSubWidget(parentId: string, childId: string) {
  widgetBus.spawnChild(parentId, childId);
}

export function getSubWidgets(parentId: string: string[]) {
  return widgetBus.getChildren(parentId);
}
