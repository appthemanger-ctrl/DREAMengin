'use client';

/**
 * DreamRCreatorPanel — slide-in panel shown when a user swipes left on a feed card.
 *
 * Shows:
 *  - Creator avatar, name, handle, bio, follow button
 *  - Their recent DreamR posts (pulled from /api/posts?handle=…)
 *  - Their connected social accounts (platform badges)
 *  - "More like this" theme tags
 *
 * Visual language: DreamR "Human Media Platform" — pearl white, sky-blue #87CEEB,
 * gold accents, clean editorial typography. Slides in from the right edge.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, UserPlus, UserCheck, Instagram, Twitter, Youtube,
  ExternalLink, Music, Sparkles, Hash,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreatorPost {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  likes_count?: number;
}

interface ConnectedSocial {
  provider: string;
  handle?: string;
  url?: string;
}

interface DreamRCreatorPanelProps {
  post: FeedPost;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SocialIcon({ provider }: { provider: string }) {
  const size = 14;
  switch (provider.toLowerCase()) {
    case 'instagram': return <Instagram size={size} />;
    case 'twitter':
    case 'x':        return <Twitter size={size} />;
    case 'youtube':  return <Youtube size={size} />;
    case 'spotify':  return <Music size={size} />;
    default:         return <ExternalLink size={size} />;
  }
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DreamRCreatorPanel({ post, onClose }: DreamRCreatorPanelProps) {
  const creator = post.profiles;
  const panelRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(false);
  const [creatorPosts, setCreatorPosts] = useState<CreatorPost[]>([]);
  const [socials, setSocials] = useState<ConnectedSocial[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Animate in on mount
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.transform = 'translateX(0)';
      el.style.opacity = '1';
    });
  }, []);

  // Fetch creator's recent posts
  useEffect(() => {
    if (!creator?.handle) return;
    setLoadingPosts(true);
    fetch(`/api/posts?handle=${encodeURIComponent(creator.handle)}&limit=6`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(data => {
        const posts = Array.isArray(data.posts) ? data.posts : Array.isArray(data) ? data : [];
        setCreatorPosts(posts.slice(0, 6));
      })
      .catch(() => setCreatorPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [creator?.handle]);

  // Fetch connected socials via connectors status
  useEffect(() => {
    fetch('/api/connectors/status')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const connected: ConnectedSocial[] = [];
        if (Array.isArray(data)) {
          data.forEach((c: { provider?: string; handle?: string; connected?: boolean }) => {
            if (c.connected && c.provider) {
              connected.push({ provider: c.provider, handle: c.handle });
            }
          });
        }
        setSocials(connected);
      })
      .catch(() => setSocials([]));
  }, []);

  // Derive theme tags from post content
  const tags = post.content
    ? post.content.match(/#\w+/g)?.slice(0, 5) ?? []
    : [];

  const handleClose = () => {
    const el = panelRef.current;
    if (el) {
      el.style.transform = 'translateX(100%)';
      el.style.opacity = '0';
      setTimeout(onClose, 260);
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.32)',
          zIndex: 40,
          cursor: 'pointer',
        }}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`More from ${creator?.display_name ?? creator?.handle ?? 'creator'}`}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(92vw, 360px)',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          /* start off-screen; JS animates to translateX(0) */
          transform: 'translateX(100%)',
          opacity: 0,
          transition: 'transform 260ms cubic-bezier(0.32,0,0.15,1), opacity 200ms ease',
          borderLeft: '1px solid rgba(135,180,220,0.25)',
          boxShadow: '-12px 0 48px rgba(100,140,180,0.18)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 16px 0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar */}
            {creator?.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.display_name ?? creator.handle ?? 'Creator'}
                width={52}
                height={52}
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(135,180,220,0.35)' }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#87CEEB 0%,#5ba8d4 50%,#c8981a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#fff',
                  fontWeight: 700,
                  border: '2px solid rgba(135,180,220,0.35)',
                }}
              >
                {(creator?.display_name ?? creator?.handle ?? '?')[0]?.toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f1e34', lineHeight: 1.2 }}>
                {creator?.display_name ?? creator?.handle ?? 'Unknown'}
              </div>
              <div style={{ fontSize: 12, color: '#5ba8d4', marginTop: 2 }}>
                @{creator?.handle ?? '—'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(135,180,220,0.12)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5ba8d4',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Follow + socials row ────────────────────────────────────────── */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFollowing(f => !f)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 99,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: following
                ? 'rgba(135,180,220,0.15)'
                : 'linear-gradient(135deg,#87CEEB 0%,#5ba8d4 60%,#c8981a 100%)',
              color: following ? '#5ba8d4' : '#fff',
              boxShadow: following ? 'none' : '0 4px 14px rgba(91,168,212,0.35)',
            }}
          >
            {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {following ? 'Following' : 'Follow'}
          </button>

          {/* Connected social badges */}
          {socials.slice(0, 4).map(s => (
            <div
              key={s.provider}
              title={`${s.provider}${s.handle ? ` • @${s.handle}` : ''}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(135,180,220,0.12)',
                border: '1px solid rgba(135,180,220,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5ba8d4',
                cursor: 'pointer',
              }}
            >
              <SocialIcon provider={s.provider} />
            </div>
          ))}

          {/* Profile link */}
          {creator?.handle && (
            <Link
              href={`/profile/${creator.handle}`}
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: '#5ba8d4',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 99,
                border: '1px solid rgba(135,180,220,0.30)',
              }}
            >
              Full profile <ExternalLink size={10} />
            </Link>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px' }}>

          {/* Theme tags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8fa8c0', textTransform: 'uppercase', marginBottom: 8 }}>
                Themes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: 'rgba(135,180,220,0.12)',
                      color: '#5ba8d4',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Hash size={10} />{tag.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* More from this creator */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8fa8c0', textTransform: 'uppercase', marginBottom: 10 }}>
            More from {creator?.display_name ?? creator?.handle}
          </div>

          {loadingPosts ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{ flex: 1, height: 80, borderRadius: 10, background: 'rgba(135,180,220,0.10)', animation: 'pulse 1.6s ease-in-out infinite' }}
                />
              ))}
            </div>
          ) : creatorPosts.length === 0 ? (
            <div style={{ fontSize: 13, color: '#8fa8c0', textAlign: 'center', padding: '20px 0' }}>
              No posts yet
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {creatorPosts.map(cp => (
                <div
                  key={cp.id}
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: cp.media_url ? 'transparent' : 'rgba(135,180,220,0.08)',
                    border: '1px solid rgba(135,180,220,0.18)',
                    minHeight: 80,
                  }}
                >
                  {cp.media_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cp.media_url}
                      alt=""
                      style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ padding: '10px 10px', fontSize: 12, color: '#1a2840', lineHeight: 1.4 }}>
                      {cp.content.slice(0, 60)}{cp.content.length > 60 ? '…' : ''}
                    </div>
                  )}
                  <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: '#8fa8c0' }}>{relativeTime(cp.created_at)}</span>
                    {cp.likes_count ? (
                      <span style={{ fontSize: 10, color: '#8fa8c0' }}>♥ {cp.likes_count}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* "More like this" discovery strip */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8fa8c0', textTransform: 'uppercase', marginBottom: 10 }}>
              More like this
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(135,180,220,0.08) 0%,rgba(200,152,26,0.06) 100%)',
                border: '1px solid rgba(135,180,220,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Sparkles size={18} style={{ color: '#c8981a', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#5ba8d4', lineHeight: 1.4 }}>
                Discover more creators and posts matching this content on the DreamR feed.
              </span>
            </div>
          </div>
        </div>

        {/* ── DreamR brand footer ─────────────────────────────────────────── */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(135,180,220,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.90)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#5ba8d4', letterSpacing: '-0.02em' }}>DreamR</span>
          <span style={{ fontSize: 10, color: '#8fa8c0', fontWeight: 500 }}>Human Media Platform</span>
        </div>
      </div>
    </>
  );
}
