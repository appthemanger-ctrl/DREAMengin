import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ExternalLink, Star, Users, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GamesWidgetProps {
  fullView?: boolean;
}

interface Game {
  id: string;
  name: string;
  platform: string;
  image?: string;
  players?: number;
  rating?: number;
  lastPlayed?: string;
}

export default function GamesWidget({ fullView = false }: GamesWidgetProps) {
  const [games] = useState<Game[]>([
    { id: '1', name: 'Adopt Me!', platform: 'Roblox', players: 543000, rating: 4.8 },
    { id: '2', name: 'Blox Fruits', platform: 'Roblox', players: 289000, rating: 4.5 },
    { id: '3', name: 'Murder Mystery 2', platform: 'Roblox', players: 156000, rating: 4.3 },
    { id: '4', name: 'Brookhaven', platform: 'Roblox', players: 421000, rating: 4.7 },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass ${fullView ? 'p-6' : 'p-4'}`}
      data-testid="widget-games"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">Games</h3>
            {!fullView && <p className="text-xs text-muted-foreground">Your gaming hub</p>}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="text-muted-foreground" data-testid="button-add-game">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Roblox Connection Status */}
      <div className="glass-card p-3 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Gamepad2 className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Roblox</p>
          <p className="text-xs text-muted-foreground">Connect to show your games</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs" data-testid="button-connect-roblox">
          Connect
        </Button>
      </div>

      {/* Games List */}
      <div className={`space-y-3 ${fullView ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
        {games.slice(0, fullView ? 8 : 3).map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-3 flex items-center gap-3 group cursor-pointer hover:bg-white/10 transition-all"
            data-testid={`game-card-${game.id}`}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white/80" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{game.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {(game.players || 0).toLocaleString()}
                </span>
                {game.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {game.rating}
                  </span>
                )}
              </div>
            </div>
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>

      {fullView && (
        <div className="mt-6 glass-card p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Total Play Time</p>
          <p className="text-2xl font-bold gradient-text">247 hours</p>
        </div>
      )}
    </motion.div>
  );
}
