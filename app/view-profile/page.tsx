import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Eye } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import ProfileShareButton from '@/components/ProfileShareButton';
import DreamWord from '@/components/ui/DreamWord';
import { connection } from 'next/server';


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
  following_count?: number | null;
  profile_dream_widgets?: ProfileDream[] | null;
};

/**
 * ViewProfile — canonical public-profile preview surface (README §6).
 *
 * Renders the authenticated user's own profile exactly as an outside visitor
 * would see it, using only saved/public output (DreamOutputLayer projection
 * model). This is the "preview before share" surface (README §6.4).
 *
 * Privacy: auth-gated (owners only). Mirrors public /profile/[handle] rendering
 * so owners can verify their public output before sharing the link.
 *
 * Phase 8 §B Point 21: Dream Windows render only from DB records with
 * visibility = 'shared' OR visibility = 'public'. The query never includes
 * visibility = 'private' records. This is enforced at both the query level
 * (explicit filter) and the RLS level (dream_windows table policies).
 */
export default async function ViewProfilePage() {
  await connection();
  const supabase = await createServerClient();

  // Gracefully handle Supabase being unavailable (no configured env vars)
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured — redirect to login
  }

  if (!user) redirect('/login');

  let rawProfile: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    rawProfile = data;
  } catch {
    // Supabase unavailable
  }

  // If the user exists but has no handle yet, render a setup prompt instead of
  // redirecting to /edit-profiledream — that creates an infinite redirect loop
  // because edit-profiledream's back button goes to /view-profile.
  if (!rawProfile?.handle) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: 24, padding: '36px 28px', maxWidth: 400, width: '100%',
          textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✏️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            Set up your profile
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
            You haven&apos;t set a handle yet. Finish setting up your profile so others can find you.
          </p>
          <Link
            href="/edit-profiledream"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 9999,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(200,152,26,0.3)',
            }}
          >
            Edit Profile
          </Link>
        </div>
      </div>
    );
  }

  const profile = rawProfile as unknown as Profile;

  // ── Phase 8 §B Point 21: Query dream_windows with explicit visibility filter ──
  // Only shared/public records are fetched. The query NEVER includes private records.
  // RLS policies on dream_windows enforce this at the DB layer as well.
  let dreamWindowRecords: Array<{
    id: string; type: string; config: Record<string, unknown>;
    size: { width: number; height: number }; position: { x: number; y: number };
    visibility: string; active_state: string;
  }> | null = null;
  try {
    const { data } = await (supabase as any)
      .from('dream_windows')
      .select('id, type, config, size, position, visibility, active_state')
      .eq('owner_id', user.id)
      .in('visibility', ['shared', 'public']);
    dreamWindowRecords = data;
  } catch {
    // dream_windows table may not exist yet
  }

  // ── Phase 6 item 8: Consult visibility_mappings as authoritative source ──
  // Per dreamengin_phase6.md point 13: the visibility_mappings table must be
  // consulted before any content is rendered on ViewProfile.
  // If the table has records for this user, they override the widget's own
  // visibility field. If no mapping exists for a widget, fall back to the
  // widget's own visibility (private by default — LAW.md §2).
  type VisibilityMappingRow = { content_id: string; visibility: string };
  let mappingsData: VisibilityMappingRow[] | null = null;
  try {
    const { data } = await (supabase as any)
      .from('visibility_mappings')
      .select('content_id, visibility')
      .eq('user_id', user.id);
    mappingsData = data;
  } catch {
    // visibility_mappings table may not exist yet
  }

  // Build a lookup: content_id → visibility
  const mappingLookup = new Map<string, string>(
    (mappingsData ?? []).map((m) => [m.content_id, m.visibility])
  );

  // Use server-persisted widget projection (falls back to defaults if not set)
  const allSavedDreams: ProfileDream[] =
    Array.isArray(profile.profile_dream_widgets) && profile.profile_dream_widgets.length > 0
      ? profile.profile_dream_widgets
      : DEFAULT_DREAMS;

  // Filter to only publicly visible widgets — owner preview mirrors what visitors see.
  // Per ARCHITECTURE.md §5: ViewProfile renders only saved/shared output.
  // Consult visibility_mappings first (authoritative); fall back to widget.visibility.
  // Widgets with no visibility set default to 'private' (nothing public by default).
  // Phase 8 §B Point 21: never include 'private' visibility Dream Windows.
  const savedDreams = allSavedDreams.filter((w) => {
    // Use visibility_mappings record if one exists for this widget
    const mappedVisibility = mappingLookup.get(w.id);
    const effectiveVisibility = mappedVisibility ?? w.visibility ?? 'private';
    // Strict enforcement: only 'shared' or 'public' — never 'private'
    return effectiveVisibility === 'public' || effectiveVisibility === 'shared' || effectiveVisibility === 'followers';
  });

  // Count Dream Windows from the dream_windows table (new Phase 8 §B records)
  const dreamWindowCount = dreamWindowRecords?.length ?? 0;

  const displayName = profile.display_name || profile.handle;
  const handle = profile.handle ?? '';

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
        <Eye style={{ width: 14, height: 14, color: '#c8981a', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8a6a10', letterSpacing: '0.02em' }}>
          Visitor preview — this is exactly how your profile appears to others
          {dreamWindowCount > 0 && ` · ${dreamWindowCount} Dream Window${dreamWindowCount === 1 ? '' : 's'} shared`}
        </span>
      </div>

      {/* ── dreamengin brand header ── */}
      <div style={{ paddingTop: 18, paddingBottom: 2, textAlign: 'center' }}>
        <span
          className="de-wordmark"
          style={{ fontSize: 28 }}
        >
          <DreamWord />engin
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
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
        {savedDreams.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24, margin: '20px 0',
            border: '1px solid rgba(200,152,26,0.2)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>
              No public Dreams yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
              Your profile is private. Go to EditProfileDream and set Dream Window visibility to <strong>Public</strong> or <strong>Shared</strong> to share them here.
            </div>
            <Link
              href="/edit-profiledream"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 9999,
                background: 'linear-gradient(135deg, #c8981a, #e0b830)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(200,152,26,0.3)',
              }}
            >
              Edit Profile Dreams
            </Link>
          </div>
        ) : (
          <ProfileWidgetGrid
            displayName={displayName}
            handle={handle}
            avatarUrl={profile.avatar_url ?? null}
            avatarEditHref="/edit-profiledream"
            bio={profile.bio ?? null}
            coverUrl={profile.cover_url ?? null}
            followers={profile.followers_count ?? 0}
            following={profile.following_count ?? 0}
            posts={profile.posts_count ?? 0}
            likes={0}
            isEditing={false}
            initialWidgets={savedDreams}
          />
        )}
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
