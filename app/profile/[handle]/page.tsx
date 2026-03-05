import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Music, ExternalLink, Store, FlaskConical, Edit2, User, Sparkles, Share2, UserPlus, ArrowLeft, Globe } from 'lucide-react';
import ProfileShareButton from '@/components/ProfileShareButton';
import ProfileWidgetBlock from '@/components/ProfileWidgetBlock';
import FollowButton from '@/components/feed/FollowButton';

type ProfileLink = {
  label?: string;
  name?: string;
  url: string;
};

// Extended profile type — DB row + optional runtime/future fields
type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  // Optional extended fields (not in current Supabase schema but accessed gracefully)
  cover_url?: string | null;
  links?: ProfileLink[] | null;
  theme?: { primary?: string } | null;
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
    title: `@${handle} – DREAMengin`,
    description: `${handle}'s public profile on DREAMengin`,
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

  if (!rawProfile) {
    notFound();
  }

  // Cast to extended Profile type — extra fields are optional, default to null
  const profile = rawProfile as Profile;

  const [{ data: music }, { data: merch }, { data: projects }] = await Promise.all([
    supabase
      .from('music_releases')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('merch')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const isOwner = currentUser?.id === profile.id;

  // Derive cover gradient from profile theme color or fall back to blue-purple
  const themeColor = profile.theme?.primary ?? null;
  const coverGradient = themeColor
    ? `linear-gradient(135deg, ${themeColor}cc 0%, ${themeColor}88 50%, #764ba2cc 100%)`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';

  const followers = profile.followers_count ?? 0;
  const following = profile.following_count ?? 0;
  const posts = profile.posts_count ?? 0;

  return (
    <div className="de-sky-bg min-h-screen" style={{ paddingBottom: 40 }}>

      {/* ── Sticky frosted-glass header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Globe className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>@{handle}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {isOwner ? (
              <Link href="/edit-profile" className="de-btn de-btn-ghost" style={{ fontSize: 11, padding: '6px 12px' }}>Edit Profile</Link>
            ) : (
              <FollowButton handle={profile.handle} displayName={profile.display_name || profile.handle} />
            )}
            <ProfileShareButton />
          </div>
        </div>
      </header>

      {/* ── Cover area ── */}
      <div
        style={{
          width: '100%',
          height: 200,
          background: coverGradient,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {profile.cover_url && (
          <Image
            src={profile.cover_url}
            alt="Cover"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        {/* Gradient overlay at bottom for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)',
          }}
        />
      </div>

      {/* ── Profile identity row ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* Avatar + actions row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -52, marginBottom: 14, position: 'relative', zIndex: 2 }}>
          {/* Avatar with gradient ring */}
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              padding: 3,
              background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent), #f093fb)',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'var(--de-mist)' }}>
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.handle}
                  width={98}
                  height={98}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
                    fontSize: 36,
                    fontWeight: 800,
                    color: 'white',
                  }}
                >
                  {(profile.display_name || profile.handle)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            <ProfileShareButton />
            {isOwner && (
              <Link
                href="/edit-profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 12,
                  background: 'var(--de-mist)',
                  border: '1px solid var(--de-border)',
                  color: 'var(--de-heading)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Edit2 size={14} />
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Name + handle */}
        <div style={{ marginBottom: 10 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--de-heading)', margin: 0, lineHeight: 1.2 }}>
            {profile.display_name || profile.handle}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--de-text-dim)', margin: '3px 0 0', fontWeight: 500 }}>
            @{profile.handle}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 14, color: 'var(--de-text)', lineHeight: 1.6, marginBottom: 14, maxWidth: 480 }}>
            {profile.bio}
          </p>
        )}

        {/* Stats row */}
        <div
          className="de-glass"
          style={{
            display: 'flex',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Followers', value: followers },
            { label: 'Following', value: following },
            { label: 'Posts', value: posts },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: '12px 8px',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--de-border)' : 'none',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 500, marginTop: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Owner: Edit Widgets CTA */}
        {isOwner && (
          <div style={{ marginBottom: 20 }}>
            <Link
              href="/edit-profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '12px 0',
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                letterSpacing: '0.02em',
              }}
            >
              <Sparkles size={16} />
              Edit Widgets
            </Link>
          </div>
        )}

        {/* ── Widget: Bio/About ── */}
        {profile.bio && (
          <ProfileWidgetBlock
            title="About"
            icon={<User size={14} />}
            editHref={isOwner ? '/edit-profile' : undefined}
          >
            <p style={{ fontSize: 14, color: 'var(--de-text)', lineHeight: 1.65, margin: 0 }}>
              {profile.bio}
            </p>
          </ProfileWidgetBlock>
        )}

        {/* ── Widget: Links ── */}
        {profile.links && (profile.links as ProfileLink[]).length > 0 && (
          <ProfileWidgetBlock
            title="Links"
            icon={<ExternalLink size={14} />}
            editHref={isOwner ? '/edit-profile' : undefined}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(profile.links as ProfileLink[]).map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--de-mist)',
                    border: '1px solid var(--de-border)',
                    textDecoration: 'none',
                    color: 'var(--de-accent)',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <ExternalLink size={13} />
                  {link.label || link.name || link.url}
                </a>
              ))}
            </div>
          </ProfileWidgetBlock>
        )}

        {/* ── Widget: Featured Dreams (placeholder) ── */}
        <ProfileWidgetBlock
          title="Featured Dreams"
          icon={<Sparkles size={14} />}
          editHref={isOwner ? '/edit-profile' : undefined}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  aspectRatio: '1',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(200,152,26,0.25), rgba(100,130,255,0.25))',
                  border: '1px solid var(--de-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                ✨
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 10, margin: '10px 0 0' }}>
            Posts coming soon
          </p>
        </ProfileWidgetBlock>

        {/* ── Widget: Music ── */}
        {music && music.length > 0 && (
          <ProfileWidgetBlock
            title="Music"
            icon={<Music size={14} />}
            editHref={isOwner ? '/music/upload' : undefined}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {music.map((track) => (
                <div
                  key={track.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--de-mist)',
                    border: '1px solid var(--de-border)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: track.embed_url ? 8 : 0 }}>
                    {track.title}
                  </div>
                  {track.embed_url && (
                    <iframe
                      src={track.embed_url}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media"
                      style={{ borderRadius: 8, border: 'none', display: 'block' }}
                      title={track.title}
                    />
                  )}
                </div>
              ))}
            </div>
          </ProfileWidgetBlock>
        )}

        {/* ── Widget: Shop ── */}
        {merch && merch.length > 0 && (
          <ProfileWidgetBlock
            title="Shop"
            icon={<Store size={14} />}
            editHref={isOwner ? '/shop/sell' : undefined}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {merch.map((item) => (
                <Link
                  key={item.id}
                  href="/shop"
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--de-mist)',
                    border: '1px solid var(--de-border)',
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name || ''}
                      style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--de-gold)', fontWeight: 600 }}>${item.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </ProfileWidgetBlock>
        )}

        {/* ── Widget: Lab Projects ── */}
        {projects && projects.length > 0 && (
          <ProfileWidgetBlock
            title="Lab Projects"
            icon={<FlaskConical size={14} />}
            editHref={isOwner ? '/lab/new' : undefined}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/lab/${project.id}`}
                  style={{
                    display: 'block',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--de-mist)',
                    border: '1px solid var(--de-border)',
                    textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{project.title}</div>
                  {project.description && (
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 3, lineHeight: 1.4 }}>
                      {project.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </ProfileWidgetBlock>
        )}

      </div>
    </div>
  );
}
