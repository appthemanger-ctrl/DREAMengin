'use client';

/**
 * ForgeMomentumWidget — Client-side momentum score display for Side A.
 *
 * Reads Forge activity history from localStorage and renders a compact
 * creative momentum overview. Refreshes every 15 seconds.
 */

import { useState, useEffect } from 'react';
import { computeMomentum, getLevelColor, getLevelEmoji, type MomentumSnapshot } from '@/lib/forge/forgeMomentum';

export default function ForgeMomentumWidget() {
  const [snap, setSnap] = useState<MomentumSnapshot | null>(null);

  useEffect(() => {
    const refresh = () => setSnap(computeMomentum());
    refresh();
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!snap) return null;

  const color = getLevelColor(snap.level);
  const emoji = getLevelEmoji(snap.level);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      borderRadius: 14,
      background: `${color}06`,
      border: `1px solid ${color}20`,
    }}>
      {/* Mini score ring */}
      <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
        <svg viewBox="0 0 48 48" style={{ width: 48, height: 48, transform: 'rotate(-90deg)' }}>
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={2 * Math.PI * 20 * (1 - snap.composite / 100)}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color,
        }}>
          {snap.composite}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--de-heading)' }}>
          {emoji} {snap.level}
        </div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, marginTop: 2 }}>
          {snap.actionsToday} actions today · {snap.streakDays}d streak · {snap.enginesUsedToday.length} engine{snap.enginesUsedToday.length !== 1 ? 's' : ''} active
        </div>
        {/* Dimension bars */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {snap.dimensions.map(dim => (
            <div key={dim.name} style={{ flex: 1 }} title={`${dim.name}: ${dim.score}`}>
              <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
                <div style={{
                  width: `${dim.score}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: dim.accent,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
