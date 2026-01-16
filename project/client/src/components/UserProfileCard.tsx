import { ModuleId } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface UserProfileCardProps {
  onOpenModule: (id: ModuleId) => void;
}

export function UserProfileCard({ onOpenModule }: UserProfileCardProps) {
  const { user } = useAuth();
  const displayName = user?.firstName || "DREAMengin";
  
  return (
    <div
      className="glass-soft rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{ borderRadius: "30px" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl grid place-items-center text-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.4), rgba(20,184,166,0.35), rgba(52,211,153,0.3))",
            border: "1px solid rgba(148,163,184,0.5)",
            borderRadius: "22px",
          }}
          data-testid="avatar-user"
        >
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : "🧬"}
        </div>
        <div>
          <div
            className="text-lg font-black italic tracking-tight uppercase"
            style={{ color: "var(--text-primary)" }}
            data-testid="text-username"
          >
            {displayName}
          </div>
          <div className="text-xs text-secondary-glass">
            Drive Your Dreams • Connect Everything
          </div>
          <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass mt-1">
            Status: <span className="text-sky-100/95">Blue mist aligned</span> • <span className="text-emerald-300/90">Monetization active</span>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <button
          className="pill-btn"
          onClick={() => onOpenModule("feed")}
          data-testid="button-feed"
        >
          Feed
        </button>
        <button
          className="pill-btn"
          onClick={() => onOpenModule("page")}
          data-testid="button-canvas"
        >
          Canvas
        </button>
        <button
          className="pill-btn"
          onClick={() => onOpenModule("messages")}
          data-testid="button-signals"
        >
          Signals
        </button>
      </div>
    </div>
  );
}
