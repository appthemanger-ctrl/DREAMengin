'use client';

/**
 * DreamRFeed — immersive vertical snap-scroll feed for the DreamR Human Media Platform.
 *
 * Interaction model:
 *   • Scroll UP / DOWN  → next / previous post (CSS scroll-snap)
 *   • Swipe LEFT        → slide in DreamRCreatorPanel (more from this creator)
 *   • Right-side bar    → like, comment, share, save
 *   • Bottom overlay    → creator info, caption, hashtags
 *
 * Visual language: DreamR brand — pearl white background, sky-blue (#87CEEB)
 * and gold (#c8981a) accents. Cards with media go full-dark; text-only cards
 * stay pearl white so the feed always feels human and editorial.
 *
 * Data: reuses useLiveFeed + /api/feed so it always shows real content.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import Image from 'next/image';
import {
  Heart, MessageCircle, Share2, Bookmark, ChevronDown,
  Wifi, ArrowUp, Music2,
} from 'lucide-react';
import { useLiveFeed, type FeedPost } from '@/lib/feed/useLiveFeed';
import DreamRCreatorPanel from './DreamRCreatorPanel';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DreamRFeedProps {
  userId: string;
  userHandle: string;
  userAvatar: string | null;
  userDisplayName: string;
  initialPosts: FeedPost[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function isImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url);
}

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
    || url.includes('youtube.com')
    || url.includes('youtu.be');
}

// ── Single card ────────────────────────────────────────────────────────────────

interface CardProps {
  post: FeedPost;
  isActive: boolean;
  onSwipeLeft: () => void;
  onLike: (id: string) => void;
  liked: boolean;
  likes: number;
  saved: boolean;
  onSave: (id: string) => void;
}

function DreamRCard({
  post, isActive, onSwipeLeft, onLike, liked, likes, saved, onSave,
}: CardProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMedia  = isImageUrl(post.media_url) || isVideoUrl(post.media_url);
  const hasDark   = hasMedia;

  // Content: strip raw JSON from connector items
  const caption = useMemo(() => {
    if (!post.content) return '';
    try {
      const parsed = JSON.parse(post.content);
      return typeof parsed?.text === 'string' ? parsed.text : String(parsed);
    } catch {
      return post.content;
    }
  }, [post.content]);

  const hashtags = caption.match(/#\w+/g) ?? [];
  const cleanCaption = caption.replace(/#\w+/g, '').trim();

  // Source badge label
  const sourceBadge = post.provider ?? post.source ?? null;

  return (
    <div
      data-post-id={post.id}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        overflow: 'hidden',
        background: hasDark
          ? 'linear-gradient(180deg,#0a0f1a 0%,#111827 100%)'
          : 'linear-gradient(160deg,#f4f8fc 0%,#edf4f9 50%,#f9f6f0 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onTouchStart={e => {
        const t = e.touches[0];
        if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={e => {
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        // Swipe left: horizontal dominates, leftward, ≥ 55px
        if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          onSwipeLeft();
        }
      }}
    >
      {/* ── Background media ─────────────────────────────────────────────── */}
      {isImageUrl(post.media_url) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={post.media_url!}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Dark scrim over media */}
      {hasDark && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(180deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.18) 40%,rgba(0,0,0,0.72) 100%)',
        }} />
      )}

      {/* ── Source badge (top-left) ───────────────────────────────────────── */}
      {sourceBadge && (
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 10,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)',
          borderRadius: 99,
          padding: '4px 10px',
          fontSize: 10, fontWeight: 700,
          color: hasDark ? 'rgba(255,255,255,0.80)' : '#5ba8d4',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          border: '1px solid rgba(135,180,220,0.25)',
        }}>
          {sourceBadge}
        </div>
      )}

      {/* ── Text-only card body ──────────────────────────────────────────── */}
      {!hasDark && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px 20px',
          zIndex: 2,
          position: 'relative',
        }}>
          {/* DreamR logo mark */}
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
            color: '#87CEEB', textTransform: 'uppercase', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>◈</span> DreamR
          </div>

          <p style={{
            fontSize: caption.length > 200 ? 16 : caption.length > 80 ? 20 : 26,
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#0f1e34',
            letterSpacing: '-0.01em',
            margin: 0,
          }}>
            {cleanCaption || caption}
          </p>

          {hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {hashtags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, color: '#5ba8d4', fontWeight: 600,
                  background: 'rgba(135,180,220,0.12)',
                  padding: '3px 10px', borderRadius: 99,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Right-side action bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        right: 14,
        bottom: 120,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
      }}>
        {/* Like */}
        <ActionBtn
          icon={<Heart size={22} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : (hasDark ? '#fff' : '#0f1e34')} strokeWidth={liked ? 0 : 1.8} />}
          label={likes > 0 ? String(likes) : ''}
          onClick={() => onLike(post.id)}
          dark={hasDark}
        />
        {/* Comment */}
        <ActionBtn
          icon={<MessageCircle size={22} color={hasDark ? '#fff' : '#0f1e34'} strokeWidth={1.8} />}
          label={post.comments_count ? String(post.comments_count) : ''}
          onClick={() => {}}
          dark={hasDark}
        />
        {/* Share */}
        <ActionBtn
          icon={<Share2 size={22} color={hasDark ? '#fff' : '#0f1e34'} strokeWidth={1.8} />}
          label=""
          onClick={() => {}}
          dark={hasDark}
        />
        {/* Save */}
        <ActionBtn
          icon={<Bookmark size={22} fill={saved ? '#c8981a' : 'none'} color={saved ? '#c8981a' : (hasDark ? '#fff' : '#0f1e34')} strokeWidth={saved ? 0 : 1.8} />}
          label=""
          onClick={() => onSave(post.id)}
          dark={hasDark}
        />
        {/* Music/source disc (decorative — matches TikTok pattern) */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: hasDark
            ? 'linear-gradient(135deg,#1a1a2e,#16213e)'
            : 'linear-gradient(135deg,#87CEEB,#5ba8d4)',
          border: `2px solid ${hasDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.80)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.20)',
        }}>
          <Music2 size={14} color={hasDark ? 'rgba(255,255,255,0.70)' : '#fff'} />
        </div>
      </div>

      {/* ── Bottom creator info overlay ───────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 56,
        zIndex: 10,
        padding: '0 16px 20px',
        background: hasDark
          ? 'linear-gradient(0deg,rgba(0,0,0,0.60) 0%,transparent 100%)'
          : 'none',
      }}>
        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {post.profiles?.avatar_url ? (
            <Image
              src={post.profiles.avatar_url}
              alt={post.profiles.display_name ?? post.profiles.handle ?? ''}
              width={36}
              height={36}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${hasDark ? 'rgba(255,255,255,0.30)' : 'rgba(135,180,220,0.50)'}` }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#87CEEB,#5ba8d4,#c8981a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
              border: `2px solid ${hasDark ? 'rgba(255,255,255,0.30)' : 'rgba(135,180,220,0.50)'}`,
            }}>
              {(post.profiles?.display_name ?? post.profiles?.handle ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: hasDark ? '#fff' : '#0f1e34', lineHeight: 1 }}>
              {post.profiles?.display_name ?? post.profiles?.handle ?? 'Unknown'}
            </div>
            <div style={{ fontSize: 11, color: hasDark ? 'rgba(255,255,255,0.55)' : '#8fa8c0', marginTop: 2 }}>
              @{post.profiles?.handle ?? '—'} · {relativeTime(post.created_at)}
            </div>
          </div>
        </div>

        {/* Caption (media cards only — text-only shows in body) */}
        {hasDark && cleanCaption && (
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.90)', lineHeight: 1.45, marginBottom: 6 }}>
            {cleanCaption.slice(0, 120)}{cleanCaption.length > 120 ? '…' : ''}
          </p>
        )}

        {/* Swipe hint */}
        <div style={{
          fontSize: 10, color: hasDark ? 'rgba(255,255,255,0.35)' : 'rgba(91,168,212,0.60)',
          letterSpacing: '0.04em', marginTop: 4,
        }}>
          ← swipe for more from this creator
        </div>
      </div>

      {/* Active card indicator — thin gold top bar */}
      {isActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, zIndex: 20,
          background: 'linear-gradient(90deg,#87CEEB,#c8981a)',
        }} />
      )}
    </div>
  );
}

