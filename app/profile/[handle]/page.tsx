import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Menu, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import ProfileWidgetGrid, { type Widget } from '@/components/profile/ProfileWidgetGrid';
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
  /** DB-backed Dream configuration saved from EditProfileDream (Pass 4). */
  profile_dreams?: unknown;
};

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProfilePageProps) {
  const { handle } = await params;
  return {
    title: `@${handle} – DREAMengin`,
    description: `${handle}'s Dreamspace on DREAMengin`,
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

  // Load DB-backed Dream configuration for the public profile (Pass 4).
  // profile_dreams is stored as Widget[] JSON in the profiles table.
  // Falls back to undefined (ProfileWidgetGrid uses DEFAULT_WIDGETS then filters
  // by visibilityTier — showing the locked empty state if none are public).
  let initialDreams: Widget[] | undefined;
  if (Array.isArray(profile.profile_dreams) && profile.profile_dreams.length > 0) {
    // Keep only well-formed items (must have id: string and type: string).
    const validated = (profile.profile_dreams as unknown[]).filter(
      (item): item is Widget =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).type === 'string',
    );
    if (validated.length > 0) initialDreams = validated;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
      paddingBottom: 100,
    }}>

      {/* ── dreamengin brand header ── */}
      <div style={{ paddingTop: 16, paddingBottom: 4, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: 26,
          fontWeight: 400,
          color: '#c8981a',
          letterSpacing: '-0.01em',
        }}>
          dreamengin
        </span>
      </div>

      {/* ── Dreamspace header row (Mockup 4) ── */}
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: '6px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Hamburger */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.70)',
          border: '1px solid rgba(160,195,240,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Menu size={16} style={{ color: 'var(--de-heading)' }} />
        </div>

        {/* Title */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', margin: 0, lineHeight: 1.1 }}>
            {displayName}&apos;s Dreamspace
          </h1>
          {isOwner && (
            <p style={{ fontSize: 10, color: '#888', margin: '1px 0 0', lineHeight: 1 }}>
              Public output — built in Edit ProfileDream
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileShareButton />
          {isOwner ? (
            <Link
              href="/edit-profiledream"
              style={{
                height: 34, padding: '0 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.75)',
                border: '1.5px solid rgba(200,152,26,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, fontSize: 12, fontWeight: 700,
                textDecoration: 'none', color: '#c8981a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              title="Open Edit ProfileDream"
            >
              <Pencil size={12} />
              Edit
            </Link>
          ) : (
            <FollowButton handle={profile.handle} displayName={displayName} />
          )}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* ── IDARi Connected card (Mockup 4) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
          padding: '16px 16px',
          marginBottom: 14,
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1a1a1a, #2d1a4a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#c8981a',
            border: '2px solid rgba(200,152,26,0.30)',
            boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          }}>
            ⬡
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
              IDARi Connected
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>
              Helping teams spot patterns &amp; work better together
            </div>
            {/* AI agent icon row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Dr.Eams',   bg: '#4A90D9', emoji: '🤖' },
                { label: 'IDARi',     bg: '#1a1a1a', emoji: '⬡' },
                { label: 'Dreams',    bg: '#c8981a', emoji: '✨' },
                { label: 'Shows',     bg: '#6366f1', emoji: '📺' },
                { label: 'LabEngin',  bg: '#22c55e', emoji: '🧪' },
              ].map(agent => (
                <div key={agent.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: `${agent.bg}22`,
                    border: `1px solid ${agent.bg}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {agent.emoji}
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#888' }}>{agent.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── My Vibe section (Mockup 4) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>My Vibe</span>
            <ChevronDown size={18} style={{ color: '#888' }} />
          </div>
          {/* Concert image */}
          <div style={{
            height: 150,
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1654 40%, #c8981a55 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 14px', borderRadius: 14, marginBottom: 12, fontSize: 46,
          }}>
            🎤
          </div>
          {/* Song info */}
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>
              Starlight Muse ft MOON
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              Tick &amp; remsecia s feuiltile
            </div>
          </div>
          {/* Selfie grid placeholder */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, margin: '0 14px 14px' }}>
            {['#4A9ED6', '#c8981a', '#6366f1', '#22c55e', '#ec4899', '#1a1a1a'].map((color, i) => (
              <div key={i} style={{
                height: 70, borderRadius: 10,
                background: `linear-gradient(135deg, ${color}44, ${color}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                🎵
              </div>
            ))}
          </div>
        </div>

        {/* ── Games Dream section (Mockup 4) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>Games Dream</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Seik &amp; recipe faegijn</div>
            </div>
            <ChevronUp size={18} style={{ color: '#888' }} />
          </div>
          {/* Image collage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, margin: '0 14px', marginBottom: 4 }}>
            {/* Large warrior image */}
            <div style={{
              gridRow: 'span 2', height: 140, borderRadius: 12,
              background: 'linear-gradient(135deg, #1a0a2e 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
            }}>
              ⚔️
            </div>
            {/* Small group photos */}
            {['#22c55e', '#c8981a', '#4A9ED6', '#ec4899'].slice(0, 2).map((color, i) => (
              <div key={i} style={{
                height: 66, borderRadius: 12,
                background: `linear-gradient(135deg, ${color}44, ${color}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {['🎮', '🏆'][i]}
              </div>
            ))}
          </div>
          {/* Live Events label */}
          <div style={{ padding: '8px 16px 14px' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#c8981a',
              background: 'rgba(200,152,26,0.12)',
              border: '1px solid rgba(200,152,26,0.25)',
              borderRadius: 100, padding: '3px 10px',
            }}>
              Live Events
            </span>
          </div>
        </div>

        {/* ── Week Recap section (Mockup 4) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Week Recap</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

            {/* DayGram card */}
            <div style={{
              background: 'rgba(220,232,248,0.60)',
              borderRadius: 16, padding: '14px',
              border: '1px solid rgba(160,195,240,0.30)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Your DayGram</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['📸 3 photos', '🎵 12 plays', '💬 8 DMs'].map(item => (
                  <div key={item} style={{ fontSize: 11, color: '#555' }}>{item}</div>
                ))}
              </div>
            </div>

            {/* Weather widget */}
            <div style={{
              background: 'rgba(220,232,248,0.60)',
              borderRadius: 16, padding: '14px',
              border: '1px solid rgba(160,195,240,0.30)',
              position: 'relative',
            }}>
              {/* Close button */}
              <button type="button" style={{
                position: 'absolute', top: 8, right: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#888', padding: 0, lineHeight: 1,
              }}>
                ×
              </button>
              <div style={{ fontSize: 22, marginBottom: 4 }}>⛅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>72°</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginTop: 2 }}>DreamLand</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>Mostly Sunny.</div>
            </div>
          </div>
        </div>

        {/* ── Dream grid (existing ProfileWidgetGrid) ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dreams
          </div>
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
            initialWidgets={initialDreams}
          />
        </div>

        {/* ── Gold infinity button ── */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8981a, #e0b830)',
            boxShadow: '0 4px 20px rgba(200,152,26,0.45)',
            fontSize: 22, color: '#fff', fontWeight: 800,
            cursor: 'pointer',
          }}>
            ∞
          </div>
        </div>
      </div>
    </div>
  );
}
