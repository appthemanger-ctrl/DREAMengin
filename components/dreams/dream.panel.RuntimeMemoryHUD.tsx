'use client';

/**
 * components/dreams/dream.panel.RuntimeMemoryHUD.tsx
 *
 * RUNTIME MEMORY HUD — Dream Continuity Spine (2026)
 *
 * Subscribes to dreamOSBus and renders two panels:
 *   1. Active Contexts — which subsystems are currently running
 *      (derived from runtimeContexts published by Engins)
 *   2. Artifact Trail — the last N cross-Engin outputs
 *      (bridge events, code runs, lab results, assets, drafts …)
 *
 * Visual treatment: Midnight Glass — matches existing DreamSpace style.
 * No network calls, no Supabase reads — 100% client-local bus data.
 *
 * Architecture: component/ layer per GENERATION_LAW §3.1.
 *   All logic is in lib/intelligence/continuityHelpers.ts (pure).
 *   dreamOSBus subscription follows the same pattern as ActiveModuleSurface.
 */

import React, { useEffect, useState } from 'react';
import { dreamOSBus, type DreamOSSnapshot } from '@/lib/runtime/dreamOSBus';
import { formatArtifactKind, getArtifactAccent } from '@/lib/intelligence/continuityHelpers';

// -- Layout constants ----------------------------------------------------------

const MAX_ARTIFACTS = 5;

// -- Helpers -------------------------------------------------------------------

function relativeTime(ms: number: string) {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

// -- Component -----------------------------------------------------------------

export default function RuntimeMemoryHUD() {
  const [snapshot, setSnapshot] = useState<DreamOSSnapshot>({
    artifacts: [],
    runtimeContexts: [],
  });

  // Subscribe to the bus — re-render whenever anything changes.
  useEffect(() => {
    const unsub = dreamOSBus.subscribe(next: Record<string, unknown> => setSnapshot(next));
    return unsub;
  }, []);

  const { artifacts, runtimeContexts } = snapshot;

  const activeContexts = runtimeContexts.filter(
    (ctx) => ctx.world !== 'HomeDream Surface' && ctx.world !== 'DreamSpace',
  );

  const trail = artifacts.slice(0, MAX_ARTIFACTS);

  // Nothing to show yet — render nothing (the section just won't appear until
  // the user opens an Engin and events start flowing).
  if (activeContexts.length === 0 && trail.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 22,
        border: '1px solid rgba(160,195,240,0.15)',
        background: 'rgba(8,16,38,0.52)',
        padding: '14px 14px 12px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(32px) saturate(160%)',
        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--de-text-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Runtime Activity
      </div>

      {/* Active contexts row */}
      {activeContexts.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: trail.length > 0 ? 12 : 0,
          }}
        >
          {activeContexts.map((ctx: Record<string, unknown>) => (
            <span
              key={ctx.region}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 9999,
                background: 'rgba(42,138,184,0.14)',
                border: '1px solid rgba(42,138,184,0.28)',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(125,211,252,0.92)',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Alive indicator */}
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22d3ee',
                  boxShadow: '0 0 6px #22d3ee',
                  flexShrink: 0,
                }}
              />
              {ctx.subsystemId}
            </span>
          ))}
        </div>
      )}

      {/* Artifact trail */}
      {trail.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {trail.map((artifact: Record<string, unknown>) => {
            const accent = getArtifactAccent(artifact.kind);
            const badge  = formatArtifactKind(artifact.kind);
            const ago    = relativeTime(artifact.updatedAt);
            return (
              <div
                key={artifact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 9px',
                  borderRadius: 11,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${accent}22`,
                }}
              >
                {/* Kind badge */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    color: accent,
                    background: `${accent}18`,
                    border: `1px solid ${accent}30`,
                    padding: '2px 5px',
                    borderRadius: 4,
                    flexShrink: 0,
                    minWidth: 34,
                    textAlign: 'center',
                  }}
                >
                  {badge}
                </span>

                {/* Title */}
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 11,
                    color: 'var(--de-heading)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {artifact.title}
                </span>

                {/* Source */}
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--de-text-dim)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {artifact.sourceSubsystem}
                </span>

                {/* Age */}
                <span
                  style={{
                    fontSize: 10,
                    color: '#d4a843',
                    fontWeight: 700,
                    flexShrink: 0,
                    minWidth: 18,
                    textAlign: 'right',
                  }}
                >
                  {ago}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
