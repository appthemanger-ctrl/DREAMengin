'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { UniverseCard, UniverseCardContent } from '@/components/universe';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { inferProviderFromUrl } from '@/lib/widgets/parseConfig';
import { ExternalLink, FileText, Heart, MessageCircle, Share2, Sparkles, Youtube } from 'lucide-react';
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
  };
  userId?: string;
}

export default memo(function FeedCard({ item, userId }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes_count || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
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
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'app':
      case 'post':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'demo':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <ExternalLink className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleLike = async () => {
    if (isLikeLoading) return;
    
    // For demo items, just toggle locally
    if (isDemo) {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      return;
    }
    
    setIsLikeLoading(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      if (wasLiked) {
        // Unlike
        const res = await fetch(`/api/likes?content_type=post&content_id=${item.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          setLikes(data.like_count);
        } else {
          // Revert on error
          setIsLiked(wasLiked);
          setLikes(prev => prev + 1);
        }
      } else {
        // Like
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'post', content_id: item.id }),
        });
        const data = await res.json();
        if (res.ok) {
          setLikes(data.like_count);
        } else {
          // Revert on error
          setIsLiked(wasLiked);
          setLikes(prev => prev - 1);
        }
      }
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setLikes(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const displayContent = contentText || item.summary || '';
  const displayTitle = contentTitle || item.title;

  return (
    <UniverseCard>
      <UniverseCardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {item.profiles?.avatar_url ? (
              <Image
                src={item.profiles.avatar_url}
                alt={item.profiles.display_name || 'User'}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(item.profiles?.display_name || item.profiles?.handle || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {item.profiles && (
                  <>
                    <span className="text-sm font-semibold text-foreground">
                      {item.profiles.display_name || item.profiles.handle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{item.profiles.handle}
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.ts)}
                </span>
              </div>
              <button 
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="More options"
              >
              </button>
            </div>

            {/* Title */}
            {displayTitle && (
              <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2">
                {displayTitle}
              </h3>
            )}

            {/* Content */}
            {displayContent && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-4">
                {displayContent}
              </p>
            )}

            {/* Media */}
            {(() => {
              const thumbnail =
                (item.media_json && typeof item.media_json === 'object' && !Array.isArray(item.media_json) &&
                  typeof (item.media_json as Record<string, unknown>).thumbnail === 'string'
                  ? ((item.media_json as Record<string, unknown>).thumbnail as string)
                  : undefined) ||
                (typeof contentObj?.image === 'string' ? (contentObj.image as string) : undefined);

              // Prefer rich embeds when URL is present
              if (mediaUrl && (mediaProvider === 'youtube' || mediaProvider === 'instagram' || mediaProvider === 'tiktok' || mediaProvider === 'x' || mediaProvider === 'threads')) {
                let embedSrc: string | undefined;

                if (mediaProvider === 'youtube') {
                  // Accept youtu.be or youtube.com/watch
                  const lower = mediaUrl.toLowerCase();
                  const idFromWatch = lower.includes('v=') ? mediaUrl.split('v=')[1]?.split('&')[0] : undefined;
                  const idFromShort = lower.includes('youtu.be/') ? mediaUrl.split('youtu.be/')[1]?.split('?')[0] : undefined;
                  const vid = idFromWatch || idFromShort;
                  if (vid) embedSrc = `https://www.youtube.com/embed/${vid}`;
                }

                if (mediaProvider === 'instagram') {
                  // Public embed (no auth). Instagram may block in some contexts; fallback will still show the link card below.
                  // Example: https://www.instagram.com/p/SHORTCODE/
                  const m = mediaUrl.match(/instagram\.com\/(p|reel)\/([^/?#]+)/i);
                  if (m?.[2]) embedSrc = `https://www.instagram.com/${m[1]}/${m[2]}/embed`;
                }

                if (mediaProvider === 'tiktok') {
                  // TikTok embed typically works via their embed URL format, but can be blocked by CSP; fallback below still works.
                  const m = mediaUrl.match(/tiktok\.com\/(@[^/]+\/video\/\d+)/i);
                  if (m?.[1]) embedSrc = `https://www.tiktok.com/embed/v2/${m[1].split('/').pop()}`;
                }

                // X/Threads often block embeds without provider JS; use link fallback only.
                if (embedSrc) {
                  return (
                    <div className="mb-3 -mx-4 sm:mx-0">
                      <div className="w-full aspect-video sm:rounded-lg overflow-hidden bg-black/5">
                        <iframe
                          src={embedSrc}
                          title={displayTitle || `${mediaProvider} embed`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mb-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1 capitalize">{mediaProvider}</div>
                    <a className="text-sm underline break-all" href={mediaUrl} target="_blank" rel="noreferrer">
                      {mediaUrl}
                    </a>
                  </div>
                );
              }

              if (thumbnail) {
                return (
                  <div className="mb-3 -mx-4 sm:mx-0">
                    <Image
                      src={thumbnail}
                      alt={displayTitle || 'Content'}
                      width={600}
                      height={300}
                      className="w-full h-48 sm:h-56 object-cover sm:rounded-lg"
                    />
                  </div>
                );
              }

              return null;
            })()}
            {/* Source badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full",
                "bg-muted/50 text-muted-foreground"
              )}>
                {getSourceIcon()}
                <span className="capitalize">{source}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 p-2 -ml-2 rounded-lg transition-colors active:scale-95",
                  isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                )}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                <span className="text-sm font-medium">{likes}</span>
              </button>
              
              <button className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors active:scale-95"
                onClick={() => setShowComments((v) => !v)}
                aria-label={showComments ? 'Hide comments' : 'Show comments'}
                aria-expanded={showComments}
              >
                <MessageCircle className={cn("w-5 h-5", showComments && "fill-current text-primary")} />
                <span className="text-sm font-medium">0</span>
              </button>
              
              <button className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors active:scale-95">
                <Share2 className="w-5 h-5" />
              </button>
              
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Collapsible comment section — toggled by the comment button above */}
        {showComments && <CommentSection postId={item.id} />}
      </UniverseCardContent>
    </UniverseCard>
  );
})