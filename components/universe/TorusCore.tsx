'use client';

import { useState, useEffect } from 'react';
import { Zap, Activity, Shield, Sparkles } from 'lucide-react';

interface TorusCoreProps {
  mode?: 'idle' | 'active' | 'processing' | 'alert';
  onModeChange?: (mode: string) => void;
  stats?: {
    energy?: number;
    connections?: number;
    status?: string;
  };
}

export default function TorusCore({ 
  mode = 'idle', 
  onModeChange,
  stats = { energy: 85, connections: 12, status: 'Online' }
}: TorusCoreProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    // Animate pulse based on mode
    const interval = setInterval(() => {
      if (currentMode === 'active') {
        setPulseIntensity(prev => prev === 1 ? 1.1 : 1);
      } else if (currentMode === 'processing') {
        setPulseIntensity(prev => prev === 1 ? 1.15 : 1);
      } else {
        setPulseIntensity(1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMode]);

  const getModeColors = () => {
    switch (currentMode) {
      case 'active':
        return {
          primary: 'from-emerald-400 to-cyan-500',
          glow: 'shadow-emerald-500/30',
          ring: 'ring-emerald-400/50',
          text: 'text-emerald-400'
        };
      case 'processing':
        return {
          primary: 'from-amber-400 to-orange-500',
          glow: 'shadow-amber-500/30',
          ring: 'ring-amber-400/50',
          text: 'text-amber-400'
        };
      case 'alert':
        return {
          primary: 'from-rose-400 to-red-500',
          glow: 'shadow-rose-500/30',
          ring: 'ring-rose-400/50',
          text: 'text-rose-400'
        };
      default:
        return {
          primary: 'from-blue-400 to-indigo-500',
          glow: 'shadow-blue-500/30',
          ring: 'ring-blue-400/50',
          text: 'text-blue-400'
        };
    }
  };

  const colors = getModeColors();

  return (
    <div className="relative flex flex-col items-center">
      {/* Torus Container */}
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        {/* Outer glow rings */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors.primary} opacity-10 blur-xl animate-pulse`}
          style={{ transform: `scale(${pulseIntensity * 1.3})` }}
        />
        <div 
          className={`absolute inset-4 rounded-full bg-gradient-to-r ${colors.primary} opacity-20 blur-lg`}
          style={{ transform: `scale(${pulseIntensity * 1.1})` }}
        />

        {/* Rotating orbital rings */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
          <div className={`absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current ${colors.text} to-transparent opacity-40`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
          <div className={`absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-current ${colors.text} to-transparent opacity-40`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-dashed ${colors.ring} rounded-full opacity-30`} />
        </div>

        {/* Core sphere */}
        <div 
          className={`absolute inset-8 rounded-full bg-gradient-to-br ${colors.primary} shadow-2xl ${colors.glow} flex items-center justify-center overflow-hidden`}
          style={{ transform: `scale(${pulseIntensity})` }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-white/10" />
          
          {/* Core icon */}
          <div className="relative z-10">
            {currentMode === 'processing' ? (
              <Activity className="w-12 h-12 text-white animate-pulse" />
            ) : currentMode === 'alert' ? (
              <Shield className="w-12 h-12 text-white" />
            ) : currentMode === 'active' ? (
              <Zap className="w-12 h-12 text-white" />
            ) : (
              <Sparkles className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Particle effects */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Orbiting nodes */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute inset-0 animate-spin"
            style={{ 
              animationDuration: `${8 + i * 4}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
            }}
          >
            <div
              className={`absolute w-3 h-3 rounded-full bg-gradient-to-br ${colors.primary} shadow-lg`}
              style={{
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        ))}
      </div>

      {/* Status display */}
      <div className="mt-6 text-center">
        <div className={`text-sm font-medium uppercase tracking-wider ${colors.text} mb-2`}>
          {currentMode === 'idle' ? 'System Ready' : 
           currentMode === 'active' ? 'Active' :
           currentMode === 'processing' ? 'Processing' : 'Alert'}
        </div>
        
        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.primary}`} />
            <span>{stats.energy}% Energy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{stats.connections} Nodes</span>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="mt-4 flex gap-2">
        {(['idle', 'active', 'processing'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setCurrentMode(m);
              onModeChange?.(m);
            }}
            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
              currentMode === m
                ? `bg-gradient-to-r ${colors.primary} text-white shadow-lg`
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
