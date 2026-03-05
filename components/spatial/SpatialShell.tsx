"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Home, User, ArrowLeftRight } from "lucide-react";
import HomeSpace from "./HomeSpace";
import ProfileSpace from "./ProfileSpace";
import type { SpaceType } from "@/types/spatial";
import { cn } from "@/lib/utils";

interface SpatialShellProps {
  userId: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export default function SpatialShell({ userId, handle, displayName, avatarUrl, bio }: SpatialShellProps) {
  const [activeSpace, setActiveSpace] = useState<SpaceType>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right">("right");

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const switchSpace = useCallback(
    (newSpace: SpaceType) => {
      if (newSpace === activeSpace || isTransitioning) return;
      setTransitionDirection(newSpace === "profile" ? "right" : "left");
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSpace(newSpace);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    },
    [activeSpace, isTransitioning]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    // Spatial swipe navigation is disabled — navigate via the Daydreams menu button
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        switchSpace("home");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight") {
        e.preventDefault();
        switchSpace("profile");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [switchSpace]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-hidden de-sky-bg flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hidden md:flex items-center justify-center gap-1 p-2 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <button
          onClick={() => switchSpace("home")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            activeSpace === "home" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
          )}
        >
          <Home className="w-4 h-4" />
          HOME
          <span className="text-xs opacity-60">(Private)</span>
        </button>

        <div className="px-2">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <button
          onClick={() => switchSpace("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            activeSpace === "profile" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
          )}
        >
          <User className="w-4 h-4" />
          PROFILE
          <span className="text-xs opacity-60">(Public)</span>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 transition-all duration-200 ease-out",
            isTransitioning
              ? transitionDirection === "right"
                ? "opacity-0 -translate-x-4"
                : "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          )}
        >
          {activeSpace === "home" ? (
            <HomeSpace userId={userId} onSwitchToProfile={() => switchSpace("profile")} />
          ) : (
            <ProfileSpace
              userId={userId}
              handle={handle}
              displayName={displayName}
              avatarUrl={avatarUrl}
              bio={bio}
              isOwner={true}
              onSwitchToHome={() => switchSpace("home")}
            />
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl safe-area-inset-bottom" style={{ background: 'rgba(220,232,248,0.88)', borderTop: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="flex items-center justify-center gap-4 p-3">
          <button
            onClick={() => switchSpace("home")}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors",
              activeSpace === "home" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">HOME</span>
          </button>

          <button
            onClick={() => switchSpace("profile")}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors",
              activeSpace === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">PROFILE</span>
          </button>
        </div>
      </div>

    </div>
  );
}
