
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

export function emitWidget(channel: string, payload: any) {
  widgetBus.emit(channel, payload);
}
