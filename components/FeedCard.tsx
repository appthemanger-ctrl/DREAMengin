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
        return 'border-red-200 bg-red-50';
      case 'app':
        return 'border-blue-200 bg-blue-50';
      case 'demo':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-slate-200';
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
                  <span className="text-sm font-medium text-slate-900">
                    {item.profiles.display_name || item.profiles.handle}
                  </span>
                  <span className="text-xs text-slate-500">
                    @{item.profiles.handle}
                  </span>
                </>
              )}
              <span className="text-xs text-slate-400">
                {formatRelativeTime(item.ts)}
              </span>
            </div>
            <span className="text-xs text-slate-400 capitalize">
              {item.source}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {item.title || 'Untitled'}
          </h3>

          {/* Summary */}
          {item.summary && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-3">
              {item.summary}
            </p>
          )}

          {/* Media */}
          {item.media_json?.thumbnail && (
            <div className="mb-3">
              <img
                src={item.media_json.thumbnail}
                alt={item.title || 'Content thumbnail'}
                className="w-full h-48 object-cover rounded-md"
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
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </a>
            )}
            
            <button className="text-sm text-slate-500 hover:text-slate-700">
              Like
            </button>
            
            <button className="text-sm text-slate-500 hover:text-slate-700">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}