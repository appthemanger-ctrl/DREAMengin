import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, RotateCw, Plus, Grid3X3, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniWallProps {
  fullView?: boolean;
}

export default function MiniWall({ fullView = false }: MiniWallProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { id: 1, type: 'image', url: '', title: 'Welcome to Mini Wall' },
    { id: 2, type: 'text', content: 'Add your photos, videos, and memories' },
    { id: 3, type: 'placeholder', title: 'Your content here' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass ${fullView ? 'p-6' : 'p-4'}`}
      data-testid="widget-mini-wall"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Mini Wall</h3>
            {!fullView && <p className="text-xs text-muted-foreground">Your visual space</p>}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="text-muted-foreground" data-testid="button-add-to-wall">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Wall Display */}
      <div className={`relative rounded-xl overflow-hidden bg-black/30 ${fullView ? 'aspect-video' : 'aspect-[16/9]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {slides[activeSlide].type === 'placeholder' ? (
              <div className="text-center p-6">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">{slides[activeSlide].title}</p>
              </div>
            ) : slides[activeSlide].type === 'text' ? (
              <p className="text-lg text-center px-6">{slides[activeSlide].content}</p>
            ) : (
              <div className="text-center">
                <p className="text-lg">{slides[activeSlide].title}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: '0%' }}
            animate={{ width: isPlaying ? '100%' : `${((activeSlide + 1) / slides.length) * 100}%` }}
            transition={isPlaying ? { duration: 5, ease: 'linear' } : { duration: 0.3 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setActiveSlide(prev => (prev - 1 + slides.length) % slides.length)}
          data-testid="button-prev-slide"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsPlaying(!isPlaying)}
          className={isPlaying ? 'text-primary' : ''}
          data-testid="button-play-wall"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setActiveSlide(prev => (prev + 1) % slides.length)}
          data-testid="button-next-slide"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {fullView && (
        <div className="mt-6 grid grid-cols-4 gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(index)}
              className={`aspect-square rounded-lg glass-card flex items-center justify-center transition-all ${
                activeSlide === index ? 'ring-2 ring-primary' : 'hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </button>
          ))}
          <button className="aspect-square rounded-lg glass-card flex items-center justify-center hover:bg-white/10 transition-all">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
