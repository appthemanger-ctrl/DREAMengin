'use client';

/**
 * DreamRChannelPanel — neomorphic slide-in panel for YouTube channel + similar content.
 *
 * Opens when the user swipes left on a YouTube/video card in the DreamRFeed.
 * Shows:
 *   - Channel identity (name from post.profiles.display_name)
 *   - More videos from that exact channel (fetched via /api/youtube/channel)
 *   - Similar / topic-related videos section
 *
 * Visual language: DreamR neomorphism (identical to DreamRCreatorPanel).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Youtube, Play, Maximize2, ExternalLink,
  Loader2, ChevronRight,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
import type { UnifiedFeedItem } from '@/types/connector';

// ── Design tokens ──────────────────────────────────────────────────────────────

const DR = {
  bg:          '#e8eff6',
  shadowLight: 'rgba(255,255,255,0.90)',
  shadowDark:  'rgba(163,189,218,0.45)',
  sky:         '#5ba8d4',
  skyLight:    '#87CEEB',
  gold:        '#c8981a',
  text:        '#1a2840',
  textDim:     'rgba(26,40,64,0.50)',
  font:        'var(--font-dreamr,"Plus Jakarta Sans",system-ui,sans-serif)',
} as const;

function nmR(s = 5): string {
  return `${-s}px ${-s}px ${s*2.4}px ${DR.shadowLight}, ${s}px ${s}px ${s*2.8}px ${DR.shadowDark}`;
}
function nmI(s = 4): string {
  return `inset ${-s}px ${-s}px ${s*2}px ${DR.shadowLight}, inset ${s}px ${s}px ${s*2.4}px ${DR.shadowDark}`;
}

// ── Helper: extract YouTube video ID from permalink ────────────────────────────

function extractVideoId(permalink: string): string | null {
  try {
    const u = new URL(permalink);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] ?? null;
    const v = u.searchParams.get('v');
    if (v) return v;
  } catch { /* fall through */ }
  const m = permalink.match(/youtube\.com\/embed\/([^/?#]+)/i);
  return m?.[1] ?? null;
}

function embedUrl(permalink: string): string | null {
  const id = extractVideoId(permalink);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}

// ── Mini video thumbnail ───────────────────────────────────────────────────────

function VideoThumb({
  item, onPlay,
}: { item: UnifiedFeedItem; onPlay?: () => void }) {
  const thumb = item.media[0]?.thumbnail_url ?? item.media[0]?.url ?? null;
  const [playing, setPlaying] = useState(false);
  const embed = item.permalink ? embedUrl(item.permalink) : null;

  return (
    <div
      style={{
        position: 'relative', width: '100%', aspectRatio: '16/9',
        borderRadius: 12, overflow: 'hidden',
        background: '#0d1526', flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={() => { setPlaying(true); onPlay?.(); }}
    >
      {playing && embed ? (
        <iframe
          src={embed}
          title={item.content_text}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          {thumb && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.22)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.40)' }}>
              <Play size={16} fill="#fff" color="#fff" />
            </div>
          </div>
          {/* YT badge */}
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.70)', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#fff' }}>
            <Youtube size={9} color="#ef4444" /> YouTube
          </div>
        </>
      )}
    </div>
  );
}

// ── VideoRow — compact list item ───────────────────────────────────────────────

