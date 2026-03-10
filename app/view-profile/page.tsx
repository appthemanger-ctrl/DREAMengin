import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Eye } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
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

  if (!rawProfile?.handle) redirect('/edit-profiledream');

  const profile = rawProfile as Profile | null;
  const displayName = profile?.display_name || profile?.handle || 'Your Profile';
  const handle = profile?.handle ?? '';

  // Use server-persisted widget projection (falls back to defaults if not set)
  const savedDreams: ProfileDream[] =
    Array.isArray(profile?.profile_dream_widgets) && (profile?.profile_dream_widgets?.length ?? 0) > 0
      ? (profile?.profile_dream_widgets as ProfileDream[])
      : DEFAULT_DREAMS;

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
          initialWidgets={savedDreams}
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
