'use client';

/**
 * JourneyTrail — dot-map visualization of the user's creative course through DREAMengin.
 *
 * "Every thing becomes data and those data points track your course.
 *  They are the very dots that connect looking backwards."
 *
 * Design principles:
 *   - Always newest-first ("looking backwards" canonical direction).
 *   - Time-grouped: Today / This Week / This Month / Earlier.
 *   - Dot size maps to significance (0.0–1.0).
 *   - Domain-color-coded by surface.
 *   - Insight badges: ✦ First time · 🔁 N times this week · ↩ Return after N days.
 *   - Tap/click a dot to expand the timestamp and surface context.
 *   - Empty state explains honestly what the feature does.
 *   - Privacy: all data fetched from /api/journey (owner-only, RLS-enforced).
 *
 * Props:
 *   limit   — max dots to display (default 50).
 *   compact — smaller layout for Dream Window mounting (default false).
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JourneyDot, JourneyTimeGroup } from '@/types/journey';
import {
  annotateDotsWithInsights,
  computeCurrentStreak,
  type AnnotatedDot,
} from '@/lib/journey/journeyInsights';

interface Props {
  limit?: number;
  compact?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupDotsByTime(dots: JourneyDot[]): JourneyTimeGroup[] {
  const now = Date.now();
  const DAY = 86_400_000;

  const groups: JourneyTimeGroup[] = [
    { label: 'Today',       dots: [] },
    { label: 'This Week',   dots: [] },
    { label: 'This Month',  dots: [] },
    { label: 'Earlier',     dots: [] },
  ];

  for (const dot of dots) {
    const age = now - new Date(dot.created_at).getTime();
    if (age < DAY)            groups[0].dots.push(dot);
    else if (age < 7 * DAY)   groups[1].dots.push(dot);
    else if (age < 30 * DAY)  groups[2].dots.push(dot);
    else                      groups[3].dots.push(dot);
  }

  return groups.filter(g => g.dots.length > 0);
}

/** Map significance (0–1) to dot radius in px. */
function dotRadius(significance: number): number {
  if (significance >= 0.9) return 8;
  if (significance >= 0.6) return 6;
  return 4;
}

// ── Sparkline helpers ─────────────────────────────────────────────────────────

/** Compute last-7-day activity bucket counts from a dots array (index 0 = oldest, 6 = today). */
function computeSparkline(dots: JourneyDot[]): number[] {
  const now = Date.now();
  const DAY = 86_400_000;
  const buckets = Array<number>(7).fill(0);
  for (const dot of dots) {
    const dayIdx = Math.floor((now - new Date(dot.created_at).getTime()) / DAY);
    if (dayIdx >= 0 && dayIdx < 7) buckets[6 - dayIdx]++;
  }
  return buckets;
}