// ── Action button ──────────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onClick, dark,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: 4,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      {label && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: dark ? 'rgba(255,255,255,0.80)' : '#0f1e34',
          letterSpacing: '-0.01em',
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

// ── Feed component ─────────────────────────────────────────────────────────────

export default function DreamRFeed({
  userId,
  userHandle: _userHandle,
  userAvatar: _userAvatar,
  userDisplayName: _userDisplayName,
  initialPosts,
}: DreamRFeedProps) {
  const {
    posts, newCount, flushNew, isLive,
  } = useLiveFeed(userId, initialPosts);

  const [likedPosts, setLikedPosts]  = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts]  = useState<Map<string, number>>(new Map());
  const [savedPosts, setSavedPosts]  = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex]   = useState(0);
  const [creatorPost, setCreatorPost]   = useState<FeedPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync like counts from posts
  useEffect(() => {
    const m = new Map<string, number>();
    posts.forEach(p => m.set(p.id, p.likes_count ?? 0));
    setLikeCounts(m);
  }, [posts]);

  // Track active index on scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(idx);
  }, []);

  const handleLike = useCallback(async (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLikeCounts(prev => {
      const m = new Map(prev);
      const c = m.get(id) ?? 0;
      m.set(id, likedPosts.has(id) ? Math.max(0, c - 1) : c + 1);
      return m;
    });
    // Persist
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content_type: 'post', content_id: id }),
      });
    } catch { /* non-critical */ }
  }, [likedPosts]);

  const handleSave = useCallback((id: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Empty state
  if (posts.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'linear-gradient(160deg,#f4f8fc 0%,#edf4f9 50%,#f9f6f0 100%)',
      }}>
        <div style={{ fontSize: 36 }}>◈</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#5ba8d4' }}>DreamR</div>
        <div style={{ fontSize: 13, color: '#8fa8c0', textAlign: 'center', maxWidth: 240 }}>
          Follow creators on dreamengin to start seeing their content here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── New posts banner ──────────────────────────────────────────────── */}
      {newCount > 0 && (
        <button
          type="button"
          onClick={flushNew}
          style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#87CEEB,#5ba8d4)',
            color: '#fff', border: 'none', borderRadius: 99,
            padding: '8px 18px', fontSize: 12, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(91,168,212,0.40)',
            cursor: 'pointer',
          }}
        >
          <ArrowUp size={13} /> {newCount} new post{newCount > 1 ? 's' : ''} — tap to show
        </button>
      )}

      {/* ── Live indicator ────────────────────────────────────────────────── */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 12, right: 14, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'rgba(91,168,212,0.80)',
          fontWeight: 700, letterSpacing: '0.06em',
        }}>
          <Wifi size={10} /> LIVE
        </div>
      )}

      {/* ── Scroll snap container ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          /* hide scrollbar */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {posts.map((post, i) => (
          <div key={post.id} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}>
            <DreamRCard
              post={post}
              isActive={i === activeIndex}
              onSwipeLeft={() => setCreatorPost(post)}
              onLike={handleLike}
              liked={likedPosts.has(post.id)}
              likes={likeCounts.get(post.id) ?? post.likes_count ?? 0}
              saved={savedPosts.has(post.id)}
              onSave={handleSave}
            />
          </div>
        ))}
      </div>

      {/* ── Scroll nudge (first card only) ───────────────────────────────── */}
      {activeIndex === 0 && posts.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, animation: 'dreamr-nudge 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          <ChevronDown size={18} color="rgba(91,168,212,0.55)" />
          <span style={{ fontSize: 9, color: 'rgba(91,168,212,0.45)', fontWeight: 700, letterSpacing: '0.08em' }}>
            SCROLL
          </span>
        </div>
      )}

      {/* ── Creator panel (swipe-left) ────────────────────────────────────── */}
      {creatorPost && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <DreamRCreatorPanel
            post={creatorPost}
            onClose={() => setCreatorPost(null)}
          />
        </div>
      )}

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes dreamr-nudge {
          0%,100% { opacity:0.5; transform:translateX(-50%) translateY(0); }
          50%      { opacity:1;   transform:translateX(-50%) translateY(5px); }
        }
      `}</style>
    </div>
  );
}
