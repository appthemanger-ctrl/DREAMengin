'use client';

/**
 * ForgeActivityWidget — Cross-engine activity pulse for the HomeDream surface.
 *
 * Reads Forge activity pulses from localStorage (via forgeRegistry) and
 * renders a compact live heat strip showing which engines were recently active.
 * Links to the Forge Daydream surface for the full status matrix.
 *
 * Architecture: docs/ARCHITECTURE.md §1 — cross-engine linkage via Forge layer.
 * No Supabase reads — purely local telemetry display.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';
import {
  CREATIVE_ENGINES,
  readForgeActivity,
  formatRelativeTime,
  type ForgeActivityPulse,
} from '@/lib/forge/forgeRegistry';

export default function ForgeActivityWidget() {
  const [pulses, setPulses] = useState<ForgeActivityPulse[]>([]);

  useEffect(() => {
    // Read on mount and poll every 15s for updates
    const read = () => setPulses(readForgeActivity());
    read();
    const interval = setInterval(read, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Build a map of enginId → pulse for quick lookup
  const pulseMap = new Map(pulses.map(p => [p.enginId, p]));
  const hasAnyActivity = pulses.some(p => p.heat > 0);

  return (
    <div
      className="de-surface"
      style={{
        padding: '14px 16px',
        marginBottom: 14,
        borderRadius: 18,
        background: 'rgba(255,255,255,0.76)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(239,68,68,0.14)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(239,68,68,0.25)',
            }}
          >
            <Flame style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              Engine Pulse
            </div>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
              {hasAnyActivity ? 'Cross-engine activity' : 'No recent activity'}
            </div>
          </div>
        </div>
        <Link
          href="/daydream/forge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 600,
            color: '#ef4444',
            textDecoration: 'none',
          }}
        >
          Forge <ChevronRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>

      {/* Engine heat bars */}
      <div style={{ display: 'grid', gap: 6 }}>
        {CREATIVE_ENGINES.map(engine => {
          const pulse = pulseMap.get(engine.id);
          const heat = pulse?.heat ?? 0;
          const isActive = heat > 0;

          return (
            <Link
              key={engine.id}
              href={engine.daydreamHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 12,
                textDecoration: 'none',
                background: isActive
                  ? `rgba(255,255,255,0.6)`
                  : 'rgba(255,255,255,0.35)',
                border: `1px solid ${isActive ? `${engine.accent}30` : 'rgba(180,185,200,0.12)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{engine.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {engine.name}
                  </span>
                  {isActive && pulse && (
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0 }}>
                      {formatRelativeTime(pulse.lastActive)}
                    </span>
                  )}
                </div>
                {/* Heat bar */}
                <div
                  style={{
                    marginTop: 4,
                    height: 3,
                    borderRadius: 2,
                    background: 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      width: `${Math.max(heat * 100, isActive ? 5 : 0)}%`,
                      background: `linear-gradient(90deg, ${engine.accent}, ${engine.accent}88)`,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
