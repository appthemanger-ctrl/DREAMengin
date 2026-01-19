import { FloatingModule } from "./FloatingModule";
import { ModuleId, WindowState, moduleIds } from "@shared/schema";

interface ModuleLayerProps {
  windows: Record<string, WindowState>;
  focusMode: boolean;
  onClose: (id: ModuleId) => void;
  onMinimize: (id: ModuleId) => void;
  onBringToFront: (id: ModuleId) => void;
  onUpdatePosition: (id: ModuleId, x: number, y: number) => void;
  onUpdateSize: (id: ModuleId, w: number, h: number) => void;
}

import { InnerDreamsAI } from "./InnerDreamsAI";

export function ModuleLayer({
  windows,
  focusMode,
  onClose,
  onMinimize,
  onBringToFront,
  onUpdatePosition,
  onUpdateSize,
}: ModuleLayerProps) {
  if (focusMode) {
    return null;
  }

  const openModules = moduleIds.filter((id) => windows[id]?.open);

  return (
    <>
      {openModules.map((id) => {
        const commonProps = {
          key: id,
          id,
          windowState: windows[id],
          onClose: () => onClose(id),
          onMinimize: () => onMinimize(id),
          onBringToFront: () => onBringToFront(id),
          onUpdatePosition: (x: number, y: number) => onUpdatePosition(id, x, y),
          onUpdateSize: (w: number, h: number) => onUpdateSize(id, w, h),
        };

        if (id === "ai_architect") {
          return <InnerDreamsAI {...commonProps} />;
        }

        return <FloatingModule {...commonProps} />;
      })}
    </>
  );
}
