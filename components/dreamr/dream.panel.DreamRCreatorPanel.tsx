'use client';

/**
 * DreamRCreatorPanel — neomorphic slide-in "more from this creator" panel.
 *
 * Opens when the user swipes left on any DreamR feed card.
 * Shows: creator identity card, follow, connected socials, their recent posts
 * (grid), and a "More like this" discovery strip.
 *
 * Visual language: DreamR neomorphism
 *  Base: #e8eff6 pearl-sky  |  Sky: #5ba8d4  |  Gold: #c8981a
 *  Font: Plus Jakarta Sans (--font-dreamr)
 *  Shadow pair: -5px -5px 12px rgba(255,255,255,0.88), 5px 5px 14px rgba(163,189,218,0.42)
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, UserPlus, UserCheck, ExternalLink,
  Music, Sparkles, Hash, Instagram, Youtube,
  MessageCircle, Globe,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';

// ── Design tokens ──────────────────────────────────────────────────────────────

const DR = {
  bg:           '#e8eff6',
  bgCard:       '#e8eff6',
  shadowLight:  'rgba(255,255,255,0.90)',
  shadowDark:   'rgba(163,189,218,0.45)',
  sky:          '#5ba8d4',
  skyLight:     '#87CEEB',
  gold:         '#c8981a',
  text:         '#1a2840',
  textDim:      'rgba(26,40,64,0.50)',
  font:         'var(--font-dreamr,"Plus Jakarta Sans",system-ui,sans-serif)',
} as const;

function nmRaised(size = 5): string {
  return `${-size}px ${-size}px ${size * 2.4}px ${DR.shadowLight}, ${size}px ${size}px ${size * 2.8}px ${DR.shadowDark}`;
}
function nmInset(size = 4): string {
  return `inset ${-size}px ${-size}px ${size * 2}px ${DR.shadowLight}, inset ${size}px ${size}px ${size * 2.4}px ${DR.shadowDark}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreatorPost {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  likes_count?: number;
}

interface ConnectedSocial { provider: string; handle?: string }

interface Props { post: FeedPost; onClose: () => void }

// ── Helpers ────────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function SocialBadge({ provider }: { provider: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <Instagram size={13} />,
    youtube:   <Youtube   size={13} />,
    twitter:   <span style={{ fontWeight: 800, fontSize: 12 }}>𝕏</span>,
    x:         <span style={{ fontWeight: 800, fontSize: 12 }}>𝕏</span>,
    spotify:   <Music      size={13} />,
  };
  return (
    <div
      title={provider}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: DR.bgCard,
        boxShadow: nmRaised(3),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: DR.sky, cursor: 'pointer', flexShrink: 0,
        fontFamily: DR.font,
      }}
    >
      {icons[provider.toLowerCase()] ?? <Globe size={13} />}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DreamRCreatorPanel({ post, onClose }: Props) {
  const creator  = post.profiles;
  const panelRef = useRef<HTMLDivElement>(null);
  const [following,    setFollowing]    = useState(false);
  const [creatorPosts, setCreatorPosts] = useState<CreatorPost[]>([]);
  const [socials,      setSocials]      = useState<ConnectedSocial[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Slide-in animation
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; el.style.opacity = '1'; });
  }, []);

  // Fetch creator's recent posts
  useEffect(() => {
    if (!creator?.handle) return;
    setLoadingPosts(true);
    fetch(`/api/posts?handle=${encodeURIComponent(creator.handle)}&limit=6`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setCreatorPosts((Array.isArray(d.posts) ? d.posts : Array.isArray(d) ? d : []).slice(0, 6)))
      .catch(() => setCreatorPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [creator?.handle]);

  // Fetch connected socials
  useEffect(() => {
    fetch('/api/connectors/status')
      .then(r => r.ok ? r.json() : [])
      .then((d: Array<{ provider?: string; connected?: boolean; handle?: string }>) => {
        setSocials(Array.isArray(d) ? d.filter(c => c.connected && c.provider).map(c => ({ provider: c.provider!, handle: c.handle })) : []);
      })
      .catch(() => setSocials([]));
  }, []);

  const tags = (post.content?.match(/#\w+/g) ?? []).slice(0, 5);

  const handleClose = () => {
    const el = panelRef.current;
    if (el) {
      el.style.transform = 'translateX(100%)';
      el.style.opacity   = '0';
      setTimeout(onClose, 260);
    } else onClose();
  };

  const avatarLetter = (creator?.display_name ?? creator?.handle ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,30,52,0.28)', zIndex: 40 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`More from ${creator?.display_name ?? creator?.handle ?? 'creator'}`}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 'min(92vw, 360px)',
          background: DR.bg,
          zIndex: 50,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transform: 'translateX(100%)', opacity: 0,
          transition: 'transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease',
          boxShadow: `-16px 0 48px rgba(15,30,52,0.16)`,
          fontFamily: DR.font,
        }}
      >
        {/* ── Top identity card ─────────────────────────────────────────── */}
        <div style={{ padding: '20px 18px 0' }}>
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              type="button" onClick={handleClose} aria-label="Close"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: DR.bg, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: DR.textDim, boxShadow: nmRaised(3),
                transition: 'box-shadow 150ms',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Avatar + name */}
          <div
            style={{
              background: DR.bg,
              borderRadius: 20,
              padding: 16,
              boxShadow: nmRaised(6),
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
            }}
          >
            {creator?.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.display_name ?? creator.handle ?? ''}
                width={56} height={56}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', boxShadow: nmRaised(4), flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 55%,${DR.gold} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#fff',
                boxShadow: nmRaised(4),
              }}>
                {avatarLetter}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: DR.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {creator?.display_name ?? creator?.handle ?? 'Unknown'}
              </div>
              <div style={{ fontSize: 12, color: DR.sky, marginTop: 3, fontWeight: 600 }}>
                @{creator?.handle ?? '—'}
              </div>
              {creator?.handle && (
                <Link
                  href={`/profile/${creator.handle}`}
                  style={{ fontSize: 11, color: DR.textDim, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                >
                  View full profile <ExternalLink size={9} />
                </Link>
              )}
            </div>
          </div>

          {/* Follow + socials row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setFollowing(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 99, border: 'none',
                cursor: 'pointer', fontFamily: DR.font,
                fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                background: following ? DR.bg : `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 60%,${DR.gold} 100%)`,
                color: following ? DR.sky : '#fff',
                boxShadow: following ? nmInset(3) : `0 6px 20px rgba(91,168,212,0.38)`,
                transition: 'all 200ms',
              }}
            >
              {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
              {following ? 'Following' : 'Follow on DreamR'}
            </button>

            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 99, border: 'none',
                cursor: 'pointer', fontFamily: DR.font,
                fontSize: 12, fontWeight: 600,
                background: DR.bg, color: DR.textDim,
                boxShadow: nmRaised(3),
              }}
            >
              <MessageCircle size={13} /> Message
            </button>

            {/* Connected socials */}
            {socials.slice(0, 3).map(s => <SocialBadge key={s.provider} provider={s.provider} />)}
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 80px' }}>

          {/* Hashtag chips */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', marginBottom: 8 }}>
                Themes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12, fontWeight: 600, fontFamily: DR.font,
                      padding: '6px 12px', borderRadius: 99,
                      background: DR.bg, color: DR.sky,
                      boxShadow: nmRaised(3),
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Hash size={10} />{tag.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator posts grid */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', marginBottom: 10 }}>
            Posts by {creator?.display_name ?? creator?.handle}
          </div>

          {loadingPosts ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 90, borderRadius: 14, background: DR.bg, boxShadow: nmInset(3) }} />
              ))}
            </div>
          ) : creatorPosts.length === 0 ? (
            <div style={{ fontSize: 13, color: DR.textDim, textAlign: 'center', padding: '20px 0', fontFamily: DR.font }}>
              No posts yet
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {creatorPosts.map(cp => (
                <div
                  key={cp.id}
                  style={{
                    borderRadius: 14, overflow: 'hidden',
                    background: DR.bg,
                    boxShadow: nmRaised(4),
                    minHeight: 90,
                  }}
                >
                  {cp.media_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cp.media_url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ padding: '10px 11px', fontSize: 12, color: DR.text, lineHeight: 1.4, fontFamily: DR.font, fontWeight: 500 }}>
                      {cp.content.slice(0, 55)}{cp.content.length > 55 ? '…' : ''}
                    </div>
                  )}
                  <div style={{ padding: '5px 10px' }}>
                    {/* Only timestamp shown — like count is private to the creator */}
                    <span style={{ fontSize: 10, color: DR.textDim, fontFamily: DR.font }}>{relTime(cp.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* More like this card */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', marginBottom: 10 }}>
              More like this
            </div>
            <div
              style={{
                padding: 16, borderRadius: 16,
                background: DR.bg,
                boxShadow: nmRaised(5),
                display: 'flex', alignItems: 'flex-start', gap: 12, fontFamily: DR.font,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: DR.bg, boxShadow: nmRaised(3),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: DR.gold,
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: DR.text, marginBottom: 4 }}>DreamR Discovery</div>
                <div style={{ fontSize: 12, color: DR.textDim, lineHeight: 1.5 }}>
                  Explore more creators and content matching this theme across the DreamR Human Media Platform.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DreamR brand footer ────────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 18px',
            background: DR.bg,
            boxShadow: `0 -1px 0 rgba(163,189,218,0.20)`,
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: DR.font,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: nmRaised(2),
          }}>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 900 }}>D</span>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: DR.sky, letterSpacing: '-0.02em' }}>DreamR</span>
            <span style={{ fontSize: 10, color: DR.textDim, marginLeft: 6, fontWeight: 500 }}>Human Media Platform</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 9, color: DR.textDim, fontWeight: 500 }}>powered by dreamengin</div>
        </div>
      </div>
    </>
  );
}
