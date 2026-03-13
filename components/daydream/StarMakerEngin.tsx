'use client';

/**
 * StarMakerEngin — Side B control layer for the Music Daydream.
 * Enhanced with premium music production studio features.
 *
 * Responsibilities (README spec §8.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Studio Beat Maker  : 8-step × 4-channel visual sequencer grid (pure UI state, no Web Audio API).
 *   - Mixing Board       : 4-channel volume fader strips (pure UI state).
 *   - Sound Effects      : toggle-able effect palette (pure UI state).
 *   - BPM & Key Selector : BPM + musical key + major/minor toggle (pure UI state).
 *   - Pitch Control      : semitone shift slider −12 → +12 (pure UI state).
 *   - Stem Export        : checklist + bridge.emit('music','music:stem-ready',…) on prepare.
 *   - Your Releases      : real Supabase read (RLS enforced, owner_id = auth.uid()).
 *   - Publishing Controls: real Supabase write (visibility → 'public').
 *
 * Security: reads only rows owned by the authenticated user (RLS enforced
 * server-side; owner_id = auth.uid() filter added client-side as defence-in-depth).
 *
 * Axiom alignment:
 *   AXIOM 3 — every visible action does real work (beat cells toggle state; export emits bridge event).
 *   AXIOM 4 — security by default; no raw user data crosses Engin boundaries without intent.
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream pair: Music / StarMakerEngin).
 * Bridge: lib/runtime/dualRuntimeBridge — 'music' channel, 'music:stem-ready' event.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import Link from 'next/link';
import {
  ArrowLeft,
  Mic2,
  Music,
  Radio,
  Sliders,
  Upload,
  Wand2,
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

// ─── Domain interfaces ─────────────────────────────────────────────────────────

interface MusicRelease {
  id: string;
  title: string;
  visibility: string;
}

/** 4 channels × 8 steps beat grid — pure UI state, no audio API */
type BeatGrid = boolean[][];

interface MixerState {
  vocals: number;
  instruments: number;
  bass: number;
  fx: number;
}

type EffectName =
  | 'Reverb' | 'Delay' | 'Chorus' | 'Distortion'
  | 'Low-Pass' | 'High-Pass' | 'Compressor' | 'Limiter';

interface StemReadyState {
  vocals: boolean;
  drums:  boolean;
  bass:   boolean;
  other:  boolean;
}

type StemKey = keyof StemReadyState;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#2a8ab8';

const BEAT_CHANNELS = ['Kick', 'Snare', 'Hi-Hat', 'Synth'] as const;
const BEAT_STEPS    = 8;

const CHANNEL_COLORS: Record<number, string> = {
  0: '#ef4444',  // Kick   — red
  1: '#f59e0b',  // Snare  — amber
  2: '#2a8ab8',  // Hi-Hat — accent blue
  3: '#8b5cf6',  // Synth  — violet
};

const EFFECT_LIST: EffectName[] = [
  'Reverb', 'Delay', 'Chorus', 'Distortion',
  'Low-Pass', 'High-Pass', 'Compressor', 'Limiter',
];

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;
type MusicalKey = typeof MUSICAL_KEYS[number];

const MIXER_STRIPS: { key: keyof MixerState; label: string; color: string }[] = [
  { key: 'vocals',      label: 'VOC',  color: '#ec4899' },
  { key: 'instruments', label: 'INST', color: '#2a8ab8' },
  { key: 'bass',        label: 'BASS', color: '#8b5cf6' },
  { key: 'fx',          label: 'FX',   color: '#f59e0b' },
];

