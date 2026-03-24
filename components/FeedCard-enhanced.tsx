'use client';

import { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreVertical,
  TrendingUp, Eye, Award, Zap, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface FeedCardProps {
   
  item: any;
}

export default function FeedCardEnhanced({ item }: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || Math.floor(Math.random() * 1000));
  const [isHovered, setIsHovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <article 
      className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Trending badge */}
      {item.trending && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center space-x-1 shadow-lg animate-pulse">
          <TrendingUp className="w-3 h-3" />
          <span>TRENDING</span>
        </div>
      )}

      <div className="p-6 relative">
        {/* Header with author info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {item.author?.charAt(0).toUpperCase() || 'U'}
              </div>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            
            <div>
              <Link 
                href={`/profile/${item.author_handle || 'user'}`}
                className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.author || 'Anonymous'}
              </Link>
              {item.verified && (
                <Award className="inline w-4 h-4 ml-1 text-blue-500" />
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
                {item.platform && ` • via ${item.platform}`}
              </p>
            </div>
          </div>

          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4 relative">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title || 'Untitled Post'}
          </h3>
          
          {item.content && (
            <p className="text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {item.content}
            </p>
          )}

          {/* Tags with animated hover */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.tags.slice(0, 5).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-105"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media preview with parallax effect */}
        {item.media_url && (
          <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group/media">
            <div className={`transform transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}>
              <img
                src={item.media_url}
                alt={item.title || 'Post media'}
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <button className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full flex items-center space-x-2 transform translate-y-4 group-hover/media:translate-y-0 transition-transform">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View Full</span>
              </button>
            </div>
          </div>
        )}

        {/* Engagement stats bar */}
        <div className="flex items-center justify-between py-3 border-t border-b border-slate-200 dark:border-slate-800 mb-3">
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(item.views || Math.floor(Math.random() * 5000))}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>{item.engagement_rate || Math.floor(Math.random() * 100)}%</span>
            </span>
          </div>
          {item.url && (
            <Link
              href={item.url}
              target="_blank"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 text-sm font-medium"
            >
              <span>View Original</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Action buttons with haptic feedback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              className={`group/btn flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                liked
                  ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  liked ? 'fill-current scale-110' : 'group-hover/btn:scale-110'
                }`}
              />
              <span className="text-sm font-medium">{formatNumber(likeCount)}</span>
            </button>

            <button className="group/btn flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all">
              <MessageCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">
                {formatNumber(item.comments || Math.floor(Math.random() * 100))}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="group/btn p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
              >
                <Share2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              </button>
              
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 min-w-[150px] animate-in slide-in-from-bottom-2">
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">
                    Copy Link
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">
                    Share to Twitter
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">
                    Share to LinkedIn
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full transition-all duration-300 ${
              bookmarked
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-110'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </article>
  );
}
