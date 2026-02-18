'use client';

import React, { useMemo, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeFeed from '@/components/HomeFeed';
import HomeFavoritesRing from '@/components/home/HomeFavoritesRing';
import ProfileWidgetStack from '@/components/home/ProfileWidgetStack';
import DreamGrid from '@/components/dreamnav/DreamGrid';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type HomeMode = 'home' | 'profile' | 'nav';

function nodeLabel(node: string): string {
  switch (node) {
    case '0': return 'HOME';
    case '1': return 'front';
    case '2': return 'back';
    case '3': return 'left';
    case '4': return 'right';
    case '5': return 'top';
    case '6': return 'bottom';
    case '1b': return 'Music';
    case '2b': return 'Lab';
    case '3b': return 'Code';
    case '4b': return 'Brand';
    case '5b': return 'Games';
    case '6b': return 'Create';
    default: return node;
  }
}

function faceIndexFromNode(node: string): number | null {
  if (node === '0') return null;
  const c = node[0];
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

export default function HomeDreamRuntime({
  userId,
  profile,
  initialPosts,
}: {
  userId: string;
  profile: ProfileLike | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
}) {
  const { node } = useDreamNav();
  const nodeStr = String(node);
  const faceIndex = faceIndexFromNode(nodeStr);

  // Node 0 is always the Home/Profile Dream.
  const [mode, setMode] = useState<HomeMode>('home');

  // When you leave node 0, snap out of nav mode (no sticky overlays).
  const effectiveMode: HomeMode = useMemo(() => {
    if (node !== 0) return 'home';
    return mode;
  }, [mode, node]);

  // ----- NODE 0: Home/Profile Dream -----
  if (node === 0) {
    const isHome = effectiveMode === 'home';
    const isProfile = effectiveMode === 'profile';
    const isNav = effectiveMode === 'nav';

    return (
      <div className="relative w-full min-h-[100svh] overflow-hidden">
        {/* Background gradient — minimal, premium, cheap */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />

        {/* Favorites ring exists only in HOME mode */}
        {isHome ? (
          <HomeFavoritesRing
            onAddSlot={(slot) => {
              // Placeholder hook — later this opens the connector list (IG/FB/etc)
              console.log('add favorite slot', slot);
            }}
          />
        ) : null}

        {/* Center panel: HOME feed (2/3) */}
        {isHome ? (
          <div className="relative z-10 w-full flex items-center justify-center px-4 pt-10 pb-20">
            <div className="w-full max-w-3xl" style={{ width: '66%' }}>
              <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur p-3">
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Dream Feed</div>
                  <div className="flex gap-2">
                    {/* Newspaper toggle */}
                    <button
                      type="button"
                      onClick={() => setMode('profile')}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                      aria-label="Flip to profile mode"
                    >
                      📰
                    </button>
                    {/* Hide → Dreams nav */}
                    <button
                      type="button"
                      onClick={() => setMode('nav')}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                      aria-label="Open dreams navigation"
                    >
                      ⬚
                    </button>
                  </div>
                </div>

                <HomeFeed
                  userId={userId}
                  userHandle={profile?.handle || 'user'}
                  userAvatar={profile?.avatar_url || null}
                  userDisplayName={profile?.display_name || 'User'}
                  initialPosts={initialPosts}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* PROFILE mode: full page with widgets */}
        {isProfile ? (
          <div className="relative z-10 w-full min-h-[100svh] text-white">
            <div className="w-full max-w-4xl mx-auto px-4 pt-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/60">Profile</div>
                  <div className="text-lg font-semibold">{profile?.display_name || 'User'}</div>
                  <div className="text-sm text-white/60">@{profile?.handle || 'user'}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('home')}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                    aria-label="Flip back to home mode"
                  >
                    📰
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('nav')}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                    aria-label="Open dreams navigation"
                  >
                    ⬚
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 backdrop-blur p-4">
                <div className="text-sm font-semibold">Basic Info</div>
                <div className="text-xs text-white/60 mt-1">
                  Public view. Followers see this mode.
                </div>
              </div>
            </div>

            <ProfileWidgetStack
              onAdd={() => {
                console.log('add profile widget');
              }}
            />
          </div>
        ) : null}

        {/* NAV mode: dreams launcher */}
        {isNav ? (
          <DreamGrid onClose={() => setMode('home')} />
        ) : null}
      </div>
    );
  }

  // ----- OTHER NODES: placeholder content until dream runtimes are built -----
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-4 text-white">
        <div className="text-xs uppercase tracking-[0.22em] text-white/60">Dream</div>
        <div className="mt-1 text-lg font-semibold">{nodeLabel(nodeStr)}</div>
        <div className="mt-3 text-sm text-white/60">
          Node: {nodeStr}{faceIndex ? ` (face ${faceIndex})` : ''}
        </div>
        <div className="mt-4 text-xs text-white/50">
          Runtime placeholder. Build the real dream runtime for this node next.
        </div>
      </div>
    </div>
  );
}
