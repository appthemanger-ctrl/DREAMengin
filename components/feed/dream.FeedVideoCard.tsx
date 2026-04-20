'use client';

/**
 * FeedVideoCard — In-feed video player card.
 *
 * Features:
 *  - Shows a YouTube thumbnail with a play-button overlay.
 *  - Tapping "Play" embeds the YouTube iframe inline with autoplay.
 *  - Expand button (⤢) opens a fullscreen modal overlay with the video.
 *  - Swipe left/right on the card navigates to the next/prev YouTube video
 *    in the current feed context WITHOUT scrolling the page (the touchmove
 *    listener is registered as non-passive so it can call preventDefault).
 *  - Works for both YouTube videos and user-posted video URLs.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2, Minimize2, X, Youtube,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';

// ── helpers ────────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] ?? null;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
  } catch { /* fall through */ }
  // Short-circuit for embed URLs: youtube.com/embed/<id>
  const embedMatch = url.match(/youtube\.com\/embed\/([^/?#]+)/i);
  if (embedMatch?.[1]) return embedMatch[1];
  return null;
}

function buildEmbedUrl(post: FeedPost): string | null {
  const src = post.permalink ?? post.media_url ?? null;
  if (!src) return null;
  const vid = extractYouTubeId(src);
  if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
  // If it's a direct video file URL, return as-is for <video> element
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) return src;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

// ── types ──────────────────────────────────────────────────────────────────────

export interface FeedVideoCardProps {
  /** The video post this card is anchored to in the feed. */
  post: FeedPost;
  /**
   * All video posts in the current feed context (i.e. all ytPosts).
   * Used to navigate between videos on swipe.
   */
  allVideos: FeedPost[];
  /**
   * Index of `post` within `allVideos`. Navigation starts here and allows
   * the user to swipe forward/back through the whole context.
   */
  videoIndex: number;
}

// ── component ──────────────────────────────────────────────────────────────────

export default function FeedVideoCard({ post, allVideos, videoIndex }: FeedVideoCardProps) {
  const [currentIndex, setCurrentIndex] = useState(videoIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Keep index in sync when the parent list changes (e.g. ytPosts slide-window
  // rotation adds a new item and indices shift).
  useEffect(() => {
    setCurrentIndex(videoIndex);
  }, [videoIndex]);

  // Reset playing when the current video changes so the new thumbnail shows.
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);

  const currentPost = allVideos[currentIndex] ?? post;
  const embedUrl = buildEmbedUrl(currentPost);
  const thumbnail = currentPost.media_url ?? null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allVideos.length - 1;

  // ── Swipe gesture ────────────────────────────────────────────────────────────
  // We attach the touchmove listener with { passive: false } so we can call
  // preventDefault and stop the page from scrolling while the user is doing a
  // horizontal swipe across the card.

  const containerRef = useRef<HTMLDivElement>(null);
  const swipeState = useRef<{
    startX: number;
    startY: number;
    isHorizontal: boolean | null;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      swipeState.current = { startX: t.clientX, startY: t.clientY, isHorizontal: null };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeState.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - swipeState.current.startX);
      const dy = Math.abs(t.clientY - swipeState.current.startY);

      // Determine direction on first significant move
      if (swipeState.current.isHorizontal === null && (dx > 4 || dy > 4)) {
        swipeState.current.isHorizontal = dx >= dy;
      }

      if (swipeState.current.isHorizontal) {
        // Prevent the outer scroll container from scrolling while we handle
        // the horizontal swipe ourselves.
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const state = swipeState.current;
      swipeState.current = null;
      if (!state?.isHorizontal) return;

      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - state.startX;

      // Require a minimum 40 px travel to count as a swipe
      if (Math.abs(dx) < 40) return;

      if (dx < 0 && hasNext) {
        // Swipe left → next video
        setCurrentIndex((prev) => Math.min(prev + 1, allVideos.length - 1));
      } else if (dx > 0 && hasPrev) {
        // Swipe right → previous video
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [allVideos.length, hasPrev, hasNext]);

  // ── sub-components ───────────────────────────────────────────────────────────

  const PlayButton = ({ size = 52 }: { size?: number }) => (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(239,68,68,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
        transition: 'transform 0.12s',
      }}
    >
      <svg viewBox="0 0 24 24" fill="white" width={size * 0.42} height={size * 0.42} aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );

  const VideoEmbed = ({ fullscreen = false }: { fullscreen?: boolean }) => {
    const r = fullscreen ? 0 : 12;
    if (isPlaying && embedUrl) {
      const direct = isDirectVideo(embedUrl);
      return direct ? (
        /* User-posted direct video */
        <video
          src={embedUrl}
          autoPlay
          controls
          style={{ width: '100%', height: '100%', borderRadius: r, background: '#000' }}
        />
      ) : (
        <iframe
          src={embedUrl}
          title={currentPost.content}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: r }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <>
        {thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail}
            alt={currentPost.content || 'Video thumbnail'}
            loading="lazy"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.88,
              borderRadius: r,
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg,rgba(0,0,0,0.7),rgba(15,20,35,0.9))',
            borderRadius: r,
          }} />
        )}
        {/* Play overlay */}
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
          aria-label={`Play video: ${currentPost.content || 'YouTube video'}`}
        >
          <PlayButton size={fullscreen ? 64 : 52} />
        </button>
        {/* YouTube badge */}
        {(currentPost.provider === 'youtube' || currentPost.permalink?.includes('youtu')) && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 6px', borderRadius: 4,
            background: 'rgba(0,0,0,0.72)',
            fontSize: 9, fontWeight: 700, color: '#fff',
            pointerEvents: 'none',
          }}>
            <Youtube size={9} style={{ color: '#ef4444' }} aria-hidden />
            {' '}YouTube
          </div>
        )}
      </>
    );
  };

  const NavControls = ({ dark = false }: { dark?: boolean }) => {
    if (allVideos.length <= 1) return null;
    const color = dark ? '#fff' : 'var(--de-text)';
    const dimColor = dark ? 'rgba(255,255,255,0.3)' : 'var(--de-text-dim)';
    const borderColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(160,195,240,0.25)';
    const bg = dark ? 'rgba(255,255,255,0.1)' : 'none';
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: dark ? '0 0 4px' : '6px 2px 0',
      }}>
        <button
          type="button"
          onClick={() => { setCurrentIndex((p) => Math.max(p - 1, 0)); }}
          disabled={!hasPrev}
          style={{
            padding: '4px 10px', borderRadius: 8,
            border: `1px solid ${borderColor}`,
            background: bg, color: hasPrev ? color : dimColor,
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          }}
          aria-label="Previous video"
        >
          <ChevronLeft size={14} />
          {dark ? 'Prev' : 'Prev'}
        </button>

        {/* Dot strip — shows up to 5 dots centred on the current index */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 4, overflow: 'hidden',
        }}>
          {(() => {
            const start = Math.max(0, currentIndex - 2);
            const end = Math.min(allVideos.length, start + 5);
            return Array.from({ length: end - start }, (_, i) => {
              const abs = i + start;
              return (
                <button
                  key={abs}
                  type="button"
                  onClick={() => { setCurrentIndex(abs); }}
                  style={{
                    width: abs === currentIndex ? 16 : 6,
                    height: 6, borderRadius: 3,
                    background: abs === currentIndex
                      ? (dark ? '#fff' : 'var(--de-accent)')
                      : (dark ? 'rgba(255,255,255,0.35)' : 'rgba(160,195,240,0.35)'),
                    border: 'none', padding: 0, cursor: 'pointer',
                    transition: 'width 0.2s, background 0.2s',
                  }}
                  aria-label={`Go to video ${abs + 1}`}
                  aria-current={abs === currentIndex ? 'true' : undefined}
                />
              );
            });
          })()}
        </div>

        <button
          type="button"
          onClick={() => { setCurrentIndex((p) => Math.min(p + 1, allVideos.length - 1)); }}
          disabled={!hasNext}
          style={{
            padding: '4px 10px', borderRadius: 8,
            border: `1px solid ${borderColor}`,
            background: bg, color: hasNext ? color : dimColor,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          }}
          aria-label="Next video"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  // ── Fullscreen modal ─────────────────────────────────────────────────────────

  if (isExpanded) {
    return (
      <>
        {/* In-feed placeholder keeps layout space while modal is open */}
        <div
          ref={containerRef}
          style={{ marginBottom: 12, userSelect: 'none' }}
        >
          <div style={{
            width: '100%', aspectRatio: '16/9',
            background: 'rgba(0,0,0,0.35)',
            borderRadius: 12,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(160,195,240,0.15)',
            gap: 8,
          }}>
            <Minimize2 size={16} style={{ color: 'var(--de-text-dim)' }} />
            <span style={{ color: 'var(--de-text-dim)', fontSize: 12 }}>
              Playing in fullscreen
            </span>
          </div>
        </div>

        {/* Fullscreen overlay */}
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.97)',
            display: 'flex', flexDirection: 'column',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen video player"
        >
          {/* Header bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, color: '#fff', fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', margin: 0,
              }}>
                {currentPost.profiles?.display_name || currentPost.profiles?.handle}
              </p>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.55)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', margin: '2px 0 0',
              }}>
                {(currentPost.content || '').slice(0, 90)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close fullscreen video"
            >
              <X size={18} />
            </button>
          </div>

          {/* Video area */}
          <div style={{
            flex: 1, minHeight: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 0',
          }}>
            <div style={{
              width: '100%',
              maxHeight: '100%',
              aspectRatio: '16/9',
              background: '#000',
              position: 'relative',
            }}>
              <VideoEmbed fullscreen />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ padding: '0 16px 24px', flexShrink: 0 }}>
            <NavControls dark />
            <p style={{
              textAlign: 'center', color: 'rgba(255,255,255,0.35)',
              fontSize: 11, margin: '8px 0 0',
            }}>
              {currentIndex + 1} / {allVideos.length}
              {' · '}Swipe left/right to browse
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Inline card ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{ marginBottom: 12, userSelect: 'none' }}
    >
      {/* Video viewport */}
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: '#000',
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(160,195,240,0.18)',
        position: 'relative',
      }}>
        <VideoEmbed />

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          style={{
            position: 'absolute', top: 8, left: 8,
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(0,0,0,0.62)',
            border: 'none', cursor: 'pointer',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}
          aria-label="Expand to fullscreen"
        >
          <Maximize2 size={14} />
        </button>

        {/* Swipe hint — only when not playing and there are neighbours */}
        {!isPlaying && allVideos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 20,
            background: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none',
          }}>
            <ChevronLeft size={10} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.02em' }}>
              swipe to browse
            </span>
            <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <NavControls />
    </div>
  );
}
