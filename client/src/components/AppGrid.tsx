import { AppIcon } from "./AppIcon";
import { ModuleId } from "@shared/schema";

interface AppGridProps {
  notifications: Record<string, number>;
  onOpenModule: (id: ModuleId) => void;
}

const apps = [
  { id: "instagram" as ModuleId, emoji: "📸", title: "Instagram", subtitle: "Visual grid + stories" },
  { id: "tiktok" as ModuleId, emoji: "🎵", title: "TikTok", subtitle: "Short-form bursts" },
  { id: "x" as ModuleId, emoji: "🐦", title: "X / Twitter", subtitle: "Threads + signal" },
  { id: "messenger" as ModuleId, emoji: "💬", title: "Messenger", subtitle: "DM hub" },
  { id: "youtube" as ModuleId, emoji: "▶️", title: "YouTube", subtitle: "Episodes + shows" },
  { id: "spotify" as ModuleId, emoji: "🎧", title: "Spotify", subtitle: "Music / pods" },
];

export function AppGrid({ notifications, onOpenModule }: AppGridProps) {
  return (
    <div
      className="mt-4 grid gap-3.5 grid-cols-2 sm:grid-cols-3"
      data-testid="app-grid"
    >
      {apps.map((app) => (
        <AppIcon
          key={app.id}
          id={app.id}
          emoji={app.emoji}
          title={app.title}
          subtitle={app.subtitle}
          badge={notifications[app.id] || 0}
          onClick={() => onOpenModule(app.id)}
        />
      ))}
    </div>
  );
}
