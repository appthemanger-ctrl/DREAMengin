import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Eye } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import ProfileWidgetGrid, { type Widget } from '@/components/profile/ProfileWidgetGrid';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import { Pencil, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ViewProfile Preview – Dreamengin' };

export default async function ViewProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use select('*') to avoid stale-type errors on newer columns
  const { data: raw } = await supabase
import ProfileWidgetGrid from '@/components/profile/ProfileWidgetGrid';
import ProfileShareButton from '@/components/ProfileShareButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ViewProfile – DREAMengin',
  description: 'Preview your public profile exactly as visitors see it.',
};

type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_url?: string | null;
  followers_count?: number | null;
  posts_count?: number | null;
  profile_dream_widgets?: ProfileDream[] | null;
};

  following_count?: number | null;
  posts_count?: number | null;
};

/**
 * ViewProfile — canonical public-profile preview surface (README §6).
 *
 * This page renders the authenticated user's own profile exactly as an outside
 * visitor would see it, using only saved/public output (DreamOutputLayer
 * projection model). It is the "preview before share" surface described in
 * README §6.4. It is NOT a redirect — it is a real product surface.
 *
 * Privacy: auth-gated (owners only). The page intentionally mirrors the public
 * `/profile/[handle]` rendering so owners can verify their public output before
 * sharing the link.
 */
