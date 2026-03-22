import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import FollowButton from '@/components/feed/FollowButton';
import DreamWord from '@/components/ui/DreamWord';
import ProfileShareButton from '@/components/ProfileShareButton';
import ProfileCustomizeButton from '@/components/profile/ProfileCustomizeButton';
import InfinityIcon from '@/components/ui/InfinityIcon';

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

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProfilePageProps) {
  const { handle } = await params;
  return {
    title: `@${handle} – Dreamengin`,
    description: `${handle}'s public profile on Dreamengin`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const supabase = await createServerClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('handle', handle)
    .single();

  if (!rawProfile) notFound();

  const profile = rawProfile as Profile;
  const isOwner = currentUser?.id === profile.id;
  const displayName = profile.display_name || profile.handle;

  // ── Phase 8 §B Point 21: Enforce dream_windows visibility at query level ──
  // Non-owners ONLY receive records with visibility = 'shared' or 'public'.
  // The query never includes 'private' records for non-owners.
  // RLS policies on dream_windows enforce this at the DB layer as well.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dreamWindowQuery = (supabase as any)
    .from('dream_windows')
    .select('id, type, config, size, position, visibility, active_state')
    .eq('owner_id', profile.id);

  // Owner sees all their dream_windows; visitors only see shared/public
  const { data: dreamWindowRecords } = await (
    isOwner
      ? dreamWindowQuery
      : dreamWindowQuery.in('visibility', ['shared', 'public'])
  ) as {
    data: Array<{
      id: string;
      type: string;
      config: Record<string, unknown>;
      visibility: string;
      active_state: string;
    }> | null
  };

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
      background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
      paddingBottom: 100,
    }}>

      {/* ── Owner preview banner ── */}
      {isOwner && (
        <div style={{
          background: 'rgba(200,152,26,0.12)',
          borderBottom: '1px solid rgba(200,152,26,0.25)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontSize: 12, color: '#8a6800',
        }}>
          <span>You are viewing your public ViewProfile.{dreamWindowCount > 0 ? ` ${dreamWindowCount} Dream Window${dreamWindowCount === 1 ? '' : 's'} visible.` : ''}</span>
          <Link href="/edit-profiledream" style={{ fontWeight: 700, color: '#c8981a', textDecoration: 'underline' }}>
            Edit in EditProfileDream →
          </Link>
        </div>
      )}

      {/* ── dreamengin brand header ── */}
      <div style={{ paddingTop: 18, paddingBottom: 2, textAlign: 'center' }}>
        <span className="de-wordmark" style={{ fontSize: 28 }}>
          <DreamWord />engin
        </span>
      </div>

      {/* ── "My Profile" row ── */}
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: '8px 16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
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
                  background: 'rgba(255,255,255,0.75)',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, textDecoration: 'none', color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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

      {/* ── Widget grid ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
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

      {/* ── Gold infinity button ── */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8981a, #e0b830)',
          boxShadow: '0 4px 20px rgba(200,152,26,0.45)',
          cursor: 'pointer',
        }}>
          <InfinityIcon size={20} variant="flat" colorScheme="dark" />
        </div>
      </div>
    </div>
  );
}
