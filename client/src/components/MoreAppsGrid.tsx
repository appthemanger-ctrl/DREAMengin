import { ModuleId } from "@shared/schema";

interface MoreAppsGridProps {
  notifications: Record<string, number>;
  onOpenModule: (id: ModuleId) => void;
}

const moreApps = [
  { id: "snapchat" as ModuleId, emoji: "👻", title: "Snapchat", subtitle: "Snaps + stories" },
  { id: "threads" as ModuleId, emoji: "🧵", title: "Threads", subtitle: "Text convos" },
  { id: "linkedin" as ModuleId, emoji: "💼", title: "LinkedIn", subtitle: "Professional" },
  { id: "pinterest" as ModuleId, emoji: "📌", title: "Pinterest", subtitle: "Inspiration" },
  { id: "reddit" as ModuleId, emoji: "🤖", title: "Reddit", subtitle: "Communities" },
  { id: "github" as ModuleId, emoji: "🐙", title: "GitHub", subtitle: "Code + projects" },
  { id: "whatsapp" as ModuleId, emoji: "📱", title: "WhatsApp", subtitle: "Messaging" },
  { id: "telegram" as ModuleId, emoji: "✈️", title: "Telegram", subtitle: "Fast chat" },
  { id: "figma" as ModuleId, emoji: "🎨", title: "Figma", subtitle: "Design" },
  { id: "notion" as ModuleId, emoji: "📝", title: "Notion", subtitle: "Notes + docs" },
  { id: "bereal" as ModuleId, emoji: "📷", title: "BeReal", subtitle: "Authentic" },
  { id: "dribbble" as ModuleId, emoji: "🏀", title: "Dribbble", subtitle: "Showcase" },
];

export function MoreAppsGrid({ notifications, onOpenModule }: MoreAppsGridProps) {
  return (
    <div className="glass-soft rounded-xl p-4" style={{ borderRadius: "24px" }}>
      <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass mb-3">
        More Channels
      </div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
        {moreApps.map((app) => (
          <button
            key={app.id}
            className="app-icon-container text-left"
            style={{ minHeight: "auto", padding: "10px" }}
            onClick={() => onOpenModule(app.id)}
            data-testid={`more-app-${app.id}`}
          >
            {(notifications[app.id] || 0) > 0 && (
              <div className="badge-notification" style={{ top: "4px", right: "6px", fontSize: "9px", padding: "1px 4px" }}>
                {notifications[app.id]}
              </div>
            )}
            <div className="text-xl">{app.emoji}</div>
            <div className="mt-1 font-bold text-[11px]" style={{ color: "var(--text-primary)" }}>
              {app.title}
            </div>
            <div className="text-[9px] text-secondary-glass">{app.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
