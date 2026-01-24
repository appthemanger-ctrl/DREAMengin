import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface FeedItem {
  id: string;
  type: string;
  title?: string;
  content?: string;
  mediaUrl?: string;
  createdAt: string;
  user?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface FeedCardProps {
  item: FeedItem;
}

export default function FeedCard({ item }: FeedCardProps) {
  const displayName = item.user?.displayName || item.user?.username || 'Unknown';
  const timeAgo = getTimeAgo(new Date(item.createdAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 space-y-4"
      data-testid={`feed-card-${item.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border border-white/20">
          <AvatarImage src={item.user?.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">@{item.user?.username} · {timeAgo}</p>
        </div>
        <Button size="icon" variant="ghost" className="text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      {item.title && (
        <h3 className="text-lg font-semibold">{item.title}</h3>
      )}
      
      {item.content && (
        <p className="text-foreground/90">{item.content}</p>
      )}

      {item.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img 
            src={item.mediaUrl} 
            alt={item.title || 'Media'} 
            className="w-full h-auto max-h-96 object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-white/10">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 gap-2">
          <Heart className="w-4 h-4" />
          <span className="text-xs">Like</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">Comment</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
          <Share2 className="w-4 h-4" />
          <span className="text-xs">Share</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent ml-auto">
          <Bookmark className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
