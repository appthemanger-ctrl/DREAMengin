import { useState, useRef, useCallback, useEffect } from "react";
import { ModuleId } from "@shared/schema";

interface DockProps {
  notifications: Record<string, number>;
  onOpenModule: (id: ModuleId) => void;
  onToggleFocus: () => void;
  onMinimizeAll: () => void;
  onCloseAll: () => void;
}

const dockItems = [
  { id: "compose" as ModuleId, emoji: "📝", title: "Post to All", desc: "Create posts for all platforms" },
  { id: "notifications" as ModuleId, emoji: "🔔", title: "Notifications", desc: "View all your alerts" },
  { id: "feed" as ModuleId, emoji: "⚡", title: "Feed", desc: "See posts from friends you follow" },
  { id: "page" as ModuleId, emoji: "🪐", title: "Dream Canvas", desc: "Your creative workspace" },
  { id: "messages" as ModuleId, emoji: "💬", title: "Signals", desc: "DMs and mentions" },
  { id: "customize" as ModuleId, emoji: "🎨", title: "Customize", desc: "Personalize your dashboard" },
  { id: "settings" as ModuleId, emoji: "⚙️", title: "Settings", desc: "Account and preferences" },
  { id: "ai_architect" as ModuleId, emoji: "🔮", title: "Dream Architect", desc: "AI Site Updater & Builder" },
];

const actionBtns = [
  { id: "clean", label: "Clean", shortLabel: "C", desc: "Toggle focus mode" },
  { id: "minimize", label: "Minimize", shortLabel: "M", desc: "Minimize all windows" },
  { id: "close", label: "Close", shortLabel: "X", desc: "Close all windows" },
];

export function Dock({
  notifications,
  onOpenModule,
  onToggleFocus,
  onMinimizeAll,
  onCloseAll,
}: DockProps) {
  const [isDesktopMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const lastTapTime = useRef<number>(0);
  const lastTapId = useRef<string | null>(null);

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Auto-detect desktop mode: if viewport is wide (>1024px) on touch device, assume "Request Desktop Site"
  const isWideViewport = typeof window !== 'undefined' && window.innerWidth > 1024;
  const autoDesktopMode = isTouchDevice && isWideViewport;
  const useMobileMode = isTouchDevice && !isDesktopMode && !autoDesktopMode;

  const handleTap = useCallback((id: string, action: () => void) => {
    if (!useMobileMode) {
      action();
      return;
    }
    const now = Date.now();
    const isDoubleTap = lastTapId.current === id && (now - lastTapTime.current) < 400;
    
    if (isDoubleTap) {
      action();
      setSelectedItem(null);
      lastTapId.current = null;
    } else {
      setSelectedItem(id);
      lastTapTime.current = now;
      lastTapId.current = id;
    }
  }, [useMobileMode]);

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-[35] py-4 px-6 backdrop-blur-[30px] border-t border-white/10 safe-area-bottom rounded-t-[3rem]"
      style={{
        background: "linear-gradient(to top, rgba(15,23,42,0.98), rgba(15,23,42,0.85))",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.3)"
      }}
    >
      <div
        className="w-full max-w-[920px] mx-auto flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
          {dockItems.map((item) => (
            <div key={item.id} className="relative flex-shrink-0 group">
              {(hoveredItem === item.id || selectedItem === item.id) && (
                <div 
                  className="absolute bottom-[130%] left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl whitespace-nowrap z-50 pointer-events-none transform transition-all duration-300 scale-100 origin-bottom"
                  style={{ 
                    background: "rgba(15,23,42,0.95)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                  }}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{item.title}</div>
                  <div className="text-[10px] text-white/60">{item.desc}</div>
                </div>
              )}
              <button
                className="dock-btn w-14 h-14 rounded-[1.25rem] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 active:scale-90 hover:-translate-y-2 shadow-lg hover:shadow-cyan-500/20"
                onMouseEnter={() => !useMobileMode && setHoveredItem(item.id)}
                onMouseLeave={() => !useMobileMode && setHoveredItem(null)}
                onTouchEnd={(e) => {
                  if (useMobileMode) {
                    e.preventDefault();
                    handleTap(item.id, () => onOpenModule(item.id));
                  }
                }}
                onClick={(e) => {
                  if (useMobileMode && e.detail === 0) return;
                  if (!useMobileMode) onOpenModule(item.id);
                }}
                data-testid={`dock-btn-${item.id}`}
              >
                <span className="text-2xl filter drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">{item.emoji}</span>
                {(notifications[item.id] || 0) > 0 && (
                  <div className="dock-badge top-0 right-0 bg-red-500 border-none shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-bounce" data-testid={`dock-badge-${item.id}`}>
                    {notifications[item.id]}
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 pl-4 border-l border-white/10">
          {actionBtns.map((btn) => {
            const action = btn.id === "clean" ? onToggleFocus : btn.id === "minimize" ? onMinimizeAll : onCloseAll;
            return (
              <div key={btn.id} className="relative">
                <button
                  className="pill-btn text-xs font-bold px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 active:scale-95 hover:-translate-y-1 shadow-md"
                  onClick={(e) => {
                    if (useMobileMode && e.detail === 0) return;
                    action();
                  }}
                  data-testid={`button-${btn.id === "close" ? "close-all" : btn.id}`}
                >
                  <span className="hidden sm:inline">{btn.label}</span>
                  <span className="sm:hidden">{btn.shortLabel}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
