'use client';

/**
 * PianoRollPanel — FL Studio / Logic Pro style MIDI note editor.
 *
 * Features:
 *  - 88-key piano keyboard on left side (white/black keys)
 *  - Horizontal note grid with beat ruler
 *  - Click empty cell to add note
 *  - Click existing note to remove it
 *  - Velocity bars at bottom strip
 *  - Quantize picker (1/4, 1/8, 1/16, 1/32)
 *  - Octave scroll (−/+ buttons)
 *  - Note count and range readout
 */

import { type CSSProperties, useState, useCallback } from 'react';
import { Piano, ChevronUp, ChevronDown } from 'lucide-react';
import {
  type MidiNote,
  type PianoRollQuantize,
  type PianoRollState,
  createMidiNote,
  isBlackKey,
  midiPitchToName,
  snapToGrid,
} from '@/lib/music/starmakerDaw';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

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
} as const;

const QUANTIZE_OPTIONS: PianoRollQuantize[] = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/32'];
const PITCH_ROW_H = 12;   // px per pitch row
const BEAT_COL_W = 32;    // px per beat column
const KEY_W = 52;         // px for piano keyboard strip

// ─── Props ────────────────────────────────────────────────────────────────────

interface PianoRollPanelProps {
  state: PianoRollState;
  bpm: number;
  onStateChange: (next: PianoRollState) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeader(label: string, extra?: React.ReactNode) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: '#111420',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <Piano className="w-3 h-3" style={{ color: T.accent }} />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim }}>
        {label}
      </span>
      {extra}
    </div>
  );
}

