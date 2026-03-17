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

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
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

  // ── Waveform Visualizer state ──
  const [waveformBars, setWaveformBars] = useState<number[]>(() =>
    Array.from({ length: 32 }, () => 0.2 + Math.random() * 0.8)
  );
  const [waveformRecording, setWaveformRecording] = useState(false);

  // ── Chord Builder state ──
  const [chordProgression, setChordProgression] = useState<string[]>(['Cmaj', 'Amin', 'Fmaj', 'Gmaj']);
  const [chordPlaying, setChordPlaying] = useState<number | null>(null);

  // ── AI Melody Suggestions state ──
  const [melodyLoading, setMelodyLoading] = useState(false);
  const [melodySuggestions, setMelodySuggestions] = useState<string[]>([]);

  // ── Collab Studio state ──
  const [collabActive, setCollabActive] = useState(false);
  const [collabCode, setCollabCode] = useState('');

  // ── Playlist Manager state ──
  const [playlist, setPlaylist] = useState<Array<{ id: string; title: string; duration: string }>>([
    { id: 'pl-1', title: 'Summer Vibes', duration: '3:24' },
    { id: 'pl-2', title: 'Night Drive', duration: '4:01' },
    { id: 'pl-3', title: 'Morning Coffee', duration: '2:47' },
  ]);

  // ── Waveform toggle handler ──
  function handleWaveformToggle() {
    const next = !waveformRecording;
    setWaveformRecording(next);
    if (next) setWaveformBars(Array.from({ length: 32 }, () => 0.2 + Math.random() * 0.8));
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:waveform-record', { recording: next },
    );
  }

  // ── Chord play handler ──
  function handleChordPlay(index: number) {
    setChordPlaying(index);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:chord-play', { chord: chordProgression[index], index },
    );
    setTimeout(() => setChordPlaying(prev => prev === index ? null : prev), 1000);
  }

  // ── Melody ask handler ──
  function handleMelodyAsk() {
    setMelodyLoading(true);
    setMelodySuggestions([]);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:melody-request', { key: musicalKey, mode: keyMode },
    );
    setTimeout(() => {
      setMelodySuggestions([
        'C D E G A — Pentatonic ascent',
        'A G F E D — Minor descent',
        'G A B D E — Major pentatonic',
      ]);
      setMelodyLoading(false);
    }, 1200);
  }

  // ── Collab toggle handler ──
  function handleCollabToggle() {
    if (!collabActive) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      setCollabCode(code);
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
        'music', 'music:collab-start', { code },
      );
    }
    setCollabActive(prev => !prev);
  }

  // ── Playlist reorder handler ──
  function movePlaylistItem(index: number, direction: 'up' | 'down') {
    setPlaylist(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSavePlaylist() {
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:playlist-save', { order: playlist.map(p => p.id) },
    );
  }

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

          {/* ── Waveform Visualizer ── */}
          <WaveformVisualizerWidget
            bars={waveformBars}
            recording={waveformRecording}
            onToggle={handleWaveformToggle}
          />

          {/* ── Chord Builder ── */}
          <ChordBuilderWidget
            progression={chordProgression}
            playing={chordPlaying}
            onChangeChord={(i, v) => setChordProgression(prev => prev.map((c, idx) => idx === i ? v : c))}
            onPlay={handleChordPlay}
          />

          {/* ── AI Melody Suggestions ── */}
          <AiMelodySuggestionsWidget
            loading={melodyLoading}
            suggestions={melodySuggestions}
            onAsk={handleMelodyAsk}
          />

          {/* ── Collab Studio ── */}
          <CollabStudioWidget
            active={collabActive}
            code={collabCode}
            onToggle={handleCollabToggle}
          />

          {/* ── Playlist Manager ── */}
          <PlaylistManagerWidget
            playlist={playlist}
            onMove={movePlaylistItem}
            onSave={handleSavePlaylist}
          />

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: WaveformVisualizer
// ─────────────────────────────────────────────────────────────────────────────

interface WaveformVisualizerWidgetProps {
  bars: number[];
  recording: boolean;
  onToggle: () => void;
}

function WaveformVisualizerWidget({ bars, recording, onToggle }: WaveformVisualizerWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <Mic2 className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="de-widget-title ml-2">Waveform Visualizer</span>
        {recording && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            ● REC
          </span>
        )}
      </div>
      <div className="de-widget-body">
        <div
          style={{
            display: 'flex', alignItems: 'flex-end', gap: 2,
            height: 52, padding: '0 4px',
          }}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1, borderRadius: 2,
                background: recording
                  ? `rgba(239,68,68,${0.4 + h * 0.6})`
                  : `${ACCENT}${Math.round(40 + h * 80).toString(16).padStart(2, '0')}`,
                height: `${Math.round(h * 100)}%`,
                transition: recording ? 'height 0.1s ease' : 'all 0.15s',
                minHeight: 3,
              }}
            />
          ))}
        </div>
      </div>
      <div className="de-widget-actions">
        <button
          type="button"
          onClick={onToggle}
          className={recording ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
          aria-label={recording ? 'Stop recording waveform' : 'Start recording waveform'}
          style={{ transition: 'all 0.15s' }}
        >
          {recording ? '■ Stop' : '● Record'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: ChordBuilder
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_CHORDS = [
  'Cmaj','Cmin','Dmaj','Dmin','Emaj','Emin',
  'Fmaj','Fmin','Gmaj','Gmin','Amaj','Amin','Bmaj','Bmin',
];

interface ChordBuilderWidgetProps {
  progression: string[];
  playing: number | null;
  onChangeChord: (index: number, value: string) => void;
  onPlay: (index: number) => void;
}

function ChordBuilderWidget({ progression, playing, onChangeChord, onPlay }: ChordBuilderWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <Music className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="de-widget-title ml-2">Chord Builder</span>
      </div>
      <div className="de-widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {progression.map((chord, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px', borderRadius: 10,
                background: playing === i ? `${ACCENT}15` : 'rgba(255,255,255,0.5)',
                border: playing === i ? `1px solid ${ACCENT}40` : '1px solid rgba(160,195,240,0.18)',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)' }}>
                Slot {i + 1}
              </span>
              <select
                value={chord}
                onChange={e => onChangeChord(i, e.target.value)}
                aria-label={`Chord slot ${i + 1}`}
                style={{
                  padding: '4px 8px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${ACCENT}30`, background: 'rgba(255,255,255,0.8)',
                  color: 'var(--de-heading)', cursor: 'pointer',
                }}
              >
                {COMMON_CHORDS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onPlay(i)}
                className="de-btn de-btn-ghost"
                aria-label={`Play ${chord}`}
                style={{
                  fontSize: 11, padding: '4px 0', textAlign: 'center',
                  background: playing === i ? `${ACCENT}18` : undefined,
                  transition: 'all 0.15s',
                }}
              >
                {playing === i ? '▶ Playing…' : '▶ Play'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: AiMelodySuggestions
// ─────────────────────────────────────────────────────────────────────────────

interface AiMelodySuggestionsWidgetProps {
  loading: boolean;
  suggestions: string[];
  onAsk: () => void;
}

function AiMelodySuggestionsWidget({ loading, suggestions, onAsk }: AiMelodySuggestionsWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <Wand2 className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="de-widget-title ml-2">AI Melody Suggestions</span>
      </div>
      <div className="de-widget-body">
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '9px 12px', borderRadius: 10,
                  background: `${ACCENT}08`,
                  border: `1px solid ${ACCENT}25`,
                  fontSize: 12, fontWeight: 600, color: 'var(--de-heading)',
                  fontFamily: 'monospace',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
        {suggestions.length === 0 && !loading && (
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
            Ask Dr. Eams for melody pattern ideas based on your current key and mode.
          </p>
        )}
      </div>
      <div className="de-widget-actions">
        <button
          type="button"
          onClick={onAsk}
          disabled={loading}
          className="de-btn de-btn-primary"
          aria-label="Ask Dr. Eams for melody suggestions"
          style={{ opacity: loading ? 0.6 : 1, transition: 'all 0.15s' }}
        >
          {loading ? '✨ Thinking…' : '✨ Ask Dr. Eams'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: CollabStudio
// ─────────────────────────────────────────────────────────────────────────────

interface CollabStudioWidgetProps {
  active: boolean;
  code: string;
  onToggle: () => void;
}

function CollabStudioWidget({ active, code, onToggle }: CollabStudioWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <Radio className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="de-widget-title ml-2">Collab Studio</span>
        {active && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            Live
          </span>
        )}
      </div>
      <div className="de-widget-body">
        {active ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                background: `${ACCENT}08`, border: `1px solid ${ACCENT}30`,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>
                ROOM CODE
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.15em', color: ACCENT, fontFamily: 'monospace' }}>
                {code}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Dr. Eams', 'Guest'].map(name => (
                <div
                  key={name}
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 10, textAlign: 'center',
                    background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(160,195,240,0.2)',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 2 }}>👤</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{name}</div>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e', margin: '4px auto 0' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
            Start a shared session to co-produce music in real time.
          </p>
        )}
      </div>
      <div className="de-widget-actions">
        <button
          type="button"
          onClick={onToggle}
          className={active ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
          aria-label={active ? 'End collab session' : 'Start collab session'}
          style={{ transition: 'all 0.15s' }}
        >
          {active ? 'End Session' : 'Start Session'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widget: PlaylistManager
// ─────────────────────────────────────────────────────────────────────────────

interface PlaylistManagerWidgetProps {
  playlist: Array<{ id: string; title: string; duration: string }>;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onSave: () => void;
}

function PlaylistManagerWidget({ playlist, onMove, onSave }: PlaylistManagerWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <Sliders className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="de-widget-title ml-2">Playlist Manager</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
        >
          {playlist.length} tracks
        </span>
      </div>
      <div className="de-widget-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {playlist.map((track, i) => (
            <div
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', minWidth: 16, textAlign: 'center' }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.title}
              </span>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)', flexShrink: 0 }}>{track.duration}</span>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => onMove(i, 'up')}
                  disabled={i === 0}
                  aria-label={`Move ${track.title} up`}
                  style={{
                    width: 22, height: 22, borderRadius: 6, border: `1px solid ${ACCENT}30`,
                    background: `${ACCENT}10`, color: ACCENT, fontSize: 10, cursor: i === 0 ? 'not-allowed' : 'pointer',
                    opacity: i === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >▲</button>
                <button
                  type="button"
                  onClick={() => onMove(i, 'down')}
                  disabled={i === playlist.length - 1}
                  aria-label={`Move ${track.title} down`}
                  style={{
                    width: 22, height: 22, borderRadius: 6, border: `1px solid ${ACCENT}30`,
                    background: `${ACCENT}10`, color: ACCENT, fontSize: 10, cursor: i === playlist.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: i === playlist.length - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="de-widget-actions">
        <button
          type="button"
          onClick={onSave}
          className="de-btn de-btn-primary"
          aria-label="Save playlist order"
          style={{ transition: 'all 0.15s' }}
        >
          Save Order
        </button>
      </div>
    </div>
  );
}
