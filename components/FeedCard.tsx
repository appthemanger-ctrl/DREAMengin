'use client';

import { formatRelativeTime } from '@/lib/utils';
import { ExternalLink, Youtube, FileText, Sparkles } from 'lucide-react';

interface FeedCardProps {
  item: {
    id: string;
    source: string;
    title: string | null;
    summary: string | null;
    url: string | null;
    ts: string;
    media_json: any;
    profiles?: {
      display_name: string | null;
      handle: string | null;
      avatar_url: string | null;
    };
  };
}

export default function FeedCard({ item }: FeedCardProps) {
  const getSourceIcon = () => {
    switch (item.source) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'app':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'demo':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <ExternalLink className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSourceColor = () => {
    switch (item.source) {
      case 'youtube':
        return 'border-red-500/40 bg-red-500/20';
      case 'app':
        return 'border-blue-500/40 bg-blue-500/20';
      case 'demo':
        return 'border-purple-500/40 bg-purple-500/20';
      default:
        return 'border-slate-700 bg-slate-700/30';
    }
  };

  return (
    <div className={`feed-card ${getSourceColor()}`}>
      <div className="flex items-start space-x-3">
        {/* Source Icon */}
        <div className="flex-shrink-0">
          {getSourceIcon()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {item.profiles && (
                <>
                  <span className="text-sm font-medium text-gray-100">
                    {item.profiles.display_name || item.profiles.handle}
                  </span>
                  <span className="text-xs text-gray-400">
                    @{item.profiles.handle}
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500">
                {formatRelativeTime(item.ts)}
              </span>
            </div>
            <span className="text-xs text-gray-500 capitalize">
              {item.source}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            {item.title || 'Untitled'}
          </h3>

          {/* Summary */}
          {item.summary && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-3">
              {item.summary}
            </p>
          )}

          {/* Media */}
          {item.media_json?.thumbnail && (
            <div className="mb-3">
              <img
                src={item.media_json.thumbnail}
                alt={item.title || 'Content thumbnail'}
                className="w-full h-48 object-cover rounded-md border border-slate-700"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </a>
            )}
            
            <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              Like
            </button>
            
            <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}