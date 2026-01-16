import { ModuleId } from "@shared/schema";

interface StreamingDeckProps {
  onOpenModule: (id: ModuleId) => void;
}

const streamingApps = [
  { id: "netflix" as ModuleId, emoji: "🟥", name: "Netflix" },
  { id: "disney" as ModuleId, emoji: "🌌", name: "Disney+" },
  { id: "hulu" as ModuleId, emoji: "🟩", name: "Hulu" },
  { id: "crunchyroll" as ModuleId, emoji: "🟧", name: "Crunchyroll" },
  { id: "prime" as ModuleId, emoji: "📦", name: "Prime" },
  { id: "hbomax" as ModuleId, emoji: "🎬", name: "Max" },
  { id: "peacock" as ModuleId, emoji: "🦚", name: "Peacock" },
  { id: "paramount" as ModuleId, emoji: "⭐", name: "Paramount+" },
];

export function StreamingDeck({ onOpenModule }: StreamingDeckProps) {
  return (
    <div className="glass-soft rounded-lg p-4" style={{ borderRadius: "24px" }}>
      <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass">
        Streaming Deck
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {streamingApps.map((app) => (
          <button
            key={app.id}
            className="streaming-btn"
            onClick={() => onOpenModule(app.id)}
            data-testid={`streaming-btn-${app.id}`}
          >
            <span className="text-lg">{app.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {app.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
