'use client';

/**
 * CompingPanel — Pro Tools-style comping / takes manager.
 *
 * Features:
 *  - Multiple audio take lanes with waveform display
 *  - Star ratings per take (0–3 stars)
 *  - Active / inactive toggle to include take in comp
 *  - Comp region bar showing which take provides each segment
 *  - Add new demo take / remove selected take
 *  - "Auto Comp" button that picks the highest-rated active takes
 */

import { type CSSProperties, useState, useCallback } from 'react';
import { Mic2, Star, Plus, Trash2, Wand2 } from 'lucide-react';
import {
  type AudioTake,
  type CompingState,
  type TakeRating,
  TAKE_COLORS,
  createDemoTake,
} from '@/lib/music/starmakerDaw';

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:          '#0d0f17',
  surface:     '#141720',
  surfaceHi:   '#1c2030',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.14)',
  text:        '#e2e5ee',
  dim:         '#6e7585',
  accent:      '#00d0f0',
  green:       '#22c55e',
  purple:      '#a855f7',
  red:         '#ef4444',
  orange:      '#f97316',
  yellow:      '#facc15',
} as const;

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#111420',
  borderBottom: `1px solid ${T.border}`,
};

const WAVEFORM_BARS = 60;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompingPanelProps {
  state: CompingState;
  onStateChange: (next: CompingState) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTimestamp(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function StarRating({
  rating,
  onChange,
}: { rating: TakeRating; onChange: (r: TakeRating) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {([1, 2, 3] as TakeRating[]).map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(rating === star ? 0 : star)}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: star <= rating ? T.yellow : T.border,
            padding: 0, fontSize: 12, lineHeight: 1,
          }}>
          <Star className="w-3 h-3" fill={star <= rating ? T.yellow : 'none'} stroke={star <= rating ? T.yellow : T.dim} />
        </button>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompingPanel({ state, onStateChange }: CompingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);

  const { takes, compRegions, totalDurationSec } = state;
  const activeTakes = takes.filter(t => t.active);
  const bestRated = takes.reduce<AudioTake | null>(
    (best, t) => (!best || t.rating > best.rating ? t : best),
    null,
  );

  const updateTake = useCallback((id: string, patch: Partial<AudioTake>) => {
    onStateChange({
      ...state,
      takes: takes.map(t => t.id === id ? { ...t, ...patch } : t),
    });
  }, [state, takes, onStateChange]);

  function handleAddTake() {
    const newTake = createDemoTake(takes.length, totalDurationSec);
    newTake.color = TAKE_COLORS[takes.length % TAKE_COLORS.length];
    onStateChange({ ...state, takes: [...takes, newTake] });
  }

  function handleRemoveTake(id: string) {
    onStateChange({
      ...state,
      takes: takes.filter(t => t.id !== id),
      compRegions: compRegions.filter(r => r.takeId !== id),
    });
    if (selectedTakeId === id) setSelectedTakeId(null);
  }

  function handleAutoComp() {
    // Mark highest-rated take(s) as active, others inactive
    const maxRating = Math.max(...takes.map(t => t.rating));
    onStateChange({
      ...state,
      takes: takes.map(t => ({
        ...t,
        active: maxRating > 0 ? t.rating === maxRating : t.id === takes[0]?.id,
      })),
    });
  }

  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      {/* Header */}
      <div style={sectionHeaderStyle}>
        <Mic2 className="w-3 h-3" style={{ color: T.accent }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim }}>
          Comping — Takes Manager
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
          background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}30`,
        }}>
          {takes.length} take{takes.length !== 1 ? 's' : ''} · {activeTakes.length} active
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          style={{
            marginLeft: 'auto',
            padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
            background: isOpen ? `${T.accent}18` : `rgba(255,255,255,0.04)`,
            border: `1px solid ${isOpen ? `${T.accent}40` : T.border}`,
            color: isOpen ? T.accent : T.dim, fontSize: 11, fontWeight: 700,
          }}>
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      {isOpen && (
        <div style={{ padding: '12px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleAddTake}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                background: `${T.green}15`, border: `1px solid ${T.green}35`,
                color: T.green, fontSize: 11, fontWeight: 700,
              }}>
              <Plus className="w-3 h-3" /> Add Take
            </button>

            <button
              type="button"
              onClick={handleAutoComp}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                background: `${T.purple}15`, border: `1px solid ${T.purple}35`,
                color: T.purple, fontSize: 11, fontWeight: 700,
              }}>
              <Wand2 className="w-3 h-3" /> Auto Comp
            </button>

            {selectedTakeId && (
              <button
                type="button"
                onClick={() => handleRemoveTake(selectedTakeId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                  background: `${T.red}15`, border: `1px solid ${T.red}35`,
                  color: T.red, fontSize: 11, fontWeight: 700,
                }}>
                <Trash2 className="w-3 h-3" /> Remove Selected
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: 10, color: T.dim, display: 'flex', alignItems: 'center' }}>
              {bestRated && bestRated.rating > 0
                ? `Best: ${bestRated.name} (${bestRated.rating}★)`
                : 'Rate takes to enable Auto Comp'}
            </div>
          </div>

          {/* Take lanes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {takes.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '24px', color: T.dim, fontSize: 11,
                border: `1px dashed ${T.border}`, borderRadius: 8,
              }}>
                No takes yet — click <strong style={{ color: T.green }}>Add Take</strong> to begin recording sessions
              </div>
            )}

            {takes.map(take => {
              const isSelected = selectedTakeId === take.id;

              return (
                <div
                  key={take.id}
                  onClick={() => setSelectedTakeId(isSelected ? null : take.id)}
                  style={{
                    display: 'flex', alignItems: 'stretch', gap: 0,
                    border: `1px solid ${isSelected ? `${take.color}60` : T.border}`,
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    background: isSelected ? `${take.color}08` : T.surfaceHi,
                    transition: 'all 0.12s',
                  }}>
                  {/* Left color stripe */}
                  <div style={{ width: 4, flexShrink: 0, background: take.active ? take.color : `${take.color}40` }} />

                  {/* Take header */}
                  <div style={{
                    width: 140, flexShrink: 0, padding: '6px 8px',
                    borderRight: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); updateTake(take.id, { active: !take.active }); }}
                        title={take.active ? 'Remove from comp' : 'Include in comp'}
                        style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          border: `1px solid ${take.active ? take.color : T.border}`,
                          background: take.active ? `${take.color}30` : 'transparent',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {take.active && (
                          <span style={{ fontSize: 9, color: take.color, fontWeight: 800 }}>✓</span>
                        )}
                      </button>

                      <span style={{ fontSize: 11, fontWeight: 700, color: take.active ? T.text : T.dim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {take.name}
                      </span>
                    </div>

                    <StarRating
                      rating={take.rating}
                      onChange={r => updateTake(take.id, { rating: r })}
                    />

                    <span style={{ fontSize: 9, color: T.dim }}>{fmtTimestamp(take.recordedAt)}</span>
                  </div>

                  {/* Waveform */}
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    gap: 1, padding: '6px 8px', background: take.active ? `${take.color}06` : 'transparent',
                  }}>
                    {take.waveform.slice(0, WAVEFORM_BARS).map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, borderRadius: 1,
                          background: take.active
                            ? `${take.color}${Math.round(0.4 + h * 0.6).toString(16).padStart(2, '0')}`
                            : `${take.color}30`,
                          height: `${Math.round(Math.max(6, h * 90))}%`,
                          transition: 'height 0.1s',
                          minHeight: 3,
                        }}
                      />
                    ))}
                  </div>

                  {/* Duration badge */}
                  <div style={{
                    padding: '0 10px', display: 'flex', alignItems: 'center',
                    borderLeft: `1px solid ${T.border}`,
                  }}>
                    <span style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace' }}>
                      {take.durationSec.toFixed(1)}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comp summary */}
          {activeTakes.length > 0 && (
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 8,
              background: '#0f1118', border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: '0.08em', marginBottom: 8 }}>
                ACTIVE COMP — {activeTakes.length} take{activeTakes.length > 1 ? 's' : ''} contributing
              </div>
              <div style={{ display: 'flex', gap: 4, height: 12, borderRadius: 4, overflow: 'hidden' }}>
                {activeTakes.map((take, i) => (
                  <div
                    key={take.id}
                    title={take.name}
                    style={{
                      flex: 1, background: take.color,
                      opacity: 0.7 + take.rating * 0.1,
                      borderRadius: i === 0 ? '4px 0 0 4px' : i === activeTakes.length - 1 ? '0 4px 4px 0' : 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: 4, fontSize: 9, color: T.dim }}>
                {activeTakes.map(t => t.name).join(' + ')}
              </div>
            </div>
          )}

          {/* Hint */}
          <div style={{ marginTop: 10, fontSize: 9, color: T.dim, lineHeight: 1.6 }}>
            Click a take row to select · ✓ checkbox to include in comp · ★ to rate ·{' '}
            <span style={{ color: T.purple }}>Auto Comp</span> promotes highest-rated takes ·
            Inspired by Pro Tools Playlist comping workflow
          </div>
        </div>
      )}
    </div>
  );
}