function pill(color: string, text: string) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PianoRollPanel({ state, bpm, onStateChange }: PianoRollPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ pitch: number; beat: number } | null>(null);

  const { notes, totalBeats, quantize, viewBottomPitch, viewPitchRange } = state;

  // Derived pitch range visible on screen
  const visiblePitches: number[] = Array.from(
    { length: viewPitchRange },
    (_, i) => viewBottomPitch + viewPitchRange - 1 - i,
  );

  // Beat columns
  const quantizeDivisions: Record<PianoRollQuantize, number> = {
    '1/1': 1, '1/2': 0.5, '1/4': 0.25, '1/8': 0.125, '1/16': 0.0625, '1/32': 0.03125,
  };
  const div = quantizeDivisions[quantize];
  const totalCols = Math.round(totalBeats / div);
  const beats: number[] = Array.from({ length: totalCols }, (_, i) => i * div);

  // Lookup: does a note occupy (pitch, beat)?
  function noteAt(pitch: number, beat: number): MidiNote | undefined {
    return notes.find(n =>
      n.pitch === pitch &&
      beat >= n.startBeat &&
      beat < n.startBeat + n.durationBeats,
    );
  }

  const handleCellClick = useCallback((pitch: number, beat: number) => {
    const existing = noteAt(pitch, beat);
    if (existing) {
      // Remove note
      onStateChange({ ...state, notes: notes.filter(n => n.id !== existing.id) });
    } else {
      // Add note
      const snapped = snapToGrid(beat, quantize);
      const newNote = createMidiNote(pitch, snapped, div);
      onStateChange({ ...state, notes: [...notes, newNote] });
    }
  }, [notes, state, onStateChange, quantize, div]);

  function scrollOctave(delta: number) {
    const next = viewBottomPitch + delta * 12;
    if (next < 0 || next > 103) return;
    onStateChange({ ...state, viewBottomPitch: next });
  }

  const beatsPerSecond = bpm / 60;
  const gridWidthPx = totalCols * BEAT_COL_W;

  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      {sectionHeader(
        'Piano Roll — MIDI Editor',
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {pill(T.accent, `${notes.length} note${notes.length !== 1 ? 's' : ''}`)}
          {pill(T.green, `${bpm} BPM`)}
          <button
            type="button"
            onClick={() => setIsOpen(o => !o)}
            style={{
              padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
              background: isOpen ? `${T.accent}18` : `rgba(255,255,255,0.04)`,
              border: `1px solid ${isOpen ? `${T.accent}40` : T.border}`,
              color: isOpen ? T.accent : T.dim, fontSize: 11, fontWeight: 700,
            }}>
            {isOpen ? 'Close' : 'Open'}
          </button>
        </div>,
      )}

      {isOpen && (
        <div style={{ padding: '12px 12px 8px' }}>
          {/* ── Toolbar ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {/* Quantize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.dim, letterSpacing: '0.06em' }}>QUANTIZE</span>
              {QUANTIZE_OPTIONS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onStateChange({ ...state, quantize: q })}
                  style={{
                    padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: quantize === q ? `${T.accent}25` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${quantize === q ? `${T.accent}50` : T.border}`,
                    color: quantize === q ? T.accent : T.dim,
                  }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Length control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.dim }}>BARS</span>
              {[4, 8, 16, 32].map(bars => (
                <button
                  key={bars}
                  type="button"
                  onClick={() => onStateChange({ ...state, totalBeats: bars * 4 })}
                  style={{
                    padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: totalBeats === bars * 4 ? `${T.green}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${totalBeats === bars * 4 ? `${T.green}50` : T.border}`,
                    color: totalBeats === bars * 4 ? T.green : T.dim,
                  }}>
                  {bars}
                </button>
              ))}
            </div>
          </div>

          {/* ── Grid ── */}
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Piano keyboard strip */}
            <div style={{ width: KEY_W, flexShrink: 0 }}>
              {/* Octave scroll */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 0', borderBottom: `1px solid ${T.border}`,
                background: '#0f1118', gap: 2,
              }}>
                <button type="button" onClick={() => scrollOctave(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: '2px 4px' }}>
                  <ChevronUp className="w-3 h-3" />
                </button>
                <span style={{ fontSize: 9, color: T.dim, fontWeight: 700 }}>OCT</span>
                <button type="button" onClick={() => scrollOctave(-1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: '2px 4px' }}>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Keys */}
              {visiblePitches.map(pitch => {
                const isBlack = isBlackKey(pitch);
                const isC = pitch % 12 === 0;
                const hasNote = notes.some(n => n.pitch === pitch);
                return (
                  <div
                    key={pitch}
                    title={midiPitchToName(pitch)}
                    style={{
                      height: PITCH_ROW_H,
                      background: hasNote
                        ? `${T.accent}40`
                        : isBlack ? '#1a1d2a' : '#2d3348',
                      borderBottom: isC
                        ? `1px solid ${T.accent}40`
                        : `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', paddingLeft: 4,
                    }}>
                    {isC && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: isBlack ? T.dim : T.accent }}>
                        {midiPitchToName(pitch)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Note grid */}
            <div style={{ flex: 1, overflowX: 'auto' }}>
              {/* Beat ruler */}
              <div style={{
                display: 'flex', height: 18, background: '#0f1118',
                borderBottom: `1px solid ${T.border}`,
                minWidth: gridWidthPx,
              }}>
                {beats.map((beat, i) => (
                  <div
                    key={i}
                    style={{
                      width: BEAT_COL_W, flexShrink: 0,
                      borderRight: `1px solid ${beat % 4 === 0 ? T.borderBright : T.border}`,
                      display: 'flex', alignItems: 'center', paddingLeft: 3,
                    }}>
                    {beat % 1 === 0 && (
                      <span style={{
                        fontSize: 8, fontWeight: 700,
                        color: beat % 4 === 0 ? T.accent : T.dim,
                      }}>
                        {beat % 4 === 0 ? `B${Math.floor(beat / 4) + 1}` : `.${((beat % 4) * (1 / div)).toFixed(0)}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Note rows */}
              <div style={{ minWidth: gridWidthPx }}>
                {visiblePitches.map(pitch => {
                  const isBlack = isBlackKey(pitch);
                  const isC = pitch % 12 === 0;

                  return (
                    <div
                      key={pitch}
                      style={{
                        display: 'flex', height: PITCH_ROW_H,
                        background: isBlack ? 'rgba(0,0,0,0.25)' : 'transparent',
                        borderBottom: isC
                          ? `1px solid rgba(0,208,240,0.12)`
                          : `1px solid ${T.border}`,
                      }}>
                      {beats.map((beat, bi) => {
                        const note = noteAt(pitch, beat);
                        const isHovered = hoveredCell?.pitch === pitch && hoveredCell?.beat === beat;
                        const isStartOfNote = note && note.startBeat === beat;

                        return (
                          <div
                            key={bi}
                            onMouseEnter={() => setHoveredCell({ pitch, beat })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => handleCellClick(pitch, beat)}
                            style={{
                              width: BEAT_COL_W, flexShrink: 0, height: '100%',
                              borderRight: `1px solid ${beat % 4 === 0 ? T.borderBright : T.border}`,
                              background: note
                                ? `${T.accent}${isStartOfNote ? '90' : '50'}`
                                : isHovered
                                  ? `${T.accent}14`
                                  : 'transparent',
                              cursor: 'pointer',
                              position: 'relative',
                            }}>
                            {isStartOfNote && (
                              <div style={{
                                position: 'absolute', left: 2, top: 1, bottom: 1,
                                display: 'flex', alignItems: 'center',
                              }}>
                                <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', opacity: 0.9, letterSpacing: '-0.02em' }}>
                                  {midiPitchToName(pitch)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Velocity strip ── */}
          {notes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: '0.08em', marginBottom: 4 }}>
                VELOCITY
              </div>
              <div style={{
                display: 'flex', gap: 2, height: 32,
                border: `1px solid ${T.border}`, borderRadius: 6,
                padding: '2px 4px', background: '#0f1118',
                overflowX: 'auto',
              }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    title={`${midiPitchToName(note.pitch)} — vel ${note.velocity}`}
                    style={{
                      width: 6, flexShrink: 0, borderRadius: 2, alignSelf: 'flex-end',
                      height: `${Math.round((note.velocity / 127) * 100)}%`,
                      background: `${T.accent}cc`,
                      minHeight: 3,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Info row ── */}
          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 9, color: T.dim }}>
            <span>
              {notes.length > 0
                ? `Range: ${midiPitchToName(Math.min(...notes.map(n => n.pitch)))} → ${midiPitchToName(Math.max(...notes.map(n => n.pitch)))}`
                : 'Click a grid cell to add a note · click again to remove'}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              {(totalBeats / 4).toFixed(0)} bars · {beatsPerSecond.toFixed(2)} beats/s at {bpm} BPM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
