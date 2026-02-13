'use client';

import type { Node } from '@/lib/dreamnav/delta';
import WidgetSurface from '@/components/widgets/WidgetSurface';
import HomeFeed from '@/components/HomeFeed';
import Link from 'next/link';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export default function HomeDreamRuntime({
  node,
  userId,
  profile,
  initialPosts,
}: {
  node: Node;
  userId: string;
  profile: ProfileLike | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
}) {
  // Node meanings (non-destructive defaults):
  // 0 = Core Dream Face 0 (Home Feed)
  // 1 = Core Dream Face 1 (Profile)
  // others = placeholder panels for now (you can map them to day-dreams later)

  if (node === 1 || node === '1b') {
    return (
      <div className="w-full">
        <WidgetSurface space="profile" />
        <div className="w-full max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-sm font-semibold">Profile</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              This is your Core Dream profile face (widgets + identity).
            </div>
            <div className="mt-3 text-sm">
              <div className="text-slate-600 dark:text-slate-300">
                @{profile?.handle || 'user'}
              </div>
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

  // Default: Home Feed face
  return (
    <>
      <WidgetSurface space="home" />
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
