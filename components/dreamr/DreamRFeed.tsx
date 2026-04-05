'use client';

/**
 * DreamRFeed — the DreamR Human Media Platform feed.
 *
 * UX architecture (the algorithm made tangible):
 *   SCROLL UP/DOWN   → everyone gets their moment — new post, new voice,
 *                      ranked by creativity/originality/artistry not clout
 *   SWIPE LEFT       → you choose to go deeper into one creator's world
 *                      (DreamRCreatorPanel slides in)
 *
 * Feed composition (every ~5 posts):
 *   4 regular posts   — DreamR-algorithm-ranked (humanistic signals)
 *   1 suggested card  — alternates between:
 *                        • "You might love this" (content from unfollowed creators)
 *                        • "Connect with"        (active creator you might follow)
 *
 * Privacy model:
 *   VIEWS   — only public metric shown (eye chip on each card)
 *   LIKES   — interactive heart, zero count shown publicly
 *   COMMENTS — button accessible, no count shown
 *   All other metrics — creator Signal tab only
 *
 * Visual: DreamR neomorphism, Plus Jakarta Sans, pearl-sky base.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import Image from 'next/image';
import {
  Heart, MessageCircle, Share2, Bookmark,
  Eye, ChevronDown, Wifi, ArrowUp, Music2,
  UserPlus, UserCheck, Sparkles, ChevronUp, Loader2,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
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

function nmR(s = 5) { return `${-s}px ${-s}px ${s*2.4}px ${DR.shadowLight}, ${s}px ${s}px ${s*2.8}px ${DR.shadowDark}`; }
function nmI(s = 4) { return `inset ${-s}px ${-s}px ${s*2}px ${DR.shadowLight}, inset ${s}px ${s}px ${s*2.4}px ${DR.shadowDark}`; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface SuggestedCreator {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
}

type FeedItem =
  | { kind: 'post';    post: FeedPost }
  | { kind: 'content'; post: FeedPost }
  | { kind: 'creator'; creator: SuggestedCreator };

interface DreamRFeedProps {
  userId: string;
  userHandle: string;
  userAvatar: string | null;
  userDisplayName: string;
  initialPosts: FeedPost[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s`;
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}k`;
  return String(n);
}

function isImage(u?: string | null) { return !!u && /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(u); }

// ── Action button ──────────────────────────────────────────────────────────────

function ActionBtn({
  icon, onClick, dark, active, ariaLabel,
}: { icon: React.ReactNode; onClick: () => void; dark: boolean; active?: boolean; ariaLabel: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel}
      style={{
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dark ? (active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)') : DR.bg,
        border: 'none', borderRadius: 13, cursor: 'pointer',
        boxShadow: dark ? 'none' : (active ? nmI(3) : nmR(3)),
        transition: 'box-shadow 150ms', WebkitTapHighlightColor: 'transparent',
      }}
    >{icon}</button>
  );
}

// ── Regular post card ─────────────────────────────────────────────────────────

interface CardProps {
  post: FeedPost;
  isActive: boolean;
  onSwipeLeft: () => void;
  onLike: (id: string) => void;
  liked: boolean;
  saved: boolean;
  onSave: (id: string) => void;
}

function PostCard({ post, isActive, onSwipeLeft, onLike, liked, saved, onSave }: CardProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasDark = isImage(post.media_url);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const caption = useMemo(() => {
    if (!post.content) return '';
    try { const p = JSON.parse(post.content); return typeof p?.text === 'string' ? p.text : post.content; }
    catch { return post.content; }
  }, [post.content]);

  const hashtags     = (caption.match(/#\w+/g) ?? []) as string[];
  const cleanCaption = caption.replace(/#\w+/g, '').trim();
  const views        = post.views_count ?? 0;
  const CAPTION_LIMIT = 110;
  const captionTruncated = hasDark && cleanCaption.length > CAPTION_LIMIT && !captionExpanded;

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        scrollSnapAlign: 'start', overflow: 'hidden', flexShrink: 0,
        background: hasDark ? 'linear-gradient(180deg,#0d1526,#111d35)' : DR.bg,
        fontFamily: DR.font,
      }}
      onTouchStart={e => { const t = e.touches[0]; if (t) touchStart.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={e => {
        const s = touchStart.current; touchStart.current = null; if (!s) return;
        const t = e.changedTouches[0]; if (!t) return;
        const dx = t.clientX - s.x, dy = t.clientY - s.y;
        if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.2) onSwipeLeft();
      }}
    >
      {/* Background */}
      {isImage(post.media_url) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={post.media_url!} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      )}
      {hasDark && <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg,rgba(0,0,0,0.06) 0%,rgba(0,0,0,0.20) 38%,rgba(0,0,0,0.78) 100%)' }} />}

      {/* Active bar */}
      {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20, background: `linear-gradient(90deg,${DR.skyLight},${DR.sky} 50%,${DR.gold})` }} />}

      {/* Source badge */}
      {(post.provider || post.source) && post.provider !== 'dreamengin' && (
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, background: hasDark ? 'rgba(255,255,255,0.13)' : DR.bg, boxShadow: hasDark ? 'none' : nmR(2), backdropFilter: hasDark ? 'blur(12px)' : 'none', borderRadius: 99, padding: '4px 11px', fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: hasDark ? 'rgba(255,255,255,0.70)' : DR.sky }}>
          {post.provider ?? post.source}
        </div>
      )}

      {/* Text-only body */}
      {!hasDark && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 20px 150px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmR(3) }}>
              <span style={{ fontSize: 14, color: '#fff', fontWeight: 900 }}>D</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.sky, textTransform: 'uppercase' }}>DreamR</span>
          </div>
          <p style={{ fontSize: cleanCaption.length > 180 ? 15 : cleanCaption.length > 80 ? 20 : 26, fontWeight: cleanCaption.length > 180 ? 500 : 700, lineHeight: 1.45, color: DR.text, letterSpacing: '-0.015em', margin: 0 }}>
            {cleanCaption || caption}
          </p>
          {hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
              {hashtags.map((tag: string) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: DR.sky, background: DR.bg, boxShadow: nmR(2), padding: '5px 12px', borderRadius: 99 }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right actions */}
      <div style={{ position: 'absolute', right: 12, bottom: 138, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <ActionBtn dark={hasDark} active={liked} ariaLabel={liked ? 'Unlike' : 'Like'}
          icon={<Heart size={21} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : (hasDark ? 'rgba(255,255,255,0.88)' : DR.text)} strokeWidth={liked ? 0 : 1.8} />}
          onClick={() => onLike(post.id)} />
        <ActionBtn dark={hasDark} ariaLabel="Comment"
          icon={<MessageCircle size={21} color={hasDark ? 'rgba(255,255,255,0.88)' : DR.text} strokeWidth={1.8} />} onClick={() => {}} />
        <ActionBtn dark={hasDark} ariaLabel="Share"
          icon={<Share2 size={21} color={hasDark ? 'rgba(255,255,255,0.88)' : DR.text} strokeWidth={1.8} />} onClick={() => {}} />
        <ActionBtn dark={hasDark} active={saved} ariaLabel={saved ? 'Unsave' : 'Save'}
          icon={<Bookmark size={21} fill={saved ? DR.gold : 'none'} color={saved ? DR.gold : (hasDark ? 'rgba(255,255,255,0.88)' : DR.text)} strokeWidth={saved ? 0 : 1.8} />}
          onClick={() => onSave(post.id)} />
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: hasDark ? 'rgba(255,255,255,0.09)' : `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hasDark ? 'none' : nmR(3) }}>
          <Music2 size={15} color={hasDark ? 'rgba(255,255,255,0.55)' : '#fff'} />
        </div>
      </div>

      {/* Bottom overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 54, zIndex: 10, padding: '0 14px 18px', background: hasDark ? 'linear-gradient(0deg,rgba(0,0,0,0.68) 0%,transparent 100%)' : 'none' }}>
        {/* Creator chip */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 8, background: hasDark ? 'rgba(255,255,255,0.10)' : DR.bg, boxShadow: hasDark ? 'none' : nmR(3), backdropFilter: hasDark ? 'blur(14px)' : 'none', borderRadius: 99, padding: '6px 12px 6px 6px' }}>
          {post.profiles?.avatar_url ? (
            <Image src={post.profiles.avatar_url} alt="" width={26} height={26} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
              {(post.profiles?.display_name ?? post.profiles?.handle ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: hasDark ? '#fff' : DR.text, lineHeight: 1 }}>{post.profiles?.display_name ?? post.profiles?.handle ?? 'Unknown'}</div>
            <div style={{ fontSize: 10, color: hasDark ? 'rgba(255,255,255,0.50)' : DR.textDim, marginTop: 2 }}>@{post.profiles?.handle ?? '—'} · {relTime(post.created_at)}</div>
          </div>
        </div>

        {hasDark && cleanCaption && (
          <div style={{ marginBottom: 7 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.90)', lineHeight: 1.48, fontWeight: 500 }}>
              {captionTruncated ? cleanCaption.slice(0, CAPTION_LIMIT) : cleanCaption}
              {captionTruncated && '…'}
            </p>
            {cleanCaption.length > CAPTION_LIMIT && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setCaptionExpanded(x => !x); }}
                style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.60)', fontFamily: DR.font }}
              >
                {captionExpanded ? <><ChevronUp size={11} /> less</> : <><ChevronDown size={11} /> more</>}
              </button>
            )}
          </div>
        )}

        {/* Views — the public metric */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: hasDark ? 'rgba(255,255,255,0.10)' : DR.bg, boxShadow: hasDark ? 'none' : nmR(2), backdropFilter: hasDark ? 'blur(12px)' : 'none', borderRadius: 99, padding: '5px 11px' }}>
            <Eye size={12} color={hasDark ? 'rgba(255,255,255,0.70)' : DR.sky} />
            <span style={{ fontSize: 11, fontWeight: 700, color: hasDark ? 'rgba(255,255,255,0.80)' : DR.sky }}>
              {views > 0 ? fmtViews(views) : '—'} views
            </span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: hasDark ? 'rgba(255,255,255,0.28)' : DR.textDim }}>
            ← swipe for more
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Suggested CONTENT card ────────────────────────────────────────────────────

function SuggestedContentCard({ post, onSwipeLeft }: { post: FeedPost; onSwipeLeft: () => void }) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const caption = post.content?.slice(0, 120) ?? '';

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', scrollSnapAlign: 'start', overflow: 'hidden', flexShrink: 0, background: DR.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', fontFamily: DR.font }}
      onTouchStart={e => { const t = e.touches[0]; if (t) touchStart.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={e => {
        const s = touchStart.current; touchStart.current = null; if (!s) return;
        const t = e.changedTouches[0]; if (!t) return;
        const dx = t.clientX - s.x, dy = t.clientY - s.y;
        if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.2) onSwipeLeft();
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmR(3) }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DR.sky }}>You might love this</span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', background: DR.bg, borderRadius: 22, boxShadow: nmR(8), padding: 20 }}>
        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {post.profiles?.avatar_url ? (
            <Image src={post.profiles.avatar_url} alt="" width={40} height={40} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: nmR(3) }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: nmR(3) }}>
              {(post.profiles?.display_name ?? post.profiles?.handle ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: DR.text }}>{post.profiles?.display_name ?? post.profiles?.handle}</div>
            <div style={{ fontSize: 11, color: DR.sky, marginTop: 1 }}>@{post.profiles?.handle}</div>
          </div>
        </div>

        {/* Media preview */}
        {isImage(post.media_url) && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={post.media_url!} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 12, boxShadow: nmR(3) }} />
        )}

        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: DR.text, lineHeight: 1.5 }}>{caption}{caption.length >= 120 ? '…' : ''}</p>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: DR.textDim }}>{relTime(post.created_at)}</span>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: DR.textDim }}>← swipe for more from them</div>
        </div>
      </div>
    </div>
  );
}

// ── Suggested CREATOR card ────────────────────────────────────────────────────

function SuggestedCreatorCard({ creator }: { creator: SuggestedCreator }) {
  const [following, setFollowing] = useState(false);

  const handleFollow = async () => {
    setFollowing(true);
    try {
      await fetch('/api/follow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ target_id: creator.id }) });
    } catch { /* non-critical */ }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', scrollSnapAlign: 'start', overflow: 'hidden', flexShrink: 0, background: DR.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', fontFamily: DR.font }}>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmR(3) }}>
          <UserPlus size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DR.sky }}>Connect with</span>
      </div>

      {/* Creator card */}
      <div style={{ width: '100%', background: DR.bg, borderRadius: 22, boxShadow: nmR(8), padding: 24, textAlign: 'center' }}>
        {creator.avatar_url ? (
          <Image src={creator.avatar_url} alt="" width={72} height={72} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block', boxShadow: nmR(5) }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 12px', boxShadow: nmR(5) }}>
            {(creator.display_name ?? creator.handle ?? '?')[0]?.toUpperCase()}
          </div>
        )}

        <div style={{ fontWeight: 800, fontSize: 18, color: DR.text, letterSpacing: '-0.02em', marginBottom: 4 }}>{creator.display_name ?? creator.handle}</div>
        <div style={{ fontSize: 12, color: DR.sky, fontWeight: 600, marginBottom: creator.bio ? 10 : 16 }}>@{creator.handle}</div>

        {creator.bio && (
          <p style={{ fontSize: 13, color: DR.textDim, lineHeight: 1.5, margin: '0 0 16px' }}>{creator.bio.slice(0, 100)}{creator.bio.length > 100 ? '…' : ''}</p>
        )}

        <div style={{ fontSize: 11, color: DR.textDim, marginBottom: 18 }}>
          {creator.post_count} post{creator.post_count !== 1 ? 's' : ''} on DreamR
        </div>

        <button
          type="button"
          onClick={handleFollow}
          disabled={following}
          style={{ padding: '12px 32px', borderRadius: 99, border: 'none', cursor: following ? 'default' : 'pointer', fontFamily: DR.font, fontWeight: 800, fontSize: 13, background: following ? DR.bg : `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, color: following ? DR.sky : '#fff', boxShadow: following ? nmI(3) : '0 6px 20px rgba(91,168,212,0.35)', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all 200ms' }}>
          {following ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
        </button>
      </div>
    </div>
  );
}

// ── Main feed ─────────────────────────────────────────────────────────────────

export default function DreamRFeed({ userId, initialPosts }: DreamRFeedProps) {
  const [posts,         setPosts]         = useState<FeedPost[]>(initialPosts);
  const [sugContent,    setSugContent]    = useState<FeedPost[]>([]);
  const [sugCreators,   setSugCreators]   = useState<SuggestedCreator[]>([]);
  const [likedPosts,    setLikedPosts]    = useState<Set<string>>(new Set());
  const [savedPosts,    setSavedPosts]    = useState<Set<string>>(new Set());
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [creatorPost,   setCreatorPost]   = useState<FeedPost | null>(null);
  const [newCount,      setNewCount]      = useState(0);
  const [isLive,        setIsLive]        = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(true);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<FeedPost[]>([]);
  const offsetRef  = useRef(0);

  // ── Fetch DreamR-ranked feed ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch('/api/dreamr/feed?limit=20')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.posts?.length) {
          setPosts(d.posts);
          offsetRef.current = d.posts.length;
        }
      })
      .catch(() => { /* fall back to initialPosts */ });
  }, [userId]);

  // ── Fetch suggested content ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch('/api/dreamr/suggested?type=content&limit=4')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.suggestions) setSugContent(d.suggestions); })
      .catch(() => {});
  }, [userId]);

  // ── Fetch suggested creators ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch('/api/dreamr/suggested?type=creators&limit=3')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.suggestions) setSugCreators(d.suggestions); })
      .catch(() => {});
  }, [userId]);

  // ── Live poll (every 60 s) ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setIsLive(true);
    const interval = setInterval(() => {
      fetch('/api/dreamr/feed?limit=5')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d?.posts?.length) return;
          const currentIds = new Set(posts.map((p: FeedPost) => p.id));
          const fresh = (d.posts as FeedPost[]).filter(p => !currentIds.has(p.id));
          if (fresh.length > 0) {
            pendingRef.current = fresh;
            setNewCount(fresh.length);
          }
        })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [userId, posts]);

  const flushNew = useCallback(() => {
    if (pendingRef.current.length > 0) {
      setPosts(prev => [...pendingRef.current, ...prev]);
      pendingRef.current = [];
      setNewCount(0);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // ── Load more posts when near the end ─────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !userId) return;
    setLoadingMore(true);
    fetch(`/api/dreamr/feed?limit=20&offset=${offsetRef.current}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.posts?.length) {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = (d.posts as FeedPost[]).filter((p: FeedPost) => !existingIds.has(p.id));
            offsetRef.current += fresh.length;
            return [...prev, ...fresh];
          });
          if (d.posts.length < 20) setHasMore(false);
        } else {
          setHasMore(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, userId]);

  // ── Build interleaved feed items ────────────────────────────────────────
  // Pattern: 4 posts, then 1 suggested (content or creator, alternating)
  const feedItems = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];
    let sugContentIdx = 0;
    let sugCreatorIdx = 0;
    let sugToggle = 0; // 0 = content, 1 = creator

    for (let i = 0; i < posts.length; i++) {
      items.push({ kind: 'post', post: posts[i] });

      // After every 4th post, insert a suggested card
      if ((i + 1) % 4 === 0) {
        if (sugToggle === 0 && sugContentIdx < sugContent.length) {
          items.push({ kind: 'content', post: sugContent[sugContentIdx++] });
          sugToggle = 1;
        } else if (sugToggle === 1 && sugCreatorIdx < sugCreators.length) {
          items.push({ kind: 'creator', creator: sugCreators[sugCreatorIdx++] });
          sugToggle = 0;
        }
      }
    }
    return items;
  }, [posts, sugContent, sugCreators]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIdx(idx);
    // Trigger load-more when within 3 slots of the end
    if (idx >= feedItems.length - 3) loadMore();
  }, [feedItems.length, loadMore]);

  // ── Keyboard navigation (↑/↓ for desktop) ─────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      // Don't capture keys when a text input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(activeIdx + 1, feedItems.length - 1);
        el.scrollTo({ top: next * el.clientHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(activeIdx - 1, 0);
        el.scrollTo({ top: prev * el.clientHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, feedItems.length]);

  const handleLike = useCallback(async (id: string) => {
    const wasLiked = likedPosts.has(id);
    setLikedPosts(prev => { const n = new Set(prev); wasLiked ? n.delete(id) : n.add(id); return n; });
    try { await fetch('/api/likes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content_type: 'post', content_id: id }) }); }
    catch { /* non-critical */ }
  }, [likedPosts]);

  const handleSave = useCallback((id: string) => {
    setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  if (feedItems.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: DR.bg, fontFamily: DR.font }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: DR.bg, boxShadow: nmR(8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>◈</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: DR.sky }}>DreamR</div>
        <div style={{ fontSize: 13, color: DR.textDim, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
          Follow creators on dreamengin to see their human media here.
        </div>
        {sugCreators.length > 0 && (
          <div style={{ width: '80%', maxWidth: 280 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
              Discover creators
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sugCreators.slice(0, 3).map(c => (
                <div key={c.id} style={{ background: DR.bg, borderRadius: 16, boxShadow: nmR(5), padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.avatar_url ? (
                    <Image src={c.avatar_url} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {(c.display_name ?? c.handle ?? '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: DR.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.display_name ?? c.handle}</div>
                    <div style={{ fontSize: 11, color: DR.sky, fontWeight: 600 }}>@{c.handle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: DR.bg }}>

      {/* New posts banner */}
      {newCount > 0 && (
        <button type="button" onClick={flushNew} style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', gap: 7, background: DR.bg, boxShadow: nmR(5), border: 'none', borderRadius: 99, padding: '9px 20px', fontSize: 12, fontWeight: 700, color: DR.sky, cursor: 'pointer', fontFamily: DR.font, whiteSpace: 'nowrap' }}>
          <ArrowUp size={13} />{newCount} new — tap to show
        </button>
      )}

      {/* Live dot */}
      {isLive && (
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 30, display: 'flex', alignItems: 'center', gap: 5, background: DR.bg, boxShadow: nmR(2), borderRadius: 99, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: DR.sky, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: DR.font }}>
          <Wifi size={9} /> Live
        </div>
      )}

      {/* Scroll-snap container */}
      <div
        ref={scrollRef} onScroll={handleScroll}
        style={{ width: '100%', height: '100%', overflowY: 'scroll', overflowX: 'hidden', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {feedItems.map((item, i) => (
          <div key={item.kind === 'creator' ? `creator-${item.creator.id}` : item.post.id} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}>
            {item.kind === 'post' && (
              <PostCard post={item.post} isActive={i === activeIdx}
                onSwipeLeft={() => setCreatorPost(item.post)}
                onLike={handleLike} liked={likedPosts.has(item.post.id)}
                saved={savedPosts.has(item.post.id)} onSave={handleSave} />
            )}
            {item.kind === 'content' && (
              <SuggestedContentCard post={item.post} onSwipeLeft={() => setCreatorPost(item.post)} />
            )}
            {item.kind === 'creator' && (
              <SuggestedCreatorCard creator={item.creator} />
            )}
          </div>
        ))}

        {/* Load-more sentinel */}
        {hasMore && (
          <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DR.bg, flexShrink: 0, scrollSnapAlign: 'start' }}>
            {loadingMore ? (
              <Loader2 size={20} style={{ color: DR.sky, animation: 'dr-spin 0.8s linear infinite' }} />
            ) : (
              <button type="button" onClick={loadMore} style={{ display: 'flex', alignItems: 'center', gap: 7, background: DR.bg, boxShadow: nmR(3), border: 'none', borderRadius: 99, padding: '10px 22px', fontSize: 12, fontWeight: 700, color: DR.sky, cursor: 'pointer', fontFamily: DR.font }}>
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scroll nudge */}
      {activeIdx === 0 && feedItems.length > 1 && (
        <div style={{ position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 15, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'dr-nudge 2s ease-in-out infinite' }}>
          <div style={{ background: DR.bg, boxShadow: nmR(3), borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        @keyframes dr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