function VideoRow({ item }: { item: UnifiedFeedItem }) {
  const thumb = item.media[0]?.thumbnail_url ?? null;
  const [playing, setPlaying] = useState(false);
  const embed = item.permalink ? embedUrl(item.permalink) : null;

  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid rgba(163,189,218,0.18)` }}>
      {/* Thumb */}
      <div
        style={{ width: 88, height: 52, borderRadius: 8, overflow: 'hidden', background: '#0d1526', flexShrink: 0, position: 'relative', cursor: 'pointer' }}
        onClick={() => setPlaying(true)}
      >
        {playing && embed ? (
          <iframe src={embed} title={item.content_text} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; encrypted-media" allowFullScreen />
        ) : (
          <>
            {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.90)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={10} fill="#fff" color="#fff" />
              </div>
            </div>
          </>
        )}
      </div>
      {/* Meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: DR.text, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 4 }}>
          {item.content_text}
        </div>
        <div style={{ fontSize: 10, color: DR.textDim, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.author_name}
        </div>
        {item.permalink && (
          <a href={item.permalink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, fontSize: 10, color: DR.sky, fontWeight: 600, textDecoration: 'none' }}>
            Watch on YouTube <ExternalLink size={9} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  /** The YouTube post card that was swiped left */
  post: FeedPost;
  /** Active topic label (e.g. "World News") for "Similar" section */
  activeTopic: string;
  onClose: () => void;
}

export default function DreamRChannelPanel({ post, activeTopic, onClose }: Props) {
  const [channelVideos, setChannelVideos] = useState<UnifiedFeedItem[]>([]);
  const [similarVideos, setSimilarVideos] = useState<UnifiedFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'channel' | 'similar'>('channel');
  const panelRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const channelName = post.profiles?.display_name ?? post.profiles?.handle ?? '';
  const topicQuery  = activeTopic && activeTopic !== 'All' ? activeTopic : 'trending videos';

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Slide-in animation
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.style.transform = 'translateX(100%)';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 340ms cubic-bezier(0.22,1,0.36,1)';
      el.style.transform  = 'translateX(0)';
    });
  }, []);

  // Fetch channel + similar videos
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      channel: channelName,
      topic:   topicQuery,
      max:     '8',
    });
    fetch(`/api/youtube/channel?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!mountedRef.current || !d?.ok) return;
        setChannelVideos(d.channelVideos ?? []);
        setSimilarVideos(d.similarVideos ?? []);
      })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [channelName, topicQuery]);

  const handleClose = useCallback(() => {
    const el = panelRef.current;
    if (el) {
      el.style.transition = 'transform 260ms cubic-bezier(0.4,0,1,1)';
      el.style.transform  = 'translateX(100%)';
      setTimeout(onClose, 260);
    } else {
      onClose();
    }
  }, [onClose]);

  const thumb     = post.media_url ?? null;
  const permalink = post.permalink ?? null;
  const embed     = permalink ? embedUrl(permalink) : null;
  const [heroPlaying, setHeroPlaying] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);

  const activeVideos = section === 'channel' ? channelVideos : similarVideos;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: DR.bg,
        fontFamily: DR.font,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmR(2) }}>
            <Youtube size={15} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: DR.text, letterSpacing: '-0.01em', lineHeight: 1 }}>{channelName}</div>
            <div style={{ fontSize: 10, color: DR.textDim, fontWeight: 500, marginTop: 2 }}>YouTube Channel</div>
          </div>
        </div>
        <button type="button" onClick={handleClose}
          style={{ width: 34, height: 34, borderRadius: 11, border: 'none', background: DR.bg, boxShadow: nmR(3), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DR.textDim }}>
          <X size={16} />
        </button>
      </div>

      {/* Hero video */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: nmR(6) }}>
          {heroPlaying && embed ? (
            <iframe src={embed} title={post.content} style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0d1526' }}>
              {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.65) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {embed && (
                  <button type="button" onClick={() => setHeroPlaying(true)}
                    style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <Play size={22} fill="#fff" color="#fff" />
                  </button>
                )}
              </div>
              {/* Expand + Watch buttons */}
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                {embed && (
                  <button type="button" onClick={() => setHeroExpanded(true)}
                    style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.62)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700 }}>
                    <Maximize2 size={11} /> Full
                  </button>
                )}
                {permalink && (
                  <a href={permalink} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.82)', textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700 }}>
                    <ExternalLink size={10} /> YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: DR.text, lineHeight: 1.4 }}>
          {post.content?.slice(0, 100)}{(post.content?.length ?? 0) > 100 ? '…' : ''}
        </p>
      </div>

      {/* Section tabs */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, background: DR.bg, borderRadius: 12, boxShadow: nmI(4), padding: 4 }}>
          {(['channel', 'similar'] as const).map(s => {
            const active = section === s;
            const label  = s === 'channel' ? `More from ${channelName.slice(0, 18)}` : `Similar: ${topicQuery.slice(0, 20)}`;
            return (
              <button key={s} type="button" onClick={() => setSection(s)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: DR.font,
                  fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                  background: active ? `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})` : 'transparent',
                  color: active ? '#fff' : DR.textDim,
                  boxShadow: active ? '0 3px 12px rgba(91,168,212,0.30)' : 'none',
                  transition: 'all 180ms',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video list */}
      <div style={{ flex: 1, padding: '8px 16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
            <Loader2 size={22} style={{ color: DR.sky, animation: 'dr-spin 0.8s linear infinite' }} />
          </div>
        ) : activeVideos.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32, color: DR.textDim, fontSize: 13 }}>
            No videos found
          </div>
        ) : (
          activeVideos.map(item => (
            <VideoRow key={item.external_id} item={item} />
          ))
        )}
      </div>

      {/* Fullscreen overlay */}
      {heroExpanded && embed && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.97)', display: 'flex', flexDirection: 'column' }} role="dialog" aria-modal="true">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: '#fff', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content?.slice(0, 80)}</p>
            </div>
            <button type="button" onClick={() => setHeroExpanded(false)}
              style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
              <iframe src={embed} title={post.content} style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
          <div style={{ padding: '8px 16px 28px', textAlign: 'center' }}>
            {permalink && (
              <a href={permalink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: DR.font }}>
                <ExternalLink size={14} /> Watch on YouTube <ChevronRight size={13} />
              </a>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes dr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
