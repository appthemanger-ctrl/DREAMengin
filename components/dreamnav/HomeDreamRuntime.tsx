'use client';

import React from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import WidgetSurface from '@/components/widgets/WidgetSurface';
import HomeFeed from '@/components/HomeFeed';
import Link from 'next/link';

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
}: {
  userId: string;
  profile: ProfileLike | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
}) {
  const { node } = useDreamNav();
  const nodeStr = String(node);
  const faceIndex = faceIndexFromNode(nodeStr);

  // 0 — Home Feed (anchor)
  if (node === 0) {
    return (
      <>
        <WidgetSurface surface="HOME" surfaceKey={0} />
        <HomeFeed
          userId={userId}
          userHandle={profile?.handle || 'user'}
          userAvatar={profile?.avatar_url || null}
          userDisplayName={profile?.display_name || 'User'}
          initialPosts={initialPosts}
        />
      </>
    );
  }

  // 1 — Profile face (inner)
  if (node === 1) {
    return (
      <div className="w-full">
        <WidgetSurface surface="PROFILE" surfaceKey={0} />
        <div className="w-full max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-sm font-semibold">Profile</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your identity + widgets.
            </div>
            <div className="mt-3 text-sm">
              <div className="text-slate-600 dark:text-slate-300">@{profile?.handle || 'user'}</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                {profile?.display_name || 'User'}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/edit-profile"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm"
              >
                Edit Profile
              </Link>
              <Link
                href="/feed-settings"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm"
              >
                Feed Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1b..6b — Outer shell dreams (system layer)
  if (typeof node === 'string' && node.endsWith('b')) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 pb-16">
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-4 text-white">
          <div className="text-xs uppercase tracking-[0.22em] text-white/60">Dream</div>
          <div className="mt-1 text-lg font-semibold">{nodeLabel(nodeStr)}</div>
          <div className="mt-2 text-sm text-white/70">
            Outer shell space. Depth-in collapses back to the inner face.
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
