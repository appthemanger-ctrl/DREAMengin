import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Users, LogOut } from "lucide-react";

interface StatusBarProps {
  onFocus: () => void;
  onShowAll: () => void;
  isFocused: boolean;
}

export function StatusBar({ onFocus, onShowAll, isFocused }: StatusBarProps) {
  const { user, logout } = useAuth();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 py-2 sm:py-3 px-2 sm:px-4 backdrop-blur-[24px] border-b safe-area-top"
      style={{
        background: "linear-gradient(to right, rgba(15,23,42,0.94), rgba(15,23,42,0.82))",
        borderColor: "rgba(148,163,184,0.25)",
      }}
    >
      <div className="w-full max-w-[1120px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm font-bold tracking-[.08em] sm:tracking-[.12em] text-[8px] sm:text-[10px] uppercase font-display flex-shrink-0"
            style={{ 
              background: "linear-gradient(135deg, #06b6d4, #14b8a6)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(6,182,212,0.4)"
            }}
            data-testid="brand-badge"
          >
            <span className="hidden sm:inline">Dreamengin</span>
            <span className="sm:hidden">DE</span>
          </div>
          <div className="hidden xs:block min-w-0">
            <div className="text-xs font-bold tracking-tight text-primary-glass font-display truncate" data-testid="title-main">
              {user?.firstName ? `Hi, ${user.firstName}` : "Dreamengin"}
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[.16em] sm:tracking-[.26em] uppercase text-secondary-glass hidden sm:block">
              Drive Your Dreams
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link href="/discover">
            <a className="pill-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3" data-testid="link-discover">
              <Users size={14} />
              <span className="hidden sm:inline">Discover</span>
            </a>
          </Link>
          <button
            className="pill-btn px-2 sm:px-3 text-xs sm:text-sm"
            onClick={onFocus}
            data-testid="button-focus"
          >
            <span className="hidden sm:inline">{isFocused ? "Unfocus" : "Focus"}</span>
            <span className="sm:hidden">{isFocused ? "U" : "F"}</span>
          </button>
          <button
            className="pill-btn px-2 sm:px-3 text-xs sm:text-sm hidden xs:flex"
            onClick={onShowAll}
            data-testid="button-show-all"
          >
            Show
          </button>
          {user && (
            <button 
              onClick={() => logout()}
              className="pill-btn flex items-center gap-1.5 text-rose-400 px-2 sm:px-3"
              data-testid="button-logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
