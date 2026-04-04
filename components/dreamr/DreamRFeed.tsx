'use client';

/**
 * DreamRFeed — immersive vertical snap-scroll feed.  DreamR privacy model:
 *
 *   VIEWS   — the ONLY public metric. Shown with an eye icon on every card.
 *             Replaces the position where a like count would normally appear.
 *   LIKES   — private. The heart button is interactive (tap to like / unlike)
 *             but the count is NEVER rendered publicly. Creator-only Signal tab.
 *   COMMENTS — private count. Comment button is accessible; no number shown.
 *   ALL OTHER metrics — private to creator Signal tab only.
 *
 * Interactions:
 *   Scroll UP / DOWN  → next / prev post  (CSS scroll-snap, mandatory)
 *   Swipe LEFT ≥55px  → DreamRCreatorPanel slides in (more from this creator)
 *   Heart button      → toggles liked / not-liked (no count shown)
 *   Eye chip          → shows view count (public, bottom-left of card)
 *
 * Visual: DreamR neomorphism on pearl-sky (#e8eff6),
 * sky-blue + gold accents, Plus Jakarta Sans (--font-dreamr).
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import Image from 'next/image';
import {
  Heart, MessageCircle, Share2, Bookmark,
  Eye, ChevronDown, Wifi, ArrowUp, Music2,
} from 'lucide-react';
import { useLiveFeed, type FeedPost } from '@/lib/feed/useLiveFeed';
import DreamRCreatorPanel from './DreamRCreatorPanel';

// ── Design tokens ──────────────────────────────────────────────────────────────

const DR = {
  bg:          '#e8eff6',
  sky:         '#5ba8d4',
  skyLight:    '#87CEEB',
  gold:        '#c8981a',
  text:        '#1a2840',
  textDim:     'rgba(26,40,64,0.50)',
  font:        'var(--font-dreamr,"Plus Jakarta Sans",system-ui,sans-serif)',
  shadowLight: 'rgba(255,255,255,0.90)',
  shadowDark:  'rgba(163,189,218,0.45)',
} as const;

function nmRaised(s = 5): string {
  return `${-s}px ${-s}px ${s * 2.4}px ${DR.shadowLight}, ${s}px ${s}px ${s * 2.8}px ${DR.shadowDark}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function isImage(u?: string | null): boolean {
  return !!u && /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(u);
}
function isVideo(u?: string | null): boolean {
  return !!u && (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u) || u.includes('youtube') || u.includes('youtu.be'));
}

// ── Action button ──────────────────────────────────────────────────────────────
// Note: labels are intentionally omitted for like / comment — counts are private.

function ActionBtn({
  icon, onClick, dark, active = false, ariaLabel,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  dark: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 42, height: 42,
        background: dark
          ? (active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)')
          : DR.bg,
        border: 'none', borderRadius: 13,
        cursor: 'pointer',
        boxShadow: dark ? 'none' : (active ? `inset 2px 2px 6px ${DR.shadowDark}, inset -2px -2px 5px ${DR.shadowLight}` : nmRaised(3)),
        transition: 'box-shadow 150ms, background 150ms',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
    </button>
  );
}

// ── Single card ────────────────────────────────────────────────────────────────

interface CardProps {
  post: FeedPost;
  isActive: boolean;
  onSwipeLeft: () => void;
  onLike: (id: string) => void;
  liked: boolean;
  saved: boolean;
  onSave: (id: string) => void;
}

function DreamRCard({ post, isActive, onSwipeLeft, onLike, liked, saved, onSave }: CardProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasDark    = isImage(post.media_url) || isVideo(post.media_url);

  const caption = useMemo(() => {
    if (!post.content) return '';
    try { const p = JSON.parse(post.content); return typeof p?.text === 'string' ? p.text : post.content; }
    catch { return post.content; }
  }, [post.content]);

  const hashtags     = caption.match(/#\w+/g) ?? [];
  const cleanCaption = caption.replace(/#\w+/g, '').trim();
  const isLong       = cleanCaption.length > 180;

  // views_count is the public metric — show eye icon + count (or just eye if 0)
  const views = post.views_count ?? 0;

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        flexShrink: 0, scrollSnapAlign: 'start', overflow: 'hidden',
        background: hasDark ? 'linear-gradient(180deg,#0d1526 0%,#111d35 100%)' : DR.bg,
        display: 'flex', flexDirection: 'column', fontFamily: DR.font,
      }}
      onTouchStart={e => {
        const t = e.touches[0];
        if (t) touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={e => {
        const s = touchStart.current; touchStart.current = null; if (!s) return;
        const t = e.changedTouches[0]; if (!t) return;
        const dx = t.clientX - s.x, dy = t.clientY - s.y;
        if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.2) onSwipeLeft();
      }}
    >
      {/* Background image */}
      {isImage(post.media_url) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={post.media_url!} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      )}
      {hasDark && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg,rgba(0,0,0,0.06) 0%,rgba(0,0,0,0.18) 38%,rgba(0,0,0,0.78) 100%)' }} />
      )}

      {/* Active top bar */}
      {isActive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20, background: `linear-gradient(90deg,${DR.skyLight},${DR.sky} 50%,${DR.gold})`, borderRadius: '0 0 2px 2px' }} />
      )}

      {/* Source badge */}
      {(post.provider ?? post.source) && (
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          background: hasDark ? 'rgba(255,255,255,0.13)' : DR.bg,
          boxShadow: hasDark ? 'none' : nmRaised(2),
          backdropFilter: hasDark ? 'blur(12px)' : 'none',
          borderRadius: 99, padding: '4px 11px',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: hasDark ? 'rgba(255,255,255,0.72)' : DR.sky,
        }}>
          {post.provider ?? post.source}
        </div>
      )}

      {/* ── Text-only card body ────────────────────────────────────────── */}
      {!hasDark && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 20px 140px', position: 'relative', zIndex: 2 }}>
          {/* DreamR mark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmRaised(3) }}>
              <span style={{ fontSize: 14, color: '#fff', fontWeight: 900 }}>D</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.sky, textTransform: 'uppercase' }}>DreamR</span>
          </div>

          <p style={{ fontSize: isLong ? 15 : cleanCaption.length > 80 ? 20 : 26, fontWeight: isLong ? 500 : 700, lineHeight: 1.45, color: DR.text, letterSpacing: '-0.015em', margin: 0 }}>
            {cleanCaption || caption}
          </p>

          {hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
              {hashtags.map((tag: string) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: DR.sky, background: DR.bg, boxShadow: nmRaised(2), padding: '5px 12px', borderRadius: 99 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Right action bar ──────────────────────────────────────────── */}
      {/* Like button: interactive but NO count shown publicly */}
      <div style={{ position: 'absolute', right: 12, bottom: 138, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <ActionBtn
          dark={hasDark} active={liked} ariaLabel={liked ? 'Unlike' : 'Like'}
          icon={<Heart size={21} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : (hasDark ? 'rgba(255,255,255,0.88)' : DR.text)} strokeWidth={liked ? 0 : 1.8} />}
          onClick={() => onLike(post.id)}
        />
        {/* Comment: accessible, no count shown */}
        <ActionBtn
          dark={hasDark} ariaLabel="Comment"
          icon={<MessageCircle size={21} color={hasDark ? 'rgba(255,255,255,0.88)' : DR.text} strokeWidth={1.8} />}
          onClick={() => {}}
        />
        <ActionBtn
          dark={hasDark} ariaLabel="Share"
          icon={<Share2 size={21} color={hasDark ? 'rgba(255,255,255,0.88)' : DR.text} strokeWidth={1.8} />}
          onClick={() => {}}
        />
        <ActionBtn
          dark={hasDark} active={saved} ariaLabel={saved ? 'Unsave' : 'Save'}
          icon={<Bookmark size={21} fill={saved ? DR.gold : 'none'} color={saved ? DR.gold : (hasDark ? 'rgba(255,255,255,0.88)' : DR.text)} strokeWidth={saved ? 0 : 1.8} />}
          onClick={() => onSave(post.id)}
        />
        {/* Music disc */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: hasDark ? 'rgba(255,255,255,0.09)' : `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hasDark ? 'none' : nmRaised(3) }}>
          <Music2 size={15} color={hasDark ? 'rgba(255,255,255,0.55)' : '#fff'} />
        </div>
      </div>

      {/* ── Bottom overlay ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 54, zIndex: 10,
        padding: '0 14px 18px',
        background: hasDark ? 'linear-gradient(0deg,rgba(0,0,0,0.68) 0%,transparent 100%)' : 'none',
      }}>
        {/* Creator chip */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 8, background: hasDark ? 'rgba(255,255,255,0.10)' : DR.bg, boxShadow: hasDark ? 'none' : nmRaised(3), backdropFilter: hasDark ? 'blur(14px)' : 'none', borderRadius: 99, padding: '6px 12px 6px 6px' }}>
          {post.profiles?.avatar_url ? (
            <Image src={post.profiles.avatar_url} alt="" width={26} height={26} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
              {(post.profiles?.display_name ?? post.profiles?.handle ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: hasDark ? '#fff' : DR.text, lineHeight: 1, letterSpacing: '-0.01em' }}>
              {post.profiles?.display_name ?? post.profiles?.handle ?? 'Unknown'}
            </div>
            <div style={{ fontSize: 10, color: hasDark ? 'rgba(255,255,255,0.50)' : DR.textDim, marginTop: 2 }}>
              @{post.profiles?.handle ?? '—'} · {relTime(post.created_at)}
            </div>
          </div>
        </div>

        {/* Caption for media cards */}
        {hasDark && cleanCaption && (
          <p style={{ margin: '0 0 7px', fontSize: 13, color: 'rgba(255,255,255,0.90)', lineHeight: 1.48, fontWeight: 500 }}>
            {cleanCaption.slice(0, 110)}{cleanCaption.length > 110 ? '…' : ''}
          </p>
        )}

        {/* Views chip — THE public metric, replaces like count */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: hasDark ? 'rgba(255,255,255,0.10)' : DR.bg,
            boxShadow: hasDark ? 'none' : nmRaised(2),
            backdropFilter: hasDark ? 'blur(12px)' : 'none',
            borderRadius: 99, padding: '5px 11px',
          }}>
            <Eye size={12} color={hasDark ? 'rgba(255,255,255,0.70)' : DR.sky} />
            <span style={{ fontSize: 11, fontWeight: 700, color: hasDark ? 'rgba(255,255,255,0.80)' : DR.sky, letterSpacing: '-0.01em' }}>
              {views > 0 ? fmtViews(views) : '—'} views
            </span>
          </div>
        </div>

        {/* Swipe hint */}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: hasDark ? 'rgba(255,255,255,0.28)' : DR.textDim, marginTop: 6 }}>
          ← Swipe for more from this creator
        </div>
      </div>
    </div>
  );
}

// ── Feed ───────────────────────────────────────────────────────────────────────

interface DreamRFeedProps {
  userId: string;
  userHandle: string;
  userAvatar: string | null;
  userDisplayName: string;
  initialPosts: FeedPost[];
}

export default function DreamRFeed({ userId, initialPosts }: DreamRFeedProps) {
  const { posts, newCount, flushNew, isLive } = useLiveFeed(userId, initialPosts);

  const [likedPosts,  setLikedPosts]  = useState<Set<string>>(new Set());
  const [savedPosts,  setSavedPosts]  = useState<Set<string>>(new Set());
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [creatorPost, setCreatorPost] = useState<FeedPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    setActiveIdx(Math.round(el.scrollTop / el.clientHeight));
  }, []);

  const handleLike = useCallback(async (id: string) => {
    const wasLiked = likedPosts.has(id);
    setLikedPosts(prev => { const n = new Set(prev); wasLiked ? n.delete(id) : n.add(id); return n; });
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content_type: 'post', content_id: id }),
      });
    } catch { /* non-critical — like is recorded client-side */ }
  }, [likedPosts]);

  const handleSave = useCallback((id: string) => {
    setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  if (posts.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: DR.bg, fontFamily: DR.font }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: DR.bg, boxShadow: nmRaised(8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>◈</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: DR.sky, letterSpacing: '-0.02em' }}>DreamR</div>
        <div style={{ fontSize: 13, color: DR.textDim, textAlign: 'center', maxWidth: 240, lineHeight: 1.55 }}>
          Follow creators on dreamengin to see their human media here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: DR.bg }}>

      {/* New posts banner */}
      {newCount > 0 && (
        <button type="button" onClick={flushNew}
          style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', gap: 7, background: DR.bg, boxShadow: nmRaised(5), border: 'none', borderRadius: 99, padding: '9px 20px', fontSize: 12, fontWeight: 700, color: DR.sky, cursor: 'pointer', fontFamily: DR.font }}>
          <ArrowUp size={13} style={{ color: DR.sky }} />
          {newCount} new post{newCount > 1 ? 's' : ''} — tap to show
        </button>
      )}

      {/* Live dot */}
      {isLive && (
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 30, display: 'flex', alignItems: 'center', gap: 5, background: DR.bg, boxShadow: nmRaised(2), borderRadius: 99, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: DR.sky, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: DR.font }}>
          <Wifi size={9} /> Live
        </div>
      )}

      {/* Scroll-snap container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ width: '100%', height: '100%', overflowY: 'scroll', overflowX: 'hidden', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {posts.map((post, i) => (
          <div key={post.id} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}>
            <DreamRCard
              post={post} isActive={i === activeIdx}
              onSwipeLeft={() => setCreatorPost(post)}
              onLike={handleLike}
              liked={likedPosts.has(post.id)}
              saved={savedPosts.has(post.id)}
              onSave={handleSave}
            />
          </div>
        ))}
      </div>

      {/* Scroll nudge */}
      {activeIdx === 0 && posts.length > 1 && (
        <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 15, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'dr-nudge 2s ease-in-out infinite' }}>
          <div style={{ background: DR.bg, boxShadow: nmRaised(3), borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronDown size={16} style={{ color: DR.sky }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, fontFamily: DR.font }}>SCROLL</span>
        </div>
      )}

      {/* Creator panel */}
      {creatorPost && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <DreamRCreatorPanel post={creatorPost} onClose={() => setCreatorPost(null)} />
        </div>
      )}

      <style>{`
        @keyframes dr-nudge {
          0%,100% { opacity:.55; transform:translateX(-50%) translateY(0); }
          50%      { opacity:1;   transform:translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  );
}
