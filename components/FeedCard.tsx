'use client';

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { UniverseCard, UniverseCardContent } from '@/components/universe';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { inferProviderFromUrl } from '@/lib/widgets/parseConfig';
import { ExternalLink, FileText, Heart, MessageCircle, Share2, Sparkles, Youtube, MoreHorizontal, Bookmark, Flag, Link2 } from 'lucide-react';
import CommentSection from '@/components/feed/CommentSection';

interface FeedCardProps {
  item: {
    id: string;
    type?: string;
    source?: string;
    title?: string | null;
    content?: unknown;
    summary?: string | null;
    url?: string | null;
    ts: string;
    media_json?: unknown;
    profiles?: {
      display_name: string | null;
      handle: string | null;
      avatar_url: string | null;
    };
    likes_count?: number;
    comments_count?: number;
  };
  userId?: string;
}

export default memo(function FeedCard({ item, userId }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes_count || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.comments_count || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const source = item.source || item.type || 'app';
  const isDemo = item.id.startsWith('demo-');

  const contentObj = useMemo(
    () =>
      item.content && typeof item.content === 'object' && !Array.isArray(item.content)
        ? (item.content as Record<string, unknown>)
        : undefined,
    [item.content]
  );

  const contentText = typeof contentObj?.text === 'string' ? contentObj.text : undefined;
  const contentTitle = typeof contentObj?.title === 'string' ? contentObj.title : undefined;

  const mediaUrl = typeof item.url === 'string' ? item.url : undefined;
  const mediaProvider = inferProviderFromUrl(mediaUrl);
  
  // Fetch initial like status
  useEffect(() => {
    if (isDemo || !userId) return;
    
    fetch(`/api/likes?content_type=post&content_id=${item.id}`)
      .then(res => res.json())
      .then(data => {
        setIsLiked(data.has_liked || false);
        setLikes(data.like_count || 0);
      })
      .catch(() => {});
  }, [item.id, userId, isDemo]);
  
  const getSourceIcon = () => {
    switch (source) {
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />;
      case 'app':
      case 'post':
        return <FileText className="w-3.5 h-3.5" style={{ color: 'var(--de-accent)' }} />;
      case 'demo':
        return <Sparkles className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />;
      default:
        return <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--de-text-dim)' }} />;
    }
  };

  const getSourceAccentColor = () => {
    switch (source) {
      case 'youtube': return '#ef4444';
      case 'app':
      case 'post':    return 'linear-gradient(180deg, #38bdf8, #818cf8)';
      case 'demo':    return 'linear-gradient(180deg, #c084fc, #f472b6)';
      default:        return 'rgba(160,195,240,0.40)';
    }
  };

  const handleLike = async () => {
    if (isLikeLoading) return;
    
    if (isDemo) {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      return;
    }
    
    setIsLikeLoading(true);
    const wasLiked = isLiked;
    
    setIsLiked(!wasLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      if (wasLiked) {
        const res = await fetch(`/api/likes?content_type=post&content_id=${item.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) setLikes(data.like_count);
        else { setIsLiked(wasLiked); setLikes(prev => prev + 1); }
      } else {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'post', content_id: item.id }),
        });
        const data = await res.json();
        if (res.ok) setLikes(data.like_count);
        else { setIsLiked(wasLiked); setLikes(prev => prev - 1); }
      }
    } catch {
      setIsLiked(wasLiked);
      setLikes(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const displayContent = contentText || item.summary || '';
  const displayTitle = contentTitle || item.title;
  const authorName = item.profiles?.display_name || item.profiles?.handle || 'Anonymous';
  const authorInitial = authorName[0]?.toUpperCase() ?? 'U';

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleShare = async () => {
    setShowMenu(false);
    const url = `${window.location.origin}/post/${item.id}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: displayTitle ?? 'DreamR post', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  const handleSave = async () => {
    setShowMenu(false);
    const wasAlreadySaved = isSaved;
    setIsSaved(!wasAlreadySaved);
    try {
      if (wasAlreadySaved) {
        await fetch(`/api/posts/${item.id}/save`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${item.id}/save`, { method: 'POST' });
      }
    } catch {
      setIsSaved(wasAlreadySaved); // Roll back
    }
  };

  const handleReport = async () => {
    setShowMenu(false);
    if (isDemo) return;
    try {
      await fetch(`/api/posts/${item.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_report' }),
      });
    } catch { /* silent */ }
  };

  return (
    <UniverseCard>
      <UniverseCardContent className="p-0">
        <div
          className="feed-card-premium"
          data-source={source}
          style={{ position: 'relative' }}
        >
          {/* ── Source accent left bar ── */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: getSourceAccentColor(),
            borderRadius: '20px 0 0 20px',
          }} />

          <div style={{ padding: '14px 16px 14px 20px' }}>
            {/* ── Author row ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {/* Avatar with gradient ring */}
              <span className="avatar-ring" style={{ flexShrink: 0 }}>
                {item.profiles?.avatar_url ? (
                  <Image
                    src={item.profiles.avatar_url}
                    alt={authorName}
                    width={38}
                    height={38}
                    style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.95)', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--de-blue), var(--de-accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    border: '2px solid rgba(255,255,255,0.95)',
                  }}>
                    {authorInitial}
                  </div>
                )}
              </span>

              {/* Name + handle + time */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  {item.profiles && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>
                      {item.profiles.display_name || item.profiles.handle}
                    </span>
                  )}
                  {item.profiles?.handle && (
                    <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      @{item.profiles.handle}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1, letterSpacing: '0.02em' }}>
                  {formatRelativeTime(item.ts)}
                </div>
              </div>

              {/* Source badge + more */}
              <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 999,
                  background: 'rgba(160,195,240,0.12)',
                  border: '1px solid rgba(160,195,240,0.22)',
                  fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)',
                }}>
                  {getSourceIcon()}
                  <span style={{ textTransform: 'capitalize' }}>{source}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMenu(v => !v)}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: showMenu ? 'rgba(160,195,240,0.20)' : 'none',
                    border: 'none', cursor: 'pointer',
                    color: 'var(--de-text-dim)',
                    transition: 'background 150ms',
                  }}
                  aria-label="More options"
                  aria-expanded={showMenu}
                >
                  <MoreHorizontal style={{ width: 14, height: 14 }} />
                </button>

                {/* Context menu */}
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute', top: '100%', right: 0, zIndex: 50,
                      marginTop: 4,
                      background: 'var(--de-surface, #1a1f2e)',
                      border: '1px solid rgba(160,195,240,0.18)',
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
                      minWidth: 160,
                      overflow: 'hidden',
                    }}
                  >
                    {[
                      { icon: <Bookmark size={13} />, label: isSaved ? 'Saved ✓' : 'Save post', action: handleSave },
                      { icon: copyDone ? <Link2 size={13} /> : <Share2 size={13} />, label: copyDone ? 'Link copied!' : 'Share / Copy link', action: handleShare },
                      { icon: <Flag size={13} />, label: 'Report post', action: handleReport, danger: true },
                    ].map(({ icon, label, action, danger }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => void action()}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '10px 14px', border: 'none', background: 'none',
                          cursor: 'pointer', fontSize: 12, fontWeight: 500,
                          color: danger ? '#ef4444' : 'var(--de-text)',
                          transition: 'background 120ms',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,195,240,0.10)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                      >
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Title ── */}
            {displayTitle && (
              <h3 style={{
                fontSize: 15, fontWeight: 800, color: 'var(--de-heading)',
                lineHeight: 1.3, marginBottom: 6, marginTop: 0,
                letterSpacing: '-0.01em',
              }}>
                {displayTitle}
              </h3>
            )}

            {/* ── Content ── */}
            {displayContent && (
              <p style={{
                fontSize: 13, color: 'var(--de-text-dim)',
                lineHeight: 1.65, marginBottom: 12, marginTop: 0,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {displayContent}
              </p>
            )}

            {/* ── Media ── */}
            {(() => {
              const thumbnail =
                (item.media_json && typeof item.media_json === 'object' && !Array.isArray(item.media_json) &&
                  typeof (item.media_json as Record<string, unknown>).thumbnail === 'string'
                  ? ((item.media_json as Record<string, unknown>).thumbnail as string)
                  : undefined) ||
                (typeof contentObj?.image === 'string' ? (contentObj.image as string) : undefined);

              if (mediaUrl && (mediaProvider === 'youtube' || mediaProvider === 'instagram' || mediaProvider === 'tiktok' || mediaProvider === 'x' || mediaProvider === 'threads')) {
                let embedSrc: string | undefined;
                if (mediaProvider === 'youtube') {
                  const lower = mediaUrl.toLowerCase();
                  const idFromWatch = lower.includes('v=') ? mediaUrl.split('v=')[1]?.split('&')[0] : undefined;
                  const idFromShort = lower.includes('youtu.be/') ? mediaUrl.split('youtu.be/')[1]?.split('?')[0] : undefined;
                  const vid = idFromWatch || idFromShort;
                  if (vid) embedSrc = `https://www.youtube.com/embed/${vid}`;
                }
                if (mediaProvider === 'instagram') {
                  const m = mediaUrl.match(/instagram\.com\/(p|reel)\/([^/?#]+)/i);
                  if (m?.[2]) embedSrc = `https://www.instagram.com/${m[1]}/${m[2]}/embed`;
                }
                if (mediaProvider === 'tiktok') {
                  const m = mediaUrl.match(/tiktok\.com\/(@[^/]+\/video\/\d+)/i);
                  if (m?.[1]) embedSrc = `https://www.tiktok.com/embed/v2/${m[1].split('/').pop()}`;
                }
                if (embedSrc) {
                  return (
                    <div style={{ marginBottom: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(160,195,240,0.20)' }}>
                      <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(0,0,0,0.06)' }}>
                        <iframe src={embedSrc} title={displayTitle || `${mediaProvider} embed`} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      </div>
                    </div>
                  );
                }
                return (
                  <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(160,195,240,0.18)', background: 'rgba(160,195,240,0.06)' }}>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 3, textTransform: 'capitalize', fontWeight: 600 }}>{mediaProvider}</div>
                    <a style={{ fontSize: 12, color: 'var(--de-accent)', wordBreak: 'break-all' }} href={mediaUrl} target="_blank" rel="noreferrer">{mediaUrl}</a>
                  </div>
                );
              }
              if (thumbnail) {
                return (
                  <div style={{ marginBottom: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(160,195,240,0.18)' }}>
                    <Image src={thumbnail} alt={displayTitle || 'Content'} width={600} height={300} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  </div>
                );
              }
              return null;
            })()}

            {/* ── Actions ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 10, borderTop: '1px solid rgba(160,195,240,0.15)',
              marginTop: 2,
            }}>
              <button
                type="button"
                onClick={handleLike}
                className={cn('feed-action-btn', isLiked && 'liked')}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart style={{ width: 16, height: 16, fill: isLiked ? '#ef4444' : 'none' }} />
                <span>{likes || 0}</span>
              </button>

              <button
                type="button"
                className="feed-action-btn"
                onClick={() => setShowComments(v => !v)}
                aria-label={showComments ? 'Hide comments' : 'Comment'}
                aria-expanded={showComments}
                style={{ color: showComments ? 'var(--de-accent)' : undefined }}
              >
                <MessageCircle style={{ width: 16, height: 16, fill: showComments ? 'var(--de-accent)' : 'none' }} />
                <span>{commentCount > 0 ? commentCount : ''}</span>
              </button>

              <button
                type="button"
                className="feed-action-btn"
                aria-label="Share"
                onClick={() => void handleShare()}
              >
                <Share2 style={{ width: 16, height: 16 }} />
                {copyDone && <span style={{ fontSize: 9 }}>Copied!</span>}
              </button>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feed-action-btn"
                  aria-label="Open link"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink style={{ width: 16, height: 16 }} />
                </a>
              )}
            </div>
          </div>

          {/* Collapsible comment section */}
          {showComments && (
            <div style={{ borderTop: '1px solid rgba(160,195,240,0.14)', padding: '0 16px 16px 20px' }}>
              <CommentSection postId={item.id} />
            </div>
          )}
        </div>
      </UniverseCardContent>
    </UniverseCard>
  );
})

