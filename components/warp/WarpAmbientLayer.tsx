'use client';

import { useEffect, useMemo, useState } from 'react';
import { Waves, Orbit, Wind, Sparkles, Pause, Play, Sun, MoonStar, TimerReset } from 'lucide-react';
import { useWarp } from '@/lib/warp/useWarp';
import type { WarpEffect } from '@/lib/warp/warpEngine';
import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_PRESETS } from '@/lib/ui/theme-engine';

const EFFECT_OPTIONS: { id: WarpEffect; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'flow',       label: 'Flow',      icon: Wind },
  { id: 'orbit',      label: 'Orbit',     icon: Orbit },
  { id: 'field',      label: 'Field',     icon: Sparkles },
  { id: 'particles',  label: 'Particles', icon: Waves },
];

export default function WarpAmbientLayer() {
  const [effect, setEffectState] = useState<WarpEffect>('flow');
  const { canvasRef, isRunning, toggle, setEffect } = useWarp({
    effect: 'flow',
    maxParticles: 240,
    spawnRate: 32,
    autoStart: true,
  });

  useEffect(() => { setEffect(effect); }, [effect, setEffect]);

  // Live clock (minute granularity to avoid re-render spam)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = useMemo(() => new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(now), [now]);

  // Theme cycling
  const { presetId, setPreset } = useTheme();
  const currentThemeIdx = THEME_PRESETS.findIndex(p => p.id === presetId);
  const nextTheme = THEME_PRESETS[(currentThemeIdx + 1) % THEME_PRESETS.length];
  const themeIcon = presetId.includes('dark') || presetId.includes('midnight') ? MoonStar : Sun;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.38,
          mixBlendMode: 'screen',
        }}
      />

      <aside className="warp-dock" aria-label="Ambient controls">
        <div className="warp-dock__top">
          <div className="warp-dock__meta">
            <TimerReset className="warp-dock__icon" />
            <span className="warp-dock__time">{timeLabel}</span>
          </div>
          <button
            type="button"
            className="warp-dock__theme"
            onClick={() => setPreset(nextTheme.id)}
            aria-label={`Switch to ${nextTheme.label} theme`}
          >
            {themeIcon === Sun ? <Sun className="warp-dock__icon" /> : <MoonStar className="warp-dock__icon" />}
            <span>{nextTheme.label}</span>
          </button>
        </div>

        <div className="warp-dock__grid" role="group" aria-label="Warp effects">
          {EFFECT_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = id === effect;
            return (
              <button
                key={id}
                type="button"
                className={`warp-pill${active ? ' active' : ''}`}
                onClick={() => setEffectState(id)}
                aria-pressed={active}
              >
                <Icon className="warp-pill__icon" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="warp-dock__play"
          onClick={toggle}
          aria-pressed={isRunning}
        >
          {isRunning ? <Pause className="warp-dock__icon" /> : <Play className="warp-dock__icon" />}
          <span>{isRunning ? 'Pause warp' : 'Play warp'}</span>
        </button>
      </aside>
    </>
  );
}
