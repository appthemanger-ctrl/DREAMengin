import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProfileWidgetGrid, { DEFAULT_WIDGETS, type Widget } from '@/components/profile/ProfileWidgetGrid';
import { Pencil, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_url?: string | null;
  followers_count?: number | null;
  posts_count?: number | null;
  profile_dream_widgets?: Widget[] | null;
};

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

  const profile = rawProfile as unknown as Profile;

  // Use server-persisted widget projection (falls back to defaults if not set)
  const savedWidgets: Widget[] =
    Array.isArray(profile.profile_dream_widgets) && profile.profile_dream_widgets.length > 0
      ? profile.profile_dream_widgets
      : DEFAULT_WIDGETS;

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

      {/* ── Widget grid (saved projection) ── */}
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
          initialWidgets={savedWidgets}
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