/** Mini 7-day sparkline bar chart shown beneath the streak banner. */
function SparklineBar({ dots }: { dots: JourneyDot[] }) {
  const data = computeSparkline(dots);
  const max  = Math.max(...data, 1);
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, marginTop: 8 }}
    >
      {data.map((val, i) => (
        <div
          key={i}
          title={`${val} action${val !== 1 ? 's' : ''} · ${6 - i === 0 ? 'today' : `${6 - i}d ago`}`}
          style={{
            flex:         1,
            height:       Math.max(2, (val / max) * 18),
            borderRadius: 2,
            background:   val > 0
              ? i === 6
                ? 'rgba(200,152,26,0.92)'
                : `rgba(200,152,26,${0.28 + (val / max) * 0.52})`
              : 'rgba(200,152,26,0.08)',
            transition: 'height 0.35s ease',
          }}
        />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JourneyTrail({ limit = 50, compact = false }: Props) {
  const [dots,          setDots]          = useState<JourneyDot[]>([]);
  const [annotated,     setAnnotated]     = useState<AnnotatedDot[]>([]);
  const [streak,        setStreak]        = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/journey?limit=${limit}`);
      if (res.ok) {
        const json = await res.json() as { dots?: JourneyDot[] };
        const raw  = json.dots ?? [];
        setDots(raw);
        setAnnotated(annotateDotsWithInsights(raw));
        setStreak(computeCurrentStreak(raw));
      }
    } catch {
      // Best-effort — if offline or unauthenticated, show empty state gracefully.
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void load(); }, [load]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>
        Loading your journey…
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (dots.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8, color: '#c8981a' }}>✦</div>
        <div style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
          Your journey begins the moment you act.<br />
          Every action in DREAMengin becomes a dot in your story —<br />
          visible only to you.
        </div>
      </div>
    );
  }

  const groups = groupDotsByTime(annotated);
  const annotatedById = new Map(annotated.map(d => [d.id, d]));
  const threadLeft = compact ? 10 : 14;
  const paddingLeft = compact ? 24 : 32;

  // ── Trail ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', paddingLeft }}>
      {/* Vertical thread — gradient from gold at top to dim at bottom */}
      <div style={{
        position: 'absolute',
        left:     threadLeft,
        top:      0,
        bottom:   0,
        width:    1,
        background: 'linear-gradient(to bottom, rgba(200,152,26,0.65) 0%, rgba(200,152,26,0.28) 35%, rgba(200,152,26,0.06) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Streak banner (shown when streak ≥ 2) ── */}
      {streak >= 2 && (
        <div style={{
          marginBottom: 16,
          padding:      '10px 12px',
          borderRadius: 10,
          background:   'rgba(200, 152, 26, 0.10)',
          border:       '1px solid rgba(200, 152, 26, 0.28)',
          boxShadow:    '0 2px 12px rgba(200,152,26,0.08)',
        }}>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            fontSize:   12,
            color:      '#c8981a',
            fontWeight: 600,
          }}>
            <span>🔥</span>
            <span>{streak}-day streak — you've been creating every day.</span>
          </div>
          <SparklineBar dots={dots} />
        </div>
      )}

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          {/* Time group label */}
          <div style={{
            fontSize:        10,
            fontWeight:      700,
            letterSpacing:   '0.08em',
            textTransform:   'uppercase',
            color:           'var(--de-text-dim)',
            marginBottom:    12,
            paddingLeft:     compact ? 0 : 8,
          }}>
            {group.label}
          </div>

          {group.dots.map(dot => {
            const annotatedDot = annotatedById.get(dot.id);
            const insight      = annotatedDot?.insight ?? {};
            const r            = dotRadius(dot.significance);
            const isExpanded   = expanded === dot.id;
            const dotLeft      = -(compact ? 14 : 18);

            return (
              <button
                key={dot.id}
                onClick={() => setExpanded(isExpanded ? null : dot.id)}
                style={{
                  display:    'flex',
                  alignItems: 'flex-start',
                  gap:        12,
                  width:      '100%',
                  background: 'none',
                  border:     'none',
                  padding:    '6px 0',
                  cursor:     'pointer',
                  textAlign:  'left',
                  position:   'relative',
                }}
                aria-expanded={isExpanded}
                aria-label={dot.label}
              >
                {/* Pulsing glow ring for high-significance dots */}
                {dot.significance >= 0.9 && (
                  <motion.div
                    aria-hidden="true"
                    style={{
                      position:      'absolute',
                      left:          dotLeft,
                      top:           '50%',
                      width:         r * 2,
                      height:        r * 2,
                      borderRadius:  '50%',
                      pointerEvents: 'none',
                      y:             '-50%',
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 4px 1px ${dot.domain_color}40`,
                        `0 0 18px 7px ${dot.domain_color}85`,
                        `0 0 4px 1px ${dot.domain_color}40`,
                      ],
                      scale: [1, 1.55, 1],
                    }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Dot */}
                <div style={{
                  position:     'absolute',
                  left:         dotLeft,
                  top:          '50%',
                  transform:    isExpanded
                    ? 'translateY(-50%) scale(1.35)'
                    : 'translateY(-50%) scale(1)',
                  width:        r * 2,
                  height:       r * 2,
                  borderRadius: '50%',
                  background:   dot.domain_color,
                  boxShadow:    dot.significance >= 0.9
                    ? `0 0 8px ${dot.domain_color}60`
                    : 'none',
                  flexShrink:   0,
                  transition:   'transform 0.15s ease',
                }} />

                {/* Label + insights + expanded detail */}
                <div style={{ paddingLeft: 4, flex: 1 }}>
                  <div style={{
                    fontSize:   compact ? 12 : 13,
                    color:      'var(--de-text)',
                    lineHeight: 1.4,
                    fontWeight: dot.significance >= 0.9 ? 600 : 400,
                  }}>
                    {dot.label}
                  </div>

                  {/* ── Insight badges ── */}
                  {(insight.isFirst || insight.weeklyFrequency || insight.returnAfterDays) && (
                    <div style={{
                      display:   'flex',
                      flexWrap:  'wrap',
                      gap:       4,
                      marginTop: 3,
                    }}>
                      {insight.isFirst && (
                        <span style={{
                          fontSize:     10,
                          fontWeight:   700,
                          padding:      '1px 6px',
                          borderRadius: 4,
                          background:   `${dot.domain_color}22`,
                          color:        dot.domain_color,
                          border:       `1px solid ${dot.domain_color}44`,
                          letterSpacing: '0.03em',
                        }}>
                          ✦ First time
                        </span>
                      )}
                      {insight.weeklyFrequency && (
                        <span style={{
                          fontSize:     10,
                          fontWeight:   600,
                          padding:      '1px 6px',
                          borderRadius: 4,
                          background:   'rgba(100,116,139,0.1)',
                          color:        'var(--de-text-dim)',
                          border:       '1px solid rgba(100,116,139,0.2)',
                        }}>
                          🔁 {insight.weeklyFrequency}× this week
                        </span>
                      )}
                      {insight.returnAfterDays && (
                        <span style={{
                          fontSize:     10,
                          fontWeight:   600,
                          padding:      '1px 6px',
                          borderRadius: 4,
                          background:   'rgba(200,152,26,0.08)',
                          color:        '#c8981a',
                          border:       '1px solid rgba(200,152,26,0.2)',
                        }}>
                          ↩ Return after {insight.returnAfterDays}d
                        </span>
                      )}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="expanded-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          fontSize:      11,
                          color:         'var(--de-text-dim)',
                          marginTop:     4,
                          lineHeight:    1.5,
                          paddingBottom: 2,
                        }}>
                          {new Date(dot.created_at).toLocaleDateString('en-US', {
                            month:  'short',
                            day:    'numeric',
                            year:   'numeric',
                            hour:   '2-digit',
                            minute: '2-digit',
                          })}
                          {dot.surface && ` · ${dot.surface}`}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

