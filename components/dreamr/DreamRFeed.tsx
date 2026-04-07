'use client';
import React, { useState, useMemo, useRef } from 'react';
import { enginBridge } from '@/lib/runtime/dualRuntimeBridge';

export default function DreamRFeed() {
  const [stats, setStats] = useState({
    views: 12405,      // Information Current
    reDreams: 892,     // Momentum Multiplier
    insights: 45,      // Throttling Depth
    shares: 128        // Filament Spread
  });

  // --- THE TORRIDITY ALGORITHM (Locked n=2.1) ---
  const torridity = useMemo(() => {
    const a0 = 3702.8; // SPARC unit conversion
    const gN = (stats.views * 0.1) + (stats.reDreams * 2.5); 
    const x = gN / a0;
    // μT(x) = x / (1 + x^2.1)^(1/2.1)
    const muT = x / Math.pow((1 + Math.pow(x, 2.1)), (1 / 2.1));
    const weight = Math.floor(gN * muT);
    const beta = (0.5 + (stats.insights / 1000)).toFixed(3);
    return { weight, beta };
  }, [stats]);

  // --- STICKY DRAG PHYSICS ---
  const [dragOffset, setDragOffset] = useState(0);
  const touchStart = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart.current;
    // Only allow left-swipe drag (negative X)
    if (diff < 0) setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    // If swiped far enough (70px), trigger the transfer, else snap back
    if (dragOffset < -70) {
      enginBridge.emitToChannel('LEDGER', { 
        action: 'CONSERVE_Jμ', 
        n: 2.1, 
        weight: torridity.weight 
      });
      console.log("Information Current Transferred.");
    }
    setDragOffset(0); // Snap back to center
    touchStart.current = null;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 select-none">
      <div className="relative p-[1px] rounded-[40px] bg-gradient-to-b from-white/20 via-transparent to-[#FFD700]/10 shadow-2xl">
        
        {/* The Glass Container */}
        <div className="relative bg-[#02050A]/90 backdrop-blur-3xl rounded-[39px] p-8 border border-white/5 overflow-hidden">
          
          {/* Header: Torridity & Views */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-[#FFD700] font-black text-2xl tracking-[0.3em] italic uppercase">DreamR</h2>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#FFD700] font-bold tracking-widest uppercase">
                  Weight: {torridity.weight.toLocaleString()}
                </span>
                <span className="text-[8px] text-[#E0F7FA]/40 font-mono italic">β: {torridity.beta}</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="block text-[#E0F7FA] font-mono text-2xl tracking-tighter leading-none glow-sm">
                {stats.views.toLocaleString()}
              </span>
              <span className="text-[9px] text-[#E0F7FA]/30 uppercase tracking-[0.4em] font-black">Views</span>
            </div>
          </div>

          {/* Viewport: Sticky Drag Area */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              transform: `translateX(${dragOffset}px)`,
              transition: dragOffset === 0 ? 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)' : 'none'
            }}
            className="relative aspect-[3/4] rounded-3xl mb-8 border border-white/10 bg-black overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,1)] group"
          >
            {/* Kinematic Status HUD */}
            <div className="absolute top-5 left-5 z-20 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-xl rounded-full border border-[#FFD700]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                <span className="text-[8px] text-[#FFD700] font-bold font-mono tracking-tighter">∇μ Jμ = 0</span>
              </div>
            </div>

            {/* Discrete Swipe Visual */}
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
              <div className="rotate-90 flex items-center gap-4">
                <div className="w-12 h-[1px] bg-[#FFD700]/40" />
                <span className="text-[9px] text-[#FFD700] tracking-[1em] font-bold uppercase italic">Swipe</span>
              </div>
            </div>
            
            {/* Ambient Blue Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)] pointer-events-none" />
          </div>

          {/* Action Bar: Insights, Re-Dream, Share */}
          <div className="grid grid-cols-3 gap-6 items-center">
            <button onClick={() => setStats(s => ({...s, insights: s.insights + 1}))} className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-[#E0F7FA]/30 uppercase tracking-widest">Insight</span>
              <span className="text-[12px] font-mono text-[#E0F7FA]/10">{stats.insights}</span>
            </button>

            <button 
              onClick={() => setStats(s => ({...s, reDreams: s.reDreams + 1}))}
              className="relative py-4 px-2 rounded-2xl bg-gradient-to-b from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 flex flex-col items-center transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] active:scale-95"
            >
              <span className="text-[12px] text-[#FFD700] font-black tracking-[0.2em] uppercase">RE-DREAM</span>
              <span className="text-[10px] text-[#FFD700]/50 font-mono mt-1 leading-none">{torridity.weight}</span>
            </button>

            <button onClick={() => setStats(s => ({...s, shares: s.shares + 1}))} className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-[#E0F7FA]/30 uppercase tracking-widest">Share</span>
              <span className="text-[12px] font-mono text-[#E0F7FA]/10">{stats.shares}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
