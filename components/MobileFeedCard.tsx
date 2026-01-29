'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreVertical,
  Eye, Zap, Award, Play, Volume2
} from 'lucide-react';
import Link from 'next/link';

interface MobileFeedCardProps {
  item: any;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function MobileFeedCard({ item, onSwipeLeft, onSwipeRight }: MobileFeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || Math.floor(Math.random() * 1000));
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    if (touchStart) {
      const distance = e.targetTouches[0].clientX - touchStart;
      setSwipeOffset(distance * 0.3); // Dampen the movement
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
      triggerHaptic();
    }
    
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
      triggerHaptic();
    }
    
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    triggerHaptic();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    triggerHaptic();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <article 
      ref={cardRef}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg overflow-hidden mb-4 mx-4 border border-slate-200/50 dark:border-slate-800/50 transition-transform active:scale-[0.98]"
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {item.author?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <Link 
                  href={`/profile/${item.author_handle || 'user'}`}
                  className="font-semibold text-slate-900 dark:text-white truncate"
                >
                  {item.author || 'Anonymous'}
                </Link>
                {item.verified && (
                  <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>

          <button className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {item.title || 'Untitled Post'}
          </h3>
          
          {item.content && (
            <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${
              isExpanded ? '' : 'line-clamp-3'
            }`}>
              {item.content}
            </p>
          )}
          
          {item.content && item.content.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {item.media_url && (
        <div className="relative bg-slate-100 dark:bg-slate-800">
          {item.media_type === 'video' ? (
            <div className="relative aspect-video">
              <img
                src={item.media_url}
                alt={item.title || 'Post media'}
                className="w-full h-full object-cover"
              />
              <button className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" />
                </div>
              </button>
            </div>
          ) : (
            <img
              src={item.media_url}
              alt={item.title || 'Post media'}
              className="w-full aspect-video object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Engagement Bar */}
      <div className="px-4 py-3 border-t border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(item.views || Math.floor(Math.random() * 5000))}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>{item.engagement_rate || Math.floor(Math.random() * 100)}%</span>
          </span>
        </div>
        {item.audio && (
          <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
            <Volume2 className="w-4 h-4" />
            <span className="font-medium">Audio</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all active:scale-95 ${
                liked
                  ? 'bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/30 dark:to-red-900/30'
                  : 'bg-slate-50 dark:bg-slate-800'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  liked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-600 dark:text-slate-400'
                }`}
              />
              <span className={`text-sm font-semibold ${
                liked ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {formatNumber(likeCount)}
              </span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-slate-50 dark:bg-slate-800 transition-all active:scale-95">
              <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatNumber(item.comments || Math.floor(Math.random() * 100))}
              </span>
            </button>

            <button className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-800 transition-all active:scale-95">
              <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <button
            onClick={handleBookmark}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${
              bookmarked
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30'
                : 'bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 transition-all ${
                bookmarked ? 'fill-blue-500 text-blue-500' : 'text-slate-600 dark:text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Swipe indicators */}
      {swipeOffset > 20 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-green-600" />
          </div>
        </div>
      )}
      {swipeOffset < -20 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-red-600" />
          </div>
        </div>
      )}
    </article>
  );
}
