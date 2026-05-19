
import { useEffect } from "react";
import widgetBus from "./WidgetBus";

export function useWidget(channel: string, onReceive: (payload: any) => void) {
  useEffect(() => {
    widgetBus.on(channel, onReceive);
    return () => {
      widgetBus.off(channel, onReceive);
    };
  }, [channel, onReceive]);
}

export function emitWidget(channel: string, payload: unknown): void {
  widgetBus.emit(channel, payload);
}

export function setWidgetMemory(key: string, value: unknown): void {
  widgetBus.setMemory(key, value);
}

export function getWidgetMemory(key: string): unknown { // intentional - memory can be any type
  return widgetBus.getMemory(key);
}

export function chainWidgets(channels: string[], payload: unknown): void {
  widgetBus.chain(channels, payload);
}

export function spawnSubWidget(parentId: string, childId: any): void {
  widgetBus.spawnChild(parentId, childId);
}

export function getSubWidgets(parentId: string): string[] {
  return widgetBus.getChildren(parentId);
}