export default async function ViewProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Cast to include the columns added by migrations
  const profileData = raw as {
    handle: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    widget_config: Widget[] | null;
  } | null;

  if (!profileData?.handle) redirect('/edit-profiledream');

  // Load widgets from profile.widget_config, filter to non-private
  const allWidgets: Widget[] = Array.isArray(profileData.widget_config) ? profileData.widget_config : [];
  const publicWidgets = allWidgets.filter(w => w.visibility && w.visibility !== 'private');
  const hasPublicWidgets = publicWidgets.length > 0;

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)', paddingBottom: 100 }}>
      {/* Preview mode banner */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(200,152,26,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(200,152,26,0.3)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/edit-profiledream" style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(160,195,240,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <ArrowLeft size={15} style={{ color: 'var(--de-heading)' }} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#a07010' }}>Preview Mode</div>
          <div style={{ fontSize: 11, color: '#c8981a' }}>This is how your profile looks to others</div>
        </div>
        <Eye size={16} style={{ color: '#c8981a', flexShrink: 0 }} />
      </div>

      {/* Profile header */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          borderRadius: 22,
          padding: '20px 16px',
          marginBottom: 14,
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden',
            background: profileData.avatar_url ? undefined : 'linear-gradient(135deg, #c8981a, #4A9ED6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {profileData.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profileData.avatar_url} alt={profileData.display_name ?? profileData.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profileData.display_name || profileData.handle || 'D')[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)' }}>
              {profileData.display_name || profileData.handle}
            </div>
            <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 2 }}>
              @{profileData.handle}
            </div>
            {profileData.bio && (
              <div style={{ fontSize: 13, color: 'var(--de-text)', marginTop: 6, lineHeight: 1.4 }}>
                {profileData.bio}
              </div>
            )}
          </div>
        </div>

        {/* Widget area */}
        {hasPublicWidgets ? (
          <ProfileWidgetGrid
            displayName={profileData.display_name || profileData.handle}
            handle={profileData.handle}
            avatarUrl={profileData.avatar_url}
            bio={profileData.bio}
            coverUrl={profileData.banner_url}
            isEditing={false}
            initialWidgets={publicWidgets}
            onSave={() => {}}
          />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            borderRadius: 22,
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>
              No public Dreams yet
            </div>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
              You haven&apos;t made any Dreams public yet. Open Edit ProfileDream to set the visibility on your Dreams.
            </p>
            <Link href="/edit-profiledream" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(200,152,26,0.35)',
            }}>
              ← Go to Edit ProfileDream
            </Link>
          </div>
        )}
  if (!rawProfile?.handle) redirect('/edit-profiledream');

  const profile = rawProfile as unknown as Profile;

  // Use server-persisted widget projection (falls back to defaults if not set)
  const savedDreams: ProfileDream[] =
    Array.isArray(profile.profile_dream_widgets) && profile.profile_dream_widgets.length > 0
      ? profile.profile_dream_widgets
      : DEFAULT_DREAMS;

  const displayName = profile.display_name || profile.handle;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
      paddingBottom: 100,
    }}>

      {/* ── Preview mode banner ── */}
      <div style={{
        background: 'rgba(200,152,26,0.14)',
        borderBottom: '1px solid rgba(200,152,26,0.3)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={14} style={{ color: '#c8981a' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#8a6800' }}>
            ViewProfile Preview — this is how visitors see your profile
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href="/edit-profiledream"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(200,152,26,0.15)',
              border: '1px solid rgba(200,152,26,0.35)',
              fontSize: 12, fontWeight: 700, color: '#c8981a',
              textDecoration: 'none',
            }}
          >
            <Pencil size={12} />
            ← Back to EditProfileDream
          </Link>
        </div>
  const profile = rawProfile as Profile | null;
  const displayName = profile?.display_name || profile?.handle || 'Your Profile';
  const handle = profile?.handle ?? '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
        paddingBottom: 100,
      }}
    >
      {/* ── Preview mode banner ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(200,152,26,0.12), rgba(42,138,184,0.10))',
          borderBottom: '1px solid rgba(200,152,26,0.25)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Eye
          style={{ width: 14, height: 14, color: '#c8981a', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#8a6a10',
            letterSpacing: '0.02em',
          }}
        >
          Visitor preview — this is exactly how your profile appears to others
        </span>
      </div>

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
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 28,
            fontWeight: 400,
            color: '#c8981a',
            letterSpacing: '-0.01em',
          }}
        >
          dreamengin
        </span>
      </div>

      {/* ── Profile header row ── */}
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: '8px 16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
          ViewProfile
        </h1>
      </div>

      {/* ── Dream grid (saved projection) ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <ProfileWidgetGrid
          displayName={displayName}
          handle={profile.handle}
          avatarUrl={profile.avatar_url}
          bio={profile.bio}
          coverUrl={profile.cover_url ?? null}
          followers={profile.followers_count ?? 0}
          posts={profile.posts_count ?? 0}
          likes={0}
          isEditing={false}
          initialWidgets={savedDreams}
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
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: '8px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}
        >
          {handle ? `@${handle}` : 'My Profile'}
        </h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileShareButton />
          <Link
            href="/edit-profiledream"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.75)',
              border: '1.5px solid rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              textDecoration: 'none',
              color: '#666',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            title="Return to EditProfileDream"
          >
            <Pencil size={14} />
          </Link>
        </div>
      </div>

      {/* ── Widget grid (saved output only) ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <ProfileWidgetGrid
          displayName={displayName}
          handle={handle}
          avatarUrl={profile?.avatar_url ?? null}
          bio={profile?.bio ?? null}
          coverUrl={profile?.cover_url ?? null}
          followers={profile?.followers_count ?? 0}
          posts={profile?.posts_count ?? 0}
          likes={0}
          isEditing={false}
        />
      </div>

      {/* ── Return to EditProfileDream CTA ── */}
      <div style={{ textAlign: 'center', marginTop: 32, padding: '0 16px' }}>
        <Link
          href="/edit-profiledream"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #c8981a, #e0b830)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(200,152,26,0.35)',
          }}
        >
          <Pencil size={14} />
          Return to EditProfileDream
        </Link>
      </div>

      {/* ── Gold infinity button ── */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/homedream" style={{ textDecoration: 'none' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              boxShadow: '0 4px 20px rgba(200,152,26,0.45)',
              fontSize: 24,
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Go to HomeDream"
          >
            ∞
          </div>
        </Link>
      </div>
    </div>
  );
}
