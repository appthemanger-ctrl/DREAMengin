import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, UserPlus, Search, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface FriendsWidgetProps {
  fullView?: boolean;
}

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  activity?: string;
}

export default function FriendsWidget({ fullView = false }: FriendsWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [friends] = useState<Friend[]>([
    { id: '1', username: 'dreamcatcher', displayName: 'Dream Catcher', status: 'online', activity: 'Playing Roblox' },
    { id: '2', username: 'skywalker', displayName: 'Sky Walker', status: 'online', activity: 'Listening to music' },
    { id: '3', username: 'moonlight', displayName: 'Moon Light', status: 'away', activity: 'Away' },
    { id: '4', username: 'stargazer', displayName: 'Star Gazer', status: 'offline' },
    { id: '5', username: 'sunbeam', displayName: 'Sun Beam', status: 'offline' },
  ]);

  const statusColors = {
    online: 'bg-status-online',
    away: 'bg-status-away',
    offline: 'bg-status-offline',
  };

  const onlineFriends = friends.filter(f => f.status === 'online');
  const offlineFriends = friends.filter(f => f.status !== 'online');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass ${fullView ? 'p-6' : 'p-4'}`}
      data-testid="widget-friends"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Friends</h3>
            <p className="text-xs text-muted-foreground">
              {onlineFriends.length} online
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="text-muted-foreground" data-testid="button-add-friend">
          <UserPlus className="w-5 h-5" />
        </Button>
      </div>

      {fullView && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-10"
            data-testid="input-search-friends"
          />
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2">
        {/* Online Friends */}
        {onlineFriends.slice(0, fullView ? 10 : 3).map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
            data-testid={`friend-card-${friend.id}`}
          >
            <div className="relative">
              <Avatar className="w-10 h-10 border border-white/10">
                <AvatarImage src={friend.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {friend.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[friend.status]} border-2 border-background`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{friend.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{friend.activity || 'Offline'}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}

        {/* Offline Friends */}
        {fullView && offlineFriends.length > 0 && (
          <>
            <div className="text-xs text-muted-foreground uppercase tracking-wide pt-4 pb-2">
              Offline - {offlineFriends.length}
            </div>
            {offlineFriends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (onlineFriends.length + index) * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer opacity-60"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarFallback className="bg-muted/20 text-muted-foreground text-sm">
                      {friend.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[friend.status]} border-2 border-background`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{friend.displayName}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {!fullView && friends.length > 3 && (
        <button className="w-full text-center text-sm text-accent hover:underline mt-3" data-testid="button-view-all-friends">
          View all {friends.length} friends
        </button>
      )}
    </motion.div>
  );
}
