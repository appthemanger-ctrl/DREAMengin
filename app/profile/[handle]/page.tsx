import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import ProfileWidgetGrid from '@/components/profile/ProfileWidgetGrid';
import FollowButton from '@/components/feed/FollowButton';
import ProfileShareButton from '@/components/ProfileShareButton';

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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
      paddingBottom: 100,
    }}>

      {/* ── dreamengin brand header ── */}
      <div style={{ paddingTop: 18, paddingBottom: 2, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 28,
          fontWeight: 400,
          color: '#c8981a',
          letterSpacing: '-0.01em',
        }}>
          dreamengin
        </span>
      </div>

      {/* ── "My Profile" row ── */}
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: '8px 16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
          {isOwner ? 'My Profile' : `@${handle}`}
        </h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileShareButton />
          {isOwner ? (
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
          posts={profile.posts_count ?? 12}
          likes={46}
          isEditing={false}
        />
      </div>

      {/* ── Gold infinity button ── */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8981a, #e0b830)',
          boxShadow: '0 4px 20px rgba(200,152,26,0.45)',
          fontSize: 24, color: '#fff', fontWeight: 800,
          cursor: 'pointer',
        }}>
          ∞
        </div>
      </div>
    </div>
  );
}