const STEM_LIST: { key: StemKey; label: string }[] = [
  { key: 'vocals', label: 'Vocals' },
  { key: 'drums',  label: 'Drums'  },
  { key: 'bass',   label: 'Bass'   },
  { key: 'other',  label: 'Other'  },
];

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function createEmptyBeatGrid(): BeatGrid {
  return Array.from({ length: BEAT_CHANNELS.length }, () =>
    Array.from({ length: BEAT_STEPS }, () => false),
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ─── Shared style object (BPM stepper buttons) ─────────────────────────────────

const bpmBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: `1px solid ${ACCENT}30`,
  background: `${ACCENT}10`,
  color: ACCENT,
  fontWeight: 700,
  fontSize: 11,
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: 1,
};

// ─── Root component ────────────────────────────────────────────────────────────

export default function StarMakerEngin({ onBack }: Props) {

  // ── Supabase releases state ──
  const [releases,   setReleases]   = useState<MusicRelease[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  // ── Beat Maker state ──
  const [beatGrid, setBeatGrid] = useState<BeatGrid>(createEmptyBeatGrid);
  const [bpm,      setBpm]      = useState(120);

  // ── Mixing Board state ──
  const [mixer, setMixer] = useState<MixerState>({
    vocals: 80, instruments: 75, bass: 70, fx: 50,
  });

  // ── Sound Effects state ──
  const [activeEffects, setActiveEffects] = useState<Set<EffectName>>(new Set());

  // ── Key / Mode state ──
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('C');
  const [keyMode,    setKeyMode]    = useState<'major' | 'minor'>('major');

  // ── Pitch state ──
  const [pitch, setPitch] = useState(0);

  // ── Stem Export state ──
  const [stemReady,     setStemReady]     = useState<StemReadyState>({ vocals: false, drums: false, bass: false, other: false });
  const [exportPending, setExportPending] = useState(false);
  const [exportDone,    setExportDone]    = useState(false);

  // ── Supabase: fetch releases (defence-in-depth owner_id filter; RLS enforced server-side) ──
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }

      const { data } = await supabase
        .from('music_releases')
        .select('id, title, visibility')
        .eq('owner_id', user.id)
        .order('id', { ascending: false })
        .limit(20);

      if (!cancelled) {
        setReleases((data as MusicRelease[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Supabase: publish draft ──
  async function handlePublish(releaseId: string) {
    setPublishing(releaseId);
    const supabase = createClient();
    const { error } = await supabase
      .from('music_releases')
      .update({ visibility: 'public' })
      .eq('id', releaseId);
    if (!error) {
      setReleases(prev =>
        prev.map(r => r.id === releaseId ? { ...r, visibility: 'public' } : r),
      );
    }
    setPublishing(null);
  }

  // ── Beat grid toggle ──
  const toggleBeat = useCallback((chIdx: number, stepIdx: number) => {
    setBeatGrid(prev => {
      const next = prev.map(row => [...row]);
      next[chIdx][stepIdx] = !next[chIdx][stepIdx];
      return next;
    });
  }, []);

  // ── BPM handlers ──
  const changeBpm = useCallback((delta: number) => {
    setBpm(prev => clamp(prev + delta, 60, 180));
  }, []);

  const handleBpmInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) setBpm(clamp(v, 60, 180));
  }, []);

  // ── Mixer fader ──
  const handleMixerChange = useCallback((ch: keyof MixerState, value: number) => {
    setMixer(prev => ({ ...prev, [ch]: value }));
  }, []);

  // ── Effect toggle ──
  const toggleEffect = useCallback((effect: EffectName) => {
    setActiveEffects(prev => {
      const next = new Set(prev);
      if (next.has(effect)) { next.delete(effect); } else { next.add(effect); }
      return next;
    });
  }, []);

  // ── Stem toggle ──
  const toggleStem = useCallback((key: StemKey) => {
    setStemReady(prev => ({ ...prev, [key]: !prev[key] }));
    setExportDone(false);
  }, []);

  // ── Stem export — emits bridge events for each ready stem ──
  const handlePrepareExport = useCallback(() => {
    const ready = STEM_LIST.filter(({ key }) => stemReady[key]);
    if (ready.length === 0) return;
    setExportPending(true);

    for (const { key } of ready) {
      // Emit music:stem-ready on the Dual Runtime Bridge (music channel).
      // url is intentionally empty here — a real upload flow would populate it.
      // docs/ARCHITECTURE.md §1 (Daydream pair system) + bridge.emit contract.
      bridge.emit('music', 'music:stem-ready', {
        stemType: key as 'vocals' | 'drums' | 'bass' | 'other',
        url: '',
      });
    }

    // Brief visual confirmation tick
    setTimeout(() => {
      setExportPending(false);
      setExportDone(true);
    }, 800);
  }, [stemReady]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Music Studio"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              StarMakerEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Music Studio · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 1 ── Studio Beat Maker */}
          <BeatMakerWidget
            beatGrid={beatGrid}
            bpm={bpm}
            onToggleBeat={toggleBeat}
            onChangeBpm={changeBpm}
            onBpmInput={handleBpmInput}
          />

          {/* 2 ── Mixing Board */}
          <MixingBoardWidget
            mixer={mixer}
            onMixerChange={handleMixerChange}
          />

          {/* 3 ── Sound Effects Palette */}
          <EffectsPaletteWidget
            activeEffects={activeEffects}
            onToggleEffect={toggleEffect}
          />

          {/* 4 ── BPM & Key Selector (includes pitch control) */}
          <KeyAndPitchWidget
            bpm={bpm}
            musicalKey={musicalKey}
            keyMode={keyMode}
            pitch={pitch}
            onChangeBpm={changeBpm}
            onBpmInput={handleBpmInput}
            onKeyChange={setMusicalKey}
            onModeToggle={() => setKeyMode(m => m === 'major' ? 'minor' : 'major')}
            onPitchChange={setPitch}
          />

          {/* 5 ── Stem Export Checklist */}
          <StemExportWidget
            stemReady={stemReady}
            exportPending={exportPending}
            exportDone={exportDone}
            onToggleStem={toggleStem}
            onPrepareExport={handlePrepareExport}
          />

          {/* 6 ── Your Releases (real Supabase data) */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">
                <Music className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
                Your Releases
              </span>
              <Link href="/music" className="text-xs font-semibold" style={{ color: ACCENT }}>
                View All →
              </Link>
            </div>

            <div className="de-widget-body">
              {loading ? (
                <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                  Loading releases…
                </p>
              ) : releases.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                  <Music className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                      No releases yet
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      Upload your first track to get started.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {releases.map(r => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(160,195,240,0.18)',
                      }}
                    >
                      <Radio className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                      <span
                        style={{
                          flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                        }}
                      >
                        {r.title}
                      </span>
                      <StatusBadge published={r.visibility === 'public'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="de-widget-actions">
              <Link href="/daydream/music" className="de-btn de-btn-ghost text-xs">
                <Upload className="w-3 h-3 mr-1" />
                Upload New Release
              </Link>
            </div>
          </div>

          {/* 7 ── Publishing Controls (real Supabase write) */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Publishing Controls</span>
            </div>

            <div className="de-widget-body">
              {loading ? (
                <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading…</p>
              ) : releases.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                  Upload a release above to manage its publishing status here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {releases.map(r => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(160,195,240,0.14)',
                      }}
                    >
                      <span
                        style={{
                          flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                        }}
                      >
                        {r.title}
                      </span>

                      {r.visibility === 'public' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                          ✓ Live
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublish(r.id)}
                          disabled={publishing === r.id}
                          className="de-btn de-btn-primary"
                          style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0, opacity: publishing === r.id ? 0.6 : 1 }}
                        >
                          {publishing === r.id ? 'Publishing…' : 'Publish'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: 1 — Studio Beat Maker
// ─────────────────────────────────────────────────────────────────────────────

interface BeatMakerWidgetProps {
  beatGrid:     BeatGrid;
  bpm:          number;
  onToggleBeat: (chIdx: number, stepIdx: number) => void;
  onChangeBpm:  (delta: number) => void;
  onBpmInput:   (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BeatMakerWidget({ beatGrid, bpm, onToggleBeat, onChangeBpm, onBpmInput }: BeatMakerWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Music className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Studio Beat Maker
        </span>

        {/* Inline compact BPM display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" onClick={() => onChangeBpm(-1)} style={bpmBtnStyle} aria-label="Decrease BPM by 1">−</button>
          <input
            type="number"
            value={bpm}
            min={60}
            max={180}
            onChange={onBpmInput}
            aria-label="BPM"
            style={{
              width: 46, textAlign: 'center', fontSize: 12, fontWeight: 700,
              background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`,
              borderRadius: 6, padding: '2px 4px', color: ACCENT,
              MozAppearance: 'textfield',
            }}
          />
          <button type="button" onClick={() => onChangeBpm(1)} style={bpmBtnStyle} aria-label="Increase BPM by 1">+</button>
          <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 700 }}>BPM</span>
        </div>
      </div>

      <div className="de-widget-body">
        {/* Step number header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `56px repeat(${BEAT_STEPS}, 1fr)`,
            gap: 3,
            marginBottom: 4,
          }}
        >
          <div />
          {Array.from({ length: BEAT_STEPS }, (_, i) => (
            <div
              key={i}
              style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Channel rows */}
        {BEAT_CHANNELS.map((ch, chIdx) => (
          <div
            key={ch}
            style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${BEAT_STEPS}, 1fr)`,
              gap: 3,
              marginBottom: 4,
            }}
          >
            {/* Channel label */}
            <div
              style={{
                fontSize: 10, fontWeight: 700,
                color: CHANNEL_COLORS[chIdx],
                display: 'flex', alignItems: 'center',
              }}
            >
              {ch}
            </div>

            {/* Step pads */}
            {beatGrid[chIdx].map((active, stepIdx) => (
              <button
                key={stepIdx}
                type="button"
                onClick={() => onToggleBeat(chIdx, stepIdx)}
                aria-label={`${ch} step ${stepIdx + 1} ${active ? 'on' : 'off'}`}
                aria-pressed={active}
                style={{
                  height: 30,
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'background 0.1s, transform 0.08s, box-shadow 0.1s',
                  background: active
                    ? CHANNEL_COLORS[chIdx]
                    : 'rgba(160,195,240,0.18)',
                  boxShadow: active
                    ? `0 2px 8px ${CHANNEL_COLORS[chIdx]}55`
                    : 'none',
                  transform: active ? 'scale(0.94)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: 2 — Mixing Board
// ─────────────────────────────────────────────────────────────────────────────

interface MixingBoardWidgetProps {
  mixer:          MixerState;
  onMixerChange:  (ch: keyof MixerState, value: number) => void;
}

function MixingBoardWidget({ mixer, onMixerChange }: MixingBoardWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Sliders className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Mixing Board
        </span>
      </div>

      <div className="de-widget-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {MIXER_STRIPS.map(({ key, label, color }) => (
            <div
              key={key}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 6px 8px',
                background: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(160,195,240,0.18)',
                borderRadius: 12,
                gap: 5,
              }}
            >
              {/* Numeric readout */}
              <div style={{ fontSize: 11, fontWeight: 700, color }}>
                {mixer[key]}
              </div>

              {/* Vertical fader — range input rotated −90° inside a clipping box */}
              <div
                style={{
                  width: 32, height: 90,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={mixer[key]}
                  onChange={e => onMixerChange(key, Number(e.target.value))}
                  aria-label={`${label} volume`}
                  style={{
                    width: 90,
                    accentColor: color,
                    transform: 'rotate(-90deg)',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Channel name */}
              <div
                style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                  color, opacity: 0.85,
                }}
              >
                {label}
              </div>

              {/* Mini level bar */}
              <div
                style={{
                  width: '100%', height: 4, borderRadius: 9999,
                  background: 'rgba(160,195,240,0.2)', overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%', borderRadius: 9999,
                    width: `${mixer[key]}%`,
                    background: color,
                    transition: 'width 0.1s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: 3 — Sound Effects Palette
// ─────────────────────────────────────────────────────────────────────────────

interface EffectsPaletteWidgetProps {
  activeEffects:  Set<EffectName>;
  onToggleEffect: (effect: EffectName) => void;
}

function EffectsPaletteWidget({ activeEffects, onToggleEffect }: EffectsPaletteWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Wand2 className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Sound Effects
        </span>
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
          {activeEffects.size} active
        </span>
      </div>

      <div className="de-widget-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {EFFECT_LIST.map(effect => {
            const on = activeEffects.has(effect);
            return (
              <button
                key={effect}
                type="button"
                onClick={() => onToggleEffect(effect)}
                aria-pressed={on}
                style={{
                  padding: '9px 4px',
                  borderRadius: 8,
                  border: on
                    ? `1.5px solid ${ACCENT}`
                    : '1.5px solid rgba(160,195,240,0.25)',
                  background: on
                    ? `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}10)`
                    : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  color: on ? ACCENT : 'var(--de-text-dim)',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  letterSpacing: '0.02em',
                }}
              >
                {effect}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: 4 + 5 — BPM & Key Selector + Pitch Control (combined)
// ─────────────────────────────────────────────────────────────────────────────

interface KeyAndPitchWidgetProps {
  bpm:          number;
  musicalKey:   MusicalKey;
  keyMode:      'major' | 'minor';
  pitch:        number;
  onChangeBpm:  (delta: number) => void;
  onBpmInput:   (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyChange:  (key: MusicalKey) => void;
  onModeToggle: () => void;
  onPitchChange:(v: number) => void;
}

function KeyAndPitchWidget({
  bpm, musicalKey, keyMode, pitch,
  onChangeBpm, onBpmInput, onKeyChange, onModeToggle, onPitchChange,
}: KeyAndPitchWidgetProps) {

  const pitchColor = pitch === 0
    ? 'var(--de-text-dim)'
    : pitch > 0 ? '#22c55e' : '#ef4444';

  const pitchBg = pitch === 0
    ? 'rgba(160,195,240,0.18)'
    : pitch > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';

  const pitchBorder = pitch === 0
    ? 'rgba(160,195,240,0.3)'
    : pitch > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Radio className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          BPM &amp; Key
        </span>
      </div>

      <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Tempo section ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 6, letterSpacing: '0.06em' }}>
            TEMPO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button type="button" onClick={() => onChangeBpm(-5)} style={bpmBtnStyle} aria-label="Decrease BPM by 5">−5</button>
            <button type="button" onClick={() => onChangeBpm(-1)} style={bpmBtnStyle} aria-label="Decrease BPM by 1">−1</button>
            <input
              type="number"
              value={bpm}
              min={60}
              max={180}
              onChange={onBpmInput}
              aria-label="BPM value"
              style={{
                flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 800,
                background: `${ACCENT}10`, border: `1.5px solid ${ACCENT}30`,
                borderRadius: 8, padding: '4px 8px', color: ACCENT,
                minWidth: 0, MozAppearance: 'textfield',
              }}
            />
            <button type="button" onClick={() => onChangeBpm(1)} style={bpmBtnStyle} aria-label="Increase BPM by 1">+1</button>
            <button type="button" onClick={() => onChangeBpm(5)} style={bpmBtnStyle} aria-label="Increase BPM by 5">+5</button>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)' }}>BPM</span>
          </div>
        </div>

        {/* ── Key section ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em' }}>
              KEY
            </span>
            <button
              type="button"
              onClick={onModeToggle}
              style={{
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 99,
                border: `1.5px solid ${ACCENT}35`,
                background: `${ACCENT}15`, color: ACCENT,
                cursor: 'pointer',
              }}
            >
              {keyMode === 'major' ? 'Major' : 'Minor'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {MUSICAL_KEYS.map(k => {
              const sel = musicalKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKeyChange(k)}
                  aria-pressed={sel}
                  style={{
                    padding: '6px 2px',
                    borderRadius: 7,
                    border: sel ? `1.5px solid ${ACCENT}` : '1.5px solid rgba(160,195,240,0.25)',
                    background: sel ? `${ACCENT}20` : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    color: sel ? ACCENT : 'var(--de-text)',
                    transition: 'all 0.12s',
                    textAlign: 'center',
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Selected key readout */}
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>
            {musicalKey} {keyMode === 'major' ? 'Major' : 'Minor'}
          </div>
        </div>

        {/* ── Pitch Control section ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mic2 className="w-3 h-3" style={{ color: ACCENT }} />
              PITCH SHIFT
            </span>
            {/* Semitone indicator pill */}
            <span
              style={{
                fontSize: 11, fontWeight: 800,
                padding: '2px 10px', borderRadius: 99,
                background: pitchBg,
                color: pitchColor,
                border: `1px solid ${pitchBorder}`,
              }}
            >
              {pitch > 0 ? `+${pitch}` : pitch} st
            </span>
          </div>

          <input
            type="range"
            min={-12}
            max={12}
            step={1}
            value={pitch}
            onChange={e => onPitchChange(Number(e.target.value))}
            aria-label="Pitch semitone shift"
            style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }}
          />

          {/* Scale markers */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 9, color: 'var(--de-text-dim)',
              marginTop: 3, paddingLeft: 2, paddingRight: 2,
            }}
          >
            <span>−12</span>
            <span>−6</span>
            <span style={{ fontWeight: 700 }}>0</span>
            <span>+6</span>
            <span>+12</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: 6 — Stem Export Checklist
// ─────────────────────────────────────────────────────────────────────────────

interface StemExportWidgetProps {
  stemReady:        StemReadyState;
  exportPending:    boolean;
  exportDone:       boolean;
  onToggleStem:     (key: StemKey) => void;
  onPrepareExport:  () => void;
}

function StemExportWidget({
  stemReady, exportPending, exportDone,
  onToggleStem, onPrepareExport,
}: StemExportWidgetProps) {
  const anyChecked = Object.values(stemReady).some(Boolean);

  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Upload className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Stem Export
        </span>
        {exportDone && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
            ✓ Queued to Bridge
          </span>
        )}
      </div>

      <div className="de-widget-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {STEM_LIST.map(({ key, label }) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: stemReady[key] ? `${ACCENT}10` : 'rgba(255,255,255,0.4)',
                border: stemReady[key]
                  ? `1px solid ${ACCENT}35`
                  : '1px solid rgba(160,195,240,0.18)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={stemReady[key]}
                onChange={() => onToggleStem(key)}
                aria-label={`Mark ${label} stem ready`}
                style={{ accentColor: ACCENT, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1, fontSize: 13, fontWeight: 600,
                  color: stemReady[key] ? ACCENT : 'var(--de-heading)',
                }}
              >
                {label}
              </span>
              {stemReady[key] && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                  Ready
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="de-widget-actions">
        <button
          type="button"
          onClick={onPrepareExport}
          disabled={!anyChecked || exportPending}
          className="de-btn de-btn-primary"
          style={{ opacity: !anyChecked || exportPending ? 0.5 : 1 }}
        >
          {exportPending ? (
            'Preparing…'
          ) : exportDone ? (
            '✓ Export Ready'
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 mr-1.5 inline" />
              Prepare Export
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
        padding: '2px 8px', borderRadius: 999,
        background: published ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.18)',
        color: published ? '#22c55e' : 'var(--de-text-dim)',
        border: published ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(160,195,240,0.25)',
      }}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
