import { ModuleId } from "@shared/schema";

interface GamingDeckProps {
  notifications: Record<string, number>;
  onOpenModule: (id: ModuleId) => void;
}

const gamingApps = [
  { id: "roblox" as ModuleId, emoji: "🎮", name: "Roblox" },
  { id: "twitch" as ModuleId, emoji: "📺", name: "Twitch" },
  { id: "discord" as ModuleId, emoji: "🎙️", name: "Discord" },
  { id: "steam" as ModuleId, emoji: "🎮", name: "Steam" },
  { id: "minecraft" as ModuleId, emoji: "⛏️", name: "Minecraft" },
  { id: "epicgames" as ModuleId, emoji: "🏰", name: "Epic" },
];

export function GamingDeck({ notifications, onOpenModule }: GamingDeckProps) {
  return (
    <div className="glass-soft rounded-lg p-4" style={{ borderRadius: "24px" }}>
      <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass">
        Gaming Hub
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {gamingApps.map((app) => (
          <button
            key={app.id}
            className="streaming-btn relative"
            onClick={() => onOpenModule(app.id)}
            data-testid={`gaming-btn-${app.id}`}
          >
            <span className="text-lg">{app.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {app.name}
            </span>
            {(notifications[app.id] || 0) > 0 && (
              <span
                className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: "rgba(248,250,252,0.95)",
                  color: "#020617",
                }}
              >
                {notifications[app.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
