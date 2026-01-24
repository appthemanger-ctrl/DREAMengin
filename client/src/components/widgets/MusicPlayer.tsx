import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Heart, Shuffle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MusicPlayerProps {
  fullView?: boolean;
}

export default function MusicPlayer({ fullView = false }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(75);
  const [liked, setLiked] = useState(false);

  const currentTrack = {
    title: 'Dream Waves',
    artist: 'Ambient Sounds',
    album: 'Chill Vibes',
    duration: '3:45',
    currentTime: '1:18',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass ${fullView ? 'p-6' : 'p-4'}`}
      data-testid="widget-music-player"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Music className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Music Player</h3>
          {!fullView && <p className="text-xs text-muted-foreground">Stream your favorites</p>}
        </div>
      </div>

      {/* Album Art */}
      <div className={`relative ${fullView ? 'mb-6' : 'mb-4'}`}>
        <div className={`${fullView ? 'aspect-square max-w-xs mx-auto' : 'aspect-[3/1]'} rounded-xl overflow-hidden`}>
          <motion.div
            className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-purple-500/30 flex items-center justify-center"
            animate={{
              backgroundPosition: isPlaying ? ['0% 0%', '100% 100%'] : '0% 0%',
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center"
            >
              <Music className="w-8 h-8 text-white/80" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center mb-4">
        <h4 className="font-semibold text-lg">{currentTrack.title}</h4>
        <p className="text-muted-foreground text-sm">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[progress]}
          onValueChange={(value) => setProgress(value[0])}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{currentTrack.currentTime}</span>
          <span>{currentTrack.duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {fullView && (
          <Button size="icon" variant="ghost" className="text-muted-foreground">
            <Shuffle className="w-4 h-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" data-testid="button-prev-track">
          <SkipBack className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          className={`${isPlaying ? 'bg-accent' : 'bg-primary'} hover:opacity-90 w-12 h-12`}
          onClick={() => setIsPlaying(!isPlaying)}
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </Button>
        <Button size="icon" variant="ghost" data-testid="button-next-track">
          <SkipForward className="w-5 h-5" />
        </Button>
        {fullView && (
          <Button size="icon" variant="ghost" className="text-muted-foreground">
            <Repeat className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Volume & Like */}
      {fullView && (
        <div className="flex items-center gap-4 mt-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLiked(!liked)}
            className={liked ? 'text-red-500' : 'text-muted-foreground'}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
