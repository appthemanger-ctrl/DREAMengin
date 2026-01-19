import { ModuleId } from "@shared/schema";

interface AppIconProps {
  id: ModuleId;
  emoji: string;
  title: string;
  subtitle: string;
  badge?: number;
  onClick: () => void;
}

export function AppIcon({ id, emoji, title, subtitle, badge = 0, onClick }: AppIconProps) {
  return (
    <div
      className="app-icon-container"
      onClick={onClick}
      aria-label={title}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      data-testid={`app-icon-${id}`}
    >
      {badge > 0 && (
        <div className="badge-notification" data-testid={`badge-${id}`}>
          {badge}
        </div>
      )}
      <div className="text-2xl" aria-hidden="true">
        {emoji}
      </div>
      <div
        className="mt-2 font-black text-[13px] tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </div>
      <div className="mt-1 text-[11px] text-secondary-glass">{subtitle}</div>
    </div>
  );
}
