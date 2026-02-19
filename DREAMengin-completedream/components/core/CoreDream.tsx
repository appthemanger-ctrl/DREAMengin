'use client';

import React from 'react';
import { X, Repeat2 } from 'lucide-react';

type CoreFace = 'home' | 'profile';

type Props = {
  face: CoreFace;
  isOpen: boolean;
  onToggleFace: () => void;
  onClose: () => void;
  children: React.ReactNode;
  profile: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function DreamTile({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur p-3 text-white/80">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">Dream</div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
      <div className="mt-2 h-12 rounded-xl border border-white/10 bg-white/5" />
    </div>
  );
}

function ProfileFace({ profile }: { profile: Props['profile'] }) {
  return (
    <div className="h-full w-full">
      <div className="rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur p-4 text-white">
        <div className="text-xs uppercase tracking-[0.22em] text-white/60">Profile</div>
        <div className="mt-1 text-lg font-semibold">@{profile?.handle || 'user'}</div>
        <div className="text-sm text-white/70">{profile?.display_name || 'Your space'}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="min-h-[88px] rounded-2xl border border-white/10 bg-white/5 text-left px-3 py-3 text-white/70 hover:bg-white/10"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Add</div>
            <div className="mt-1 text-sm font-semibold text-white/80">Widget slot</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Core Dream = a single dual-sided widget.
 * - Front face: Home Feed
 * - Back face: Profile
 */
export default function CoreDream({
  face,
  isOpen,
  onToggleFace,
  onClose,
  children,
  profile,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto w-[min(46rem,92vw)]">
      {/* Top row (4 favorite dreams) */}
      <div className="grid grid-cols-4 gap-3">
        {['Fav 1', 'Fav 2', 'Fav 3', 'Fav 4'].map((l) => (
          <DreamTile key={l} label={l} />
        ))}
      </div>

      {/* Core Dream */}
      <div className="mt-3 rounded-[2rem] border border-white/10 bg-slate-950/35 backdrop-blur text-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Dream Feed</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFace}
              className="h-9 w-9 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Flip Home/Profile"
              title="Flip Home/Profile"
            >
              <Repeat2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Close core dream"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-[min(56vh,560px)] overflow-y-auto">
          {face === 'home' ? children : <div className="p-4"><ProfileFace profile={profile} /></div>}
        </div>
      </div>

      {/* Bottom row (4 favorite dreams) */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {['Fav 5', 'Fav 6', 'Fav 7', 'Fav 8'].map((l) => (
          <DreamTile key={l} label={l} />
        ))}
      </div>
    </div>
  );
}
