import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import ProfileWidgetGrid, { type Widget, type WidgetType } from '@/components/profile/ProfileWidgetGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ViewProfile Preview – Dreamengin' };

export default async function ViewProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, avatar_url, banner_url')
    .eq('id', user.id)
    .single();

  if (!profileData?.handle) redirect('/edit-profiledream');

  // Load widgets that are public or followers-only (not private)
  const { data: instances } = await supabase
    .from('widget_instances')
    .select('id, widget_slug, config, visibility, focus_rank')
    .eq('owner_id', user.id)
    .eq('surface', 'PROFILE')
    .in('visibility', ['public', 'followers'])
    .order('focus_rank', { ascending: true });

  // Map DB rows to Widget objects understood by ProfileWidgetGrid
  const publicWidgets: Widget[] = (instances ?? []).map(row => ({
    id: row.id as string,
    type: (row.widget_slug as WidgetType) ?? 'bio',
    config: row.config ?? undefined,
    visibility: (row.visibility as Widget['visibility']) ?? 'public',
  }));

  const hasPublicWidgets = publicWidgets.length > 0;

  const profile = profileData;

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
            background: profile.avatar_url ? undefined : 'linear-gradient(135deg, #c8981a, #4A9ED6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt={profile.display_name ?? profile.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile.display_name || profile.handle || 'D')[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)' }}>
              {profile.display_name || profile.handle}
            </div>
            <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 2 }}>
              @{profile.handle}
            </div>
            {profile.bio && (
              <div style={{ fontSize: 13, color: 'var(--de-text)', marginTop: 6, lineHeight: 1.4 }}>
                {profile.bio}
              </div>
            )}
          </div>
        </div>

        {/* Widget area */}
        {hasPublicWidgets ? (
          <ProfileWidgetGrid
            displayName={profile.display_name || profile.handle}
            handle={profile.handle}
            avatarUrl={profile.avatar_url}
            bio={profile.bio}
            coverUrl={profile.banner_url}
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
      </div>
    </div>
  );
}
