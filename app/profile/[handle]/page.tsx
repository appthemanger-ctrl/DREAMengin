import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ActivityProfile } from '@/components/activity/ActivityProfile';
import { Pencil } from 'lucide-react';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import FollowButton from '@/components/feed/FollowButton';
import DreamWord from '@/components/ui/DreamWord';
import ProfileShareButton from '@/components/ProfileShareButton';
import ProfileCustomizeButton from '@/components/profile/ProfileCustomizeButton';
import InfinityIcon from '@/components/ui/InfinityIcon';
import { connection } from 'next/server';

// Extended profile type
type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_url?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
  profile_dream_widgets?: ProfileDream[] | null;
};

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}


export async function generateMetadata({ params }: ProfilePageProps) {
  await connection();
  const { handle } = await params;
  return {
    title: `@${handle} – Dreamengin`,
    description: `${handle}'s public profile on Dreamengin`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  await connection();
  const { handle } = await params;
  const supabase = await createServerClient();

  // Gracefully handle Supabase being unavailable (no configured env vars)
  let currentUser: { id: string } | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
  } catch {
    // Supabase not configured — treat as anonymous visitor
  }

  let rawProfile: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();
    rawProfile = data;
  } catch {
    // Supabase unavailable
  }

  if (!rawProfile) notFound();

  const profile = rawProfile as Profile;
  const isOwner = currentUser?.id === profile.id;
  const displayName = profile.display_name || profile.handle;

  // ── Phase 8 §B Point 21: Enforce dream_windows visibility at query level ──
  // Non-owners ONLY receive records with visibility = 'shared' or 'public'.
  // The query never includes 'private' records for non-owners.
  // RLS policies on dream_windows enforce this at the DB layer as well.
  let dreamWindowRecords: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    visibility: string;
    active_state: string;
  }> | null = null;
  try {
    const dreamWindowQuery = (supabase as any)
      .from('dream_windows')
      .select('id, type, config, size, position, visibility, active_state')
      .eq('owner_id', profile.id);

    // Owner sees all their dream_windows; visitors only see shared/public
    const { data } = await (
      isOwner
        ? dreamWindowQuery
        : dreamWindowQuery.in('visibility', ['shared', 'public'])
    );
    dreamWindowRecords = data;
  } catch {
    // dream_windows table may not exist yet — fall back to profile_dream_widgets
  }

  // Log dream_windows count for observability (non-blocking)
  const dreamWindowCount = dreamWindowRecords?.length ?? 0;

  // Load only publicly-visible profile widgets (per ARCHITECTURE.md §5 privacy rules)
  // Owner sees all their widgets; visitors only see public/shared/followers widgets
  // Phase 8 §B Point 21: never include 'private' visibility Dream Windows for non-owners
  const allDreams: ProfileDream[] =
    Array.isArray(profile.profile_dream_widgets) && profile.profile_dream_widgets.length > 0
      ? profile.profile_dream_widgets
      : DEFAULT_DREAMS;

  const visibleDreams = isOwner
    ? allDreams // Owner preview: show everything
    : allDreams.filter((w) => {
        const vis = (w.visibility ?? 'private') as string;
        // Strict enforcement: only shared/public/followers — never private
        // Note: new dream_windows records use 'shared'; legacy ProfileDream uses 'followers'
        return vis === 'public' || vis === 'shared' || vis === 'followers';
      });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #070e1c 0%, #0c1829 40%, #0f2244 70%, #0a1628 100%)',
      paddingBottom: 100,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* WebGPU 2026 atmospheric layers */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '660px', height: '660px', background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, rgba(14,165,233,0.04) 45%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '540px', height: '540px', background: 'radial-gradient(circle, rgba(200,152,26,0.10) 0%, rgba(245,158,11,0.04) 50%, transparent 70%)', filter: 'blur(72px)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(30,80,180,0.07) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      {/* ── Owner preview banner ── */}
      {isOwner && (
        <div style={{
          background: 'rgba(200,152,26,0.10)',
          borderBottom: '1px solid rgba(200,152,26,0.22)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontSize: 12, color: 'rgba(212,168,67,0.90)',
          backdropFilter: 'blur(16px)',
          position: 'relative', zIndex: 10,
        }}>
          <span>You are viewing your public ViewProfile.{dreamWindowCount > 0 ? ` ${dreamWindowCount} Dream Window${dreamWindowCount === 1 ? '' : 's'} visible.` : ''}</span>
          <Link href="/edit-profiledream" style={{ fontWeight: 700, color: '#c8981a', textDecoration: 'underline' }}>
            Edit in EditProfileDream →
          </Link>
        </div>
      )}

      {/* ── dreamengin brand header ── */}
      <div style={{ paddingTop: 18, paddingBottom: 2, textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <span className="de-wordmark" style={{ fontSize: 28, background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <DreamWord />engin
        </span>
      </div>

      {/* ── "My Profile" row ── */}
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: '8px 16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 10,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(220,235,255,0.97)', margin: 0 }}>
          {isOwner ? 'ViewProfile' : `@${handle}`}
        </h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileShareButton />
          {isOwner ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ProfileCustomizeButton />
              <Link
                href="/edit-profiledream"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, textDecoration: 'none', color: 'rgba(200,220,255,0.75)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(12px)',
                }}
                title="Edit profile"
              >
                <Pencil size={14} />
              </Link>
            </div>
          ) : (
            <FollowButton handle={profile.handle} displayName={displayName} />
          )}
        </div>
      </div>

      {/* ── Activity Profile (Phase 9 Activity-First metrics) ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '8px 16px 0', position: 'relative', zIndex: 10 }}>
        <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-lg" />}>
          <ActivityProfile userId={profile.id} />
        </Suspense>
      </div>

      {/* ── Widget grid ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <ProfileWidgetGrid
          displayName={displayName}
          handle={profile.handle}
          avatarUrl={profile.avatar_url}
          bio={profile.bio}
          coverUrl={profile.cover_url}
          followers={profile.followers_count ?? 0}
          following={profile.following_count ?? 0}
          posts={profile.posts_count ?? 12}
          likes={46}
          isEditing={false}
          initialWidgets={visibleDreams}
        />
      </div>

      {/* ── Gold infinity button — WebGPU 2026 glow ── */}
      <div style={{ textAlign: 'center', marginTop: 32, position: 'relative', zIndex: 10 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 32%, #fffde0 0%, #f7e07a 10%, #e8c040 22%, #d4a843 38%, #a16207 65%, #6b3c03 100%)',
          boxShadow: '0 4px 20px rgba(200,152,26,0.55), 0 0 40px rgba(200,152,26,0.25), inset 0 2px 5px rgba(255,255,220,0.80)',
          cursor: 'pointer',
          animation: 'sicc-infinity-glow 2.4s ease-in-out infinite',
        }}>
          <InfinityIcon size={20} variant="flat" colorScheme="dark" />
        </div>
      </div>
    </div>
  );
}
