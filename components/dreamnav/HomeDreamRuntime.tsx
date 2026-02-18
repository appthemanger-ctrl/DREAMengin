'use client';

import React from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import WidgetSurface from '@/components/widgets/WidgetSurface';
import HomeFeed from '@/components/HomeFeed';
import CoreDream from '@/components/core/CoreDream';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

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
  coreFace,
  coreOpen,
  onToggleCoreFace,
  onCloseCore,
}: {
  userId: string;
  profile: ProfileLike | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
  coreFace: 'home' | 'profile';
  coreOpen: boolean;
  onToggleCoreFace: () => void;
  onCloseCore: () => void;
}) {
  const { node } = useDreamNav();
  const nodeStr = String(node);
  const faceIndex = faceIndexFromNode(nodeStr);

  // 0 — Base anchor: Core Dream (dual-sided)
  if (node === 0) {
    return (
      <div className="fixed inset-0 z-10 grid place-items-center bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950">
        <CoreDream
          face={coreFace}
          isOpen={coreOpen}
          onToggleFace={onToggleCoreFace}
          onClose={onCloseCore}
          profile={profile}
        >
          <HomeFeed
            embedded
            userId={userId}
            userHandle={profile?.handle || 'user'}
            userAvatar={profile?.avatar_url || null}
            userDisplayName={profile?.display_name || 'User'}
            initialPosts={initialPosts}
          />
        </CoreDream>

        {/* When core dream is closed: show the navigation field */}
        {!coreOpen ? (
          <div className="w-[min(46rem,92vw)] rounded-[2rem] border border-white/10 bg-slate-950/35 backdrop-blur p-6 text-white">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Dreams</div>
            <div className="mt-1 text-lg font-semibold">Navigation field</div>
            <div className="mt-2 text-sm text-white/70">
              Core Dream hidden. Use swipes to travel, or open menus with the controls.
            </div>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[84px] rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Dream</div>
                  <div className="mt-1 text-sm font-semibold text-white/80">Slot {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // 1b..6b — Day Dreams (outer workspaces)
  if (typeof node === 'string' && node.endsWith('b')) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 pb-16">
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-4 text-white">
          <div className="text-xs uppercase tracking-[0.22em] text-white/60">Dream</div>
          <div className="mt-1 text-lg font-semibold">{nodeLabel(nodeStr)}</div>
          <div className="mt-2 text-sm text-white/70">Day Dream workspace (dual-sided).</div>
        </div>

        {faceIndex ? (
          <div className="mt-5">
            <WidgetSurface surface="FACE" surfaceKey={faceIndex} />
          </div>
        ) : null}
      </div>
    );
  }

  // 2..6 — Inner faces (feature spaces)
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-white/60">
          Space
        </div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          {nodeLabel(nodeStr)}
        </div>
        <div className="mt-2 text-sm text-slate-600 dark:text-white/70">
          This face is ready for widgets. Swipe to move. Depth-out enters the outer shell.
        </div>
      </div>

      {faceIndex ? (
        <div className="mt-5">
          <WidgetSurface surface="FACE" surfaceKey={faceIndex} />
        </div>
      ) : null}
    </div>
  );
}
