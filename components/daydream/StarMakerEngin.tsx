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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamState } from '@/lib/daydream/useDaydreamState';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import {
  buildReleaseStrategy,
  createMelodySuggestions,
  summarizePlaybackProfile,
  type MelodySuggestion,
  type PlaybackQualityMode,
} from '@/lib/music/starmaker';
import {
  ARRANGEMENT_BARS,
  ARRANGEMENT_SOURCE_COLORS,
  ARRANGEMENT_TRACKS,
  type ArrangementClip,
  type ArrangementSource,
  type ArrangementTrackId,
  type ArrangementTrackState,
} from '@/lib/music/starmakerArrangement';
import {
  BEAT_PRESETS,
  INSTRUMENT_PRESETS,
  PROJECT_TEMPLATES,
  GENRE_LIST,
  type BeatPreset,
  type InstrumentPreset,
  type ProjectTemplate,
} from '@/lib/music/presets';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import {
  type PianoRollState,
  type CompingState,
  type SessionViewState,
  PIANO_ROLL_DEFAULTS,
  createInitialCompingState,
  createInitialSessionView,
} from '@/lib/music/starmakerDaw';
import JourneyTrail from '@/components/daydream/JourneyTrail';
import MultitrackArrangementPanel from '@/components/daydream/starmaker/MultitrackArrangementPanel';
import PianoRollPanel from '@/components/daydream/starmaker/PianoRollPanel';
import CompingPanel from '@/components/daydream/starmaker/CompingPanel';
import SessionViewPanel from '@/components/daydream/starmaker/SessionViewPanel';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileAudio,
  FolderOpen,
  Gauge,
  Mic2,
  Music,
  Pause,
  Play,
  Radio,
  Sliders,
  Sparkles,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
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

const NOTE_FREQUENCIES: Record<string, number> = {
  C: 261.63,
  'C#': 277.18,
  D: 293.66,
  'D#': 311.13,
  E: 329.63,
  F: 349.23,
  'F#': 369.99,
  G: 392,
  'G#': 415.3,
  A: 440,
  'A#': 466.16,
  B: 493.88,
};

const PREVIEW_VOICE_FREQUENCIES = {
  kick: 55,      // low fundamental thump
  snare: 185,    // mid-range body
  hiHat: 3200,   // bright tick / harmonic sheen
} as const;

const STEP_DIVISION_PER_BEAT = 2; // 8 steps across 4 beats = eighth-note transport

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

function getDefaultChord(musicalKey: MusicalKey, keyMode: 'major' | 'minor'): string {
  return `${musicalKey}${keyMode === 'minor' ? 'min' : 'maj'}`;
}

function getQualityModeGainMultiplier(qualityMode: PlaybackQualityMode): number {
  return qualityMode === 'studio' ? 0.12 : qualityMode === 'streaming' ? 0.095 : 0.08;
}

function getQualityModeVisualBoost(qualityMode: PlaybackQualityMode): number {
  return qualityMode === 'studio' ? 0.12 : qualityMode === 'streaming' ? 0.06 : 0.02;
}

function getChordRootFrequency(
  chordProgression: string[],
  stepIndex: number,
  musicalKey: MusicalKey,
  keyMode: 'major' | 'minor',
  pitch: number,
): number {
  const rootChord = chordProgression[Math.floor(stepIndex / 2) % chordProgression.length] ?? getDefaultChord(musicalKey, keyMode);
  const rootNote = rootChord.match(/^[A-G]#?/)?.[0] ?? musicalKey;
  return (NOTE_FREQUENCIES[rootNote] ?? NOTE_FREQUENCIES[musicalKey] ?? 261.63) * Math.pow(2, pitch / 12);
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
  const { record: forgeRecord } = useForgeActivity({ enginId: 'music' });

  // ── Daydream state persistence (Phase 8 §F Point 51) ──
  const { persistState } = useDaydreamState({ daydreamType: 'music', side: 'B' });

  // ── Daydream DB persistence with restore (Phase 8 §F pts 49, 51) ──
  type StarMakerState = { bpm?: number; musicalKey?: MusicalKey; keyMode?: 'major' | 'minor'; pitch?: number };
  const {
    savedState: savedMusicState,
    isRestoring: musicRestoring,
    persistState: persistMusicState,
  } = useDaydreamPersistence<StarMakerState>({ daydreamType: 'music' });

  const musicRestoredRef = useRef(false);

  // ── Supabase releases state ──
  const [releases,   setReleases]   = useState<MusicRelease[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  // ── Beat Maker state ──
  const [beatGrid, setBeatGrid] = useState<BeatGrid>(createEmptyBeatGrid);
  const [bpm,      setBpm]      = useState(120);
  const [qualityMode, setQualityMode] = useState<PlaybackQualityMode>('studio');

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

  // ── Restore workspace state from DB once on mount ──
  useEffect(() => {
    if (musicRestoring || musicRestoredRef.current || !savedMusicState) return;
    musicRestoredRef.current = true;
    if (savedMusicState.bpm !== undefined) setBpm(savedMusicState.bpm);
    if (savedMusicState.musicalKey)        setMusicalKey(savedMusicState.musicalKey);
    if (savedMusicState.keyMode)           setKeyMode(savedMusicState.keyMode);
    if (savedMusicState.pitch !== undefined) setPitch(savedMusicState.pitch);
  }, [musicRestoring, savedMusicState]);

  // ── Persist creative workspace state to Supabase (Phase 8 §F Point 51) ──
  useEffect(() => {
    if (musicRestoring) return;
    persistState({ side: 'B', bpm, musicalKey, keyMode, pitch });
    persistMusicState({ bpm, musicalKey, keyMode, pitch });
   
  }, [bpm, musicalKey, keyMode, pitch, musicRestoring]);

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
    forgeRecord('Published release');
    const supabase = createClient();
    const { error } = await supabase
      .from('music_releases')
      .update({ visibility: 'public' })
      .eq('id', releaseId);
    if (!error) {
      setReleases(prev =>
        prev.map(r => r.id === releaseId ? { ...r, visibility: 'public' } : r),
      );
      recordForgeTransfer('music', 'brand', 'release-publish', 'StarMaker release → BrandEngin');
    }
    setPublishing(null);
  }

  // ── Audio preview ref for beat-cell clicks (forward-ref pattern) ──
  // triggerPreviewVoice is defined later in this file; we use a ref so
  // toggleBeat (which must precede it) can still invoke it at call time.
  const triggerVoiceRef = useRef<((ch: number, step: number) => void) | null>(null);

  // ── Beat grid toggle ──
  const toggleBeat = useCallback((chIdx: number, stepIdx: number) => {
    triggerVoiceRef.current?.(chIdx, stepIdx);
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

  // ── Stem export — emits bridge events for each ready stem and writes to music_outputs ──
  const handlePrepareExport = useCallback(async () => {
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

    // Write to music_outputs table — Phase 8 §F Point 51 (real DB output record)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const stems = ready.map(({ key }) => key);
        const beat_grid = beatGrid;
        await supabase
          .from('music_outputs')
          .insert({
            user_id:     user.id,
            bpm,
            musical_key: `${musicalKey} ${keyMode}`,
            stems,
            beat_grid,
            mixer_state: mixer,
          });
      }
    } catch { /* non-blocking — export still completes */ }

    // Brief visual confirmation tick
    setTimeout(() => {
      setExportPending(false);
      setExportDone(true);
    }, 800);
    forgeRecord('Exported stems');
    recordForgeTransfer('music', 'games', 'audio-stems', 'StarMaker stems → GameEngin');
    recordForgeTransfer('music', 'create', 'audio-stems', 'StarMaker stems → CreateEngin');
  }, [stemReady, beatGrid, bpm, musicalKey, keyMode, mixer]);

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
  const [melodySuggestions, setMelodySuggestions] = useState<MelodySuggestion[]>([]);

  // ── Collab Studio state ──
  const [collabActive, setCollabActive] = useState(false);
  const [collabCode, setCollabCode] = useState('');

  // ── Playlist Manager state ──
  const [playlist, setPlaylist] = useState<Array<{ id: string; title: string; duration: string }>>([
    { id: 'pl-1', title: 'Summer Vibes', duration: '3:24' },
    { id: 'pl-2', title: 'Night Drive', duration: '4:01' },
    { id: 'pl-3', title: 'Morning Coffee', duration: '2:47' },
  ]);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackStep, setPlaybackStep] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ── Preset Library state ──
  const [presetGenreFilter, setPresetGenreFilter] = useState<string>('All');
  const [activePresetId,    setActivePresetId]    = useState<string | null>(null);
  const [activeTemplateId,  setActiveTemplateId]  = useState<string | null>(null);
  const [presetApplied,     setPresetApplied]     = useState(false);

  // ── External load request: fires when SoundRecorder sends a recording here ──
  const [externalLoadRequest, setExternalLoadRequest] = useState<{
    blob: Blob; name: string; mimeType: string;
  } | null>(null);

  // ── Piano Roll state ──
  const [pianoRollState, setPianoRollState] = useState<PianoRollState>(PIANO_ROLL_DEFAULTS);

  // ── Comping / Takes state ──
  const [compingState, setCompingState] = useState<CompingState>(() => createInitialCompingState(3));

  // ── Session View state ──
  const [sessionViewState, setSessionViewState] = useState<SessionViewState>(createInitialSessionView);

  const effectList = useMemo(() => Array.from(activeEffects), [activeEffects]);

  const playbackProfile = useMemo(() => summarizePlaybackProfile({
    beatGrid,
    bpm,
    mixer,
    activeEffects: effectList,
    qualityMode,
  }), [beatGrid, bpm, effectList, mixer, qualityMode]);

  const releaseStrategy = useMemo(() => buildReleaseStrategy({
    stemReady,
    releasesCount: releases.length,
    playlistCount: playlist.length,
    activeEffects: effectList,
    qualityMode,
    collabActive,
  }), [stemReady, releases.length, playlist.length, effectList, qualityMode, collabActive]);

  const buildPlaybackBars = useCallback((stepSeed: number) => (
    Array.from({ length: 32 }, (_, index) => {
      const channelIndex = index % BEAT_CHANNELS.length;
      const stepIndex = (stepSeed + Math.floor(index / 4)) % BEAT_STEPS;
      const channelLevel = [
        mixer.vocals,
        mixer.instruments,
        mixer.bass,
        mixer.fx,
      ][channelIndex] / 100;
      const beatActive = beatGrid[channelIndex][stepIndex];
      const qualityBoost = getQualityModeVisualBoost(qualityMode);
      const fxBoost = activeEffects.has('Reverb') || activeEffects.has('Delay') ? 0.05 : 0;
      const base = beatActive ? 0.5 + channelLevel * 0.35 : 0.12 + channelLevel * 0.08;
      return clamp(base + qualityBoost + fxBoost, 0.08, 1);
    })
  ), [activeEffects, beatGrid, mixer, qualityMode]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const audioWindow = window as Window & typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor = window.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume().catch(() => undefined);
    }
    return audioContextRef.current;
  }, []);

  const triggerPreviewVoice = useCallback((channelIndex: number, stepIndex: number) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const synthBase = getChordRootFrequency(chordProgression, stepIndex, musicalKey, keyMode, pitch);
    const mixLevels = [mixer.vocals, mixer.instruments, mixer.bass, mixer.fx];
    const oscillator = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const stereoPanner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    const channelGain = Math.max(0.025, mixLevels[channelIndex] / 100 * getQualityModeGainMultiplier(qualityMode));

    oscillator.type = channelIndex === 0 ? 'sine' : channelIndex === 1 ? 'triangle' : channelIndex === 2 ? 'square' : 'sawtooth';
    oscillator.frequency.setValueAtTime(
      channelIndex === 0 ? PREVIEW_VOICE_FREQUENCIES.kick :
      channelIndex === 1 ? PREVIEW_VOICE_FREQUENCIES.snare :
      channelIndex === 2 ? PREVIEW_VOICE_FREQUENCIES.hiHat :
      synthBase,
      now,
    );

    filter.type = activeEffects.has('Low-Pass') ? 'lowpass' : activeEffects.has('High-Pass') ? 'highpass' : 'peaking';
    filter.frequency.setValueAtTime(
      filter.type === 'lowpass' ? 1800 :
      filter.type === 'highpass' ? 120 :
      Math.max(440, synthBase * 2),
      now,
    );
    filter.gain.setValueAtTime(activeEffects.has('Chorus') ? 2.8 : 0, now);

    compressor.threshold.setValueAtTime(qualityMode === 'studio' ? -18 : qualityMode === 'streaming' ? -14 : -10, now);
    compressor.ratio.setValueAtTime(activeEffects.has('Limiter') ? 9 : 4, now);
    compressor.knee.setValueAtTime(qualityMode === 'studio' ? 16 : 8, now);

    const attack = channelIndex === 2 ? 0.002 : qualityMode === 'studio' ? 0.01 : 0.005;
    const release =
      (channelIndex === 2 ? 0.05 : channelIndex === 0 ? 0.18 : 0.24) +
      (activeEffects.has('Delay') ? 0.08 : 0) +
      (activeEffects.has('Reverb') ? 0.12 : 0);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(channelGain, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + release);

    if (stereoPanner) {
      const width = playbackProfile.stereoWidthPct / 100;
      stereoPanner.pan.setValueAtTime((-0.8 + channelIndex * 0.45) * width, now);
    }

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(compressor);
    if (stereoPanner) {
      compressor.connect(stereoPanner);
      stereoPanner.connect(ctx.destination);
    } else {
      compressor.connect(ctx.destination);
    }

    oscillator.start(now);
    oscillator.stop(now + release);

    if (qualityMode === 'studio' && channelIndex === 3) {
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(synthBase * 2, now);
      shimmer.detune.setValueAtTime(activeEffects.has('Chorus') ? 12 : 5, now);
      shimmerGain.gain.setValueAtTime(channelGain * 0.35, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + release + 0.08);
      shimmer.connect(shimmerGain);
      if (stereoPanner) {
        shimmerGain.connect(stereoPanner);
      } else {
        shimmerGain.connect(ctx.destination);
      }
      shimmer.start(now);
      shimmer.stop(now + release + 0.08);
    }
  }, [activeEffects, chordProgression, ensureAudioContext, keyMode, mixer, musicalKey, pitch, playbackProfile.stereoWidthPct, qualityMode]);

  // Keep triggerVoiceRef current so toggleBeat's BeatCell-click preview always
  // calls the latest version of triggerPreviewVoice (latest-ref pattern).
  triggerVoiceRef.current = triggerPreviewVoice;

  const playPreviewStep = useCallback((stepIndex: number) => {
    beatGrid.forEach((row, channelIndex) => {
      if (row[stepIndex]) triggerPreviewVoice(channelIndex, stepIndex);
    });
    setWaveformBars(buildPlaybackBars(stepIndex));
  }, [beatGrid, buildPlaybackBars, triggerPreviewVoice]);

  const visibleWaveformBars = useMemo(() => (
    playbackActive || waveformRecording
      ? waveformBars
      : buildPlaybackBars(playbackStep)
  ), [buildPlaybackBars, playbackActive, playbackStep, waveformBars, waveformRecording]);

  useEffect(() => {
    if (!playbackActive) return;

    const stepMs = Math.max(100, (60 / bpm) * (1000 / STEP_DIVISION_PER_BEAT));
    const timer = setInterval(() => {
      setPlaybackStep(prev => {
        const next = (prev + 1) % BEAT_STEPS;
        playPreviewStep(next);
        return next;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [bpm, playbackActive, playPreviewStep]);

  useEffect(() => () => {
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  }, []);

  // ── Waveform toggle handler ──
  function handleWaveformToggle() {
    const next = !waveformRecording;
    setWaveformRecording(next);
    if (next) setWaveformBars(buildPlaybackBars(playbackStep));
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:waveform-record', { recording: next },
    );
  }

  function handleTransportToggle() {
    if (playbackActive) {
      setPlaybackActive(false);
      setPlaybackStep(0);
      setWaveformBars(buildPlaybackBars(0));
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
        'music', 'music:preview-stop', { qualityMode },
      );
      return;
    }

    setPlaybackStep(0);
    playPreviewStep(0);
    setPlaybackActive(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:preview-start', {
        qualityMode,
        bpm,
        activeSteps: playbackProfile.activeSteps,
      },
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
      setMelodySuggestions(createMelodySuggestions({
        musicalKey,
        keyMode,
        bpm,
        pitch,
        chordProgression,
        activeEffects: effectList,
      }));
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
    forgeRecord('Saved playlist');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:playlist-save', { order: playlist.map(p => p.id) },
    );
  }

  // ── Preset Library handlers ──
  function handleApplyPreset(preset: BeatPreset) {
    setBeatGrid(preset.grid.map(row => [...row]));
    setBpm(clamp(preset.bpm, 60, 180));
    setMusicalKey(preset.key as MusicalKey);
    setKeyMode(preset.keyMode);
    setChordProgression([...preset.chordProgression]);
    setActiveEffects(new Set(preset.effects as EffectName[]));
    setActivePresetId(preset.id);
    setPresetApplied(true);
    setTimeout(() => setPresetApplied(false), 1800);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:preset-applied', { presetId: preset.id, genre: preset.genre },
    );
  }

  function handleApplyInstrument(inst: InstrumentPreset) {
    setMixer({ ...inst.mixer });
    setActiveEffects(new Set(inst.effects as EffectName[]));
    setPitch(inst.pitch);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'music', 'music:instrument-applied', { instrumentId: inst.id },
    );
  }

  function handleApplyTemplate(tmpl: ProjectTemplate) {
    handleApplyPreset(tmpl.preset);
    handleApplyInstrument(tmpl.instrument);
    setQualityMode(tmpl.qualityMode);
    setActiveTemplateId(tmpl.id);
  }

  // ── Listen for recordings sent from SoundRecorder via CustomEvent ──
  useEffect(() => {
    function handleRecordingEvent(e: Event) {
      const detail = (e as CustomEvent<{ blob: Blob; name: string; mimeType: string }>).detail;
      if (detail?.blob) setExternalLoadRequest({ ...detail });
    }
    window.addEventListener('starmaker:load-recording', handleRecordingEvent);
    return () => window.removeEventListener('starmaker:load-recording', handleRecordingEvent);
  }, []);

  // ── Project snapshot for JSON export (passed to DAWFileIOPanel) ──
  const projectSnapshot = useMemo(() => ({
    version: '1.0',
    bpm,
    musicalKey,
    keyMode,
    pitch,
    beatGrid,
    mixer,
    effects: Array.from(activeEffects),
    chordProgression,
    qualityMode,
    activePresetId,
  }), [bpm, musicalKey, keyMode, pitch, beatGrid, mixer, activeEffects, chordProgression, qualityMode, activePresetId]);


  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={DAW_STYLES.root}>
      {/* Transport Bar */}
      <DAWTransportBar
        bpm={bpm}
        playing={playbackActive}
        playbackStep={playbackStep}
        musicalKey={musicalKey}
        keyMode={keyMode}
        waveformRecording={waveformRecording}
        onBack={onBack}
        onTogglePlayback={handleTransportToggle}
        onWaveformRecord={handleWaveformToggle}
        onSkipToStart={() => { setPlaybackStep(0); setPlaybackActive(false); }}
        onChangeBpm={changeBpm}
      />

      <div style={{ paddingBottom: 80 }}>

        {/* Multi-Track Timeline */}
        <DAWMultiTrackPanel
          mixer={mixer}
          stemReady={stemReady}
          beatGrid={beatGrid}
          playbackStep={playbackStep}
          playing={playbackActive}
          visibleWaveformBars={visibleWaveformBars}
          waveformRecording={waveformRecording}
          onWaveformToggle={handleWaveformToggle}
        />

        {/* Stem Splitter */}
        <DAWStemSplitterPanel
          stemReady={stemReady}
          exportPending={exportPending}
          exportDone={exportDone}
          onToggleStem={toggleStem}
          onPrepareExport={handlePrepareExport}
        />

        {/* Pattern Sequencer */}
        <DAWPatternSequencer
          beatGrid={beatGrid}
          playbackStep={playbackStep}
          playing={playbackActive}
          qualityMode={qualityMode}
          profile={playbackProfile}
          bpm={bpm}
          onToggleBeat={toggleBeat}
          onTogglePlayback={handleTransportToggle}
          onQualityModeChange={setQualityMode}
          onChangeBpm={changeBpm}
          onBpmInput={handleBpmInput}
        />

        {/* Mixer + Effects */}
        <DAWMixerEffectsPanel
          mixer={mixer}
          activeEffects={activeEffects}
          onMixerChange={handleMixerChange}
          onToggleEffect={toggleEffect}
        />

        {/* ── Piano Roll MIDI Editor ── */}
        <PianoRollPanel
          state={pianoRollState}
          bpm={bpm}
          onStateChange={setPianoRollState}
        />

        {/* ── Session View (Ableton-style clip launcher) ── */}
        <SessionViewPanel
          state={sessionViewState}
          bpm={bpm}
          onStateChange={setSessionViewState}
        />

        {/* ── Comping / Takes Manager (Pro Tools-style) ── */}
        <CompingPanel
          state={compingState}
          onStateChange={setCompingState}
        />

        {/* Key / Pitch */}
        <DAWKeyPitchPanel
          bpm={bpm}
          musicalKey={musicalKey}
          keyMode={keyMode}
          pitch={pitch}
          onChangeBpm={changeBpm}
          onBpmInput={handleBpmInput}
          onKeyChange={setMusicalKey}
          onModeChange={setKeyMode}
          onPitchChange={setPitch}
        />

        {/* Chord Builder + AI Melody */}
        <DAWChordMelodyPanel
          progression={chordProgression}
          chordPlaying={chordPlaying}
          melodySuggestions={melodySuggestions}
          melodyLoading={melodyLoading}
          onChangeChord={(i, v) =>
            setChordProgression(prev => prev.map((c, idx) => (idx === i ? v : c)))
          }
          onChordPlay={handleChordPlay}
          onMelodyAsk={handleMelodyAsk}
        />

        {/* Release Command + Publishing */}
        <DAWReleasePanel
          strategy={releaseStrategy}
          releases={releases}
          loading={loading}
          publishing={publishing}
          onPublish={handlePublish}
        />

        {/* Collab + Playlist */}
        <DAWCollabPlaylistPanel
          collabActive={collabActive}
          collabCode={collabCode}
          playlist={playlist}
          onCollabToggle={handleCollabToggle}
          onPlaylistMove={movePlaylistItem}
          onPlaylistSave={handleSavePlaylist}
        />

        {/* ── NEW: Preset Library ── */}
        <DAWPresetLibraryPanel
          genreFilter={presetGenreFilter}
          activePresetId={activePresetId}
          activeTemplateId={activeTemplateId}
          presetApplied={presetApplied}
          onGenreChange={setPresetGenreFilter}
          onApplyPreset={handleApplyPreset}
          onApplyInstrument={handleApplyInstrument}
          onApplyTemplate={handleApplyTemplate}
        />

        {/* ── NEW: File Import / Export ── */}
        <DAWFileIOPanel
          bpm={bpm}
          externalLoad={externalLoadRequest}
          projectSnapshot={projectSnapshot}
          onExternalLoadConsumed={() => setExternalLoadRequest(null)}
        />

        {/* ── Journey Trail ── */}
        <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
          <div style={{ ...DAW_STYLES.sectionHeader }}>
            <Sparkles className="w-3 h-3" style={{ color: DAW.accent }} />
            <span style={DAW_STYLES.sectionTitle}>Journey</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <JourneyTrail compact />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Design Tokens
// ─────────────────────────────────────────────────────────────────────────────

const DAW = {
  bg:          '#0d0f17',
  surface:     '#141720',
  surfaceHi:   '#1c2030',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.14)',
  text:        '#e2e5ee',
  dim:         '#6e7585',
  accent:      '#00d0f0',
  red:         '#ef4444',
  green:       '#22c55e',
  orange:      '#f97316',
  purple:      '#a855f7',
  pink:        '#ec4899',
} as const;

const DAW_STYLES = {
  root: {
    background: '#0d0f17',
    minHeight: '100vh',
    color: '#e2e5ee',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#111420',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#6e7585',
  } as React.CSSProperties,
};

function dawPill(color: string): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 999,
    background: `${color}18`,
    color,
    border: `1px solid ${color}30`,
  };
}

function dawPickerStyle(color: string = DAW.accent): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${color}35`,
    background: '#0f1117',
    color: DAW.text,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.18)`,
  };
}

function dawDisclosureToggleStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: `1px solid ${active ? `${DAW.accent}32` : DAW.border}`,
    background: active
      ? 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.18))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
    color: active ? DAW.text : DAW.dim,
    cursor: 'pointer',
    boxShadow: active
      ? 'inset 0 2px 6px rgba(0,0,0,0.35)'
      : '0 10px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
  };
}

const dawDisclosureTrayStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: 12,
  background: 'linear-gradient(180deg, rgba(8,10,17,0.96), rgba(20,23,32,0.92))',
  border: `1px solid ${DAW.border}`,
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.32)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Track definitions (multi-track timeline)
// ─────────────────────────────────────────────────────────────────────────────

const STEM_TRACK_DEFS = [
  { key: 'original', label: 'Original Audio', color: '#00bcd4', icon: '🎵' },
  { key: 'vocals',   label: 'Vocals',         color: '#00d0c8', icon: '🎤' },
  { key: 'drums',    label: 'Drums',          color: '#c45bb8', icon: '🥁' },
  { key: 'bass',     label: 'Bass',           color: '#1a8fe0', icon: '🎸' },
  { key: 'guitar',   label: 'Guitar',         color: '#e07828', icon: '🎸' },
  { key: 'piano',    label: 'Piano',          color: '#5a8ee0', icon: '🎹' },
  { key: 'other',    label: 'Other',          color: '#7870e0', icon: '✨' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DAW Transport Bar
// ─────────────────────────────────────────────────────────────────────────────

interface DAWTransportBarProps {
  bpm: number;
  playing: boolean;
  playbackStep: number;
  musicalKey: MusicalKey;
  keyMode: 'major' | 'minor';
  waveformRecording: boolean;
  onBack: () => void;
  onTogglePlayback: () => void;
  onWaveformRecord: () => void;
  onSkipToStart: () => void;
  onChangeBpm: (delta: number) => void;
}

function DAWTransportBar({
  bpm, playing, playbackStep, musicalKey, keyMode, waveformRecording,
  onBack, onTogglePlayback, onWaveformRecord, onSkipToStart, onChangeBpm,
}: DAWTransportBarProps) {
  const bar  = Math.floor(playbackStep / 4) + 1;
  const beat = (playbackStep % 4) + 1;
  const tick = playbackStep % 2 === 0 ? '001' : '501';

  const divider = (
    <div style={{ width: 1, height: 26, background: DAW.border, flexShrink: 0 }} />
  );

  const btnBase: React.CSSProperties = {
    background: 'none', border: 'none', color: DAW.dim,
    cursor: 'pointer', padding: '0 10px', height: 48,
    flexShrink: 0, display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#141820',
      borderBottom: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', alignItems: 'center',
      height: 48, overflowX: 'auto',
    }}>
      {/* Back */}
      <button type="button" onClick={onBack} style={btnBase} aria-label="Back to Music Studio">
        <ArrowLeft className="w-4 h-4" />
      </button>

      {divider}

      {/* Transport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', flexShrink: 0 }}>
        <button type="button" onClick={onSkipToStart} title="Skip to start"
          style={{ background: 'none', border: 'none', color: DAW.dim, cursor: 'pointer', padding: '4px 5px', borderRadius: 4, fontSize: 14, lineHeight: 1 }}>
          ⏮
        </button>

        <button type="button" onClick={onTogglePlayback}
          aria-label={playing ? 'Stop' : 'Play'}
          style={{
            background: playing ? 'rgba(0,208,240,0.18)' : 'rgba(0,208,240,0.28)',
            border: `1px solid rgba(0,208,240,${playing ? 0.55 : 0.42})`,
            borderRadius: 6, width: 34, height: 27,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: DAW.accent, flexShrink: 0,
          }}>
          {playing
            ? <Pause className="w-3.5 h-3.5" />
            : <Play className="w-3.5 h-3.5" style={{ marginLeft: 1 }} />
          }
        </button>

        <button type="button" onClick={onWaveformRecord}
          aria-label={waveformRecording ? 'Stop recording' : 'Record'}
          style={{
            background: waveformRecording ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${waveformRecording ? 'rgba(239,68,68,0.55)' : DAW.border}`,
            borderRadius: 6, width: 28, height: 27,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: waveformRecording ? DAW.red : DAW.dim, flexShrink: 0,
            fontSize: 12, fontWeight: 900,
          }}>●</button>
      </div>

      {divider}

      {/* Position readout */}
      <div style={{
        background: '#090b12', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 5, padding: '3px 9px', margin: '0 8px',
        fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: DAW.accent,
        flexShrink: 0, letterSpacing: '0.06em',
      }}>
        {bar}&nbsp;{beat}&nbsp;{tick}
      </div>

      {/* BPM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginRight: 6 }}>
        <button type="button" onClick={() => onChangeBpm(-1)}
          style={{ background: 'none', border: 'none', color: DAW.dim, cursor: 'pointer', fontSize: 13, padding: '0 3px', lineHeight: 1 }}>−</button>
        <div style={{
          background: '#090b12', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 5, padding: '2px 7px', textAlign: 'center', minWidth: 40,
          fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: DAW.text,
        }}>{bpm}</div>
        <button type="button" onClick={() => onChangeBpm(1)}
          style={{ background: 'none', border: 'none', color: DAW.dim, cursor: 'pointer', fontSize: 13, padding: '0 3px', lineHeight: 1 }}>+</button>
        <span style={{ fontSize: 9, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>BPM</span>
      </div>

      {/* Time sig */}
      <div style={{
        background: '#090b12', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 5, padding: '2px 7px', marginRight: 8,
        fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: DAW.text, flexShrink: 0,
      }}>4/4</div>

      {divider}

      {/* Key */}
      <div style={{ ...dawPill(DAW.accent), margin: '0 8px', flexShrink: 0, fontSize: 11, fontWeight: 800 }}>
        {musicalKey}&nbsp;{keyMode === 'major' ? 'Maj' : 'min'}
      </div>

      <div style={{ marginLeft: 'auto', padding: '0 10px', flexShrink: 0 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'rgba(0,208,240,0.1)', borderRadius: 4, padding: '3px 7px',
          color: DAW.accent, border: 'rgba(0,208,240,0.2)',
        }}>StarMakerEngin</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Multi-Track Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWMultiTrackPanelProps {
  mixer: MixerState;
  stemReady: StemReadyState;
  beatGrid: BeatGrid;
  playbackStep: number;
  playing: boolean;
  visibleWaveformBars: number[];
  waveformRecording: boolean;
  onWaveformToggle: () => void;
}

function DAWMultiTrackPanel({
  mixer, stemReady, beatGrid, playbackStep, playing, waveformRecording,
}: DAWMultiTrackPanelProps) {
  const channelLevels: Record<string, number> = {
    original: 0.9,
    vocals:   mixer.vocals / 100,
    drums:    (mixer.instruments / 100 + mixer.bass / 100) / 2,
    bass:     mixer.bass / 100,
    guitar:   mixer.instruments / 100,
    piano:    mixer.instruments / 100 * 0.85,
    other:    mixer.fx / 100,
  };

  function makeWaveform(key: string, level: number, steps: number): number[] {
    const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: steps }, (_, i) => {
      const pseudo = Math.abs(Math.sin((seed * 7 + i * 1.618) * 2.399)) * level;
      return 0.08 + pseudo * 0.88;
    });
  }

  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      {/* Header */}
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Music className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Multi-Track Timeline</span>
        {playing && <span style={{ ...dawPill(DAW.green), marginLeft: 4 }}>● LIVE</span>}
        {waveformRecording && <span style={{ ...dawPill(DAW.red), marginLeft: 4 }}>● REC</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: DAW.dim }}>
          Step {playbackStep + 1} / {BEAT_STEPS}
        </span>
      </div>

      {/* Track lanes */}
      {STEM_TRACK_DEFS.map((track) => {
        const level = channelLevels[track.key] ?? 0.5;
        const waveform = makeWaveform(track.key, level, 48);
        const stemKey = track.key as keyof StemReadyState;
        const isStemReady = stemReady[stemKey] ?? false;
        const currentSegment = playing ? Math.floor((playbackStep / BEAT_STEPS) * waveform.length) : -1;

        return (
          <div key={track.key} style={{
            display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            height: 52,
          }}>
            {/* Track header */}
            <div style={{
              width: 130, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 10px',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              background: '#0f1118',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                background: `${track.color}22`,
                border: `1px solid ${track.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
              }}>
                {track.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: DAW.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}>{track.label}</div>
                {isStemReady && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: DAW.green }}>✓ Ready</span>
                )}
              </div>
            </div>

            {/* Waveform area */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              gap: 1, padding: '6px 8px', overflow: 'hidden',
              background: playing ? `${track.color}05` : 'transparent',
              position: 'relative',
            }}>
              {/* Playhead */}
              {playing && (
                <div style={{
                  position: 'absolute',
                  left: `${(playbackStep / BEAT_STEPS) * 100}%`,
                  top: 0, bottom: 0, width: 1,
                  background: `${track.color}90`,
                  zIndex: 2, transition: 'left 0.12s linear',
                  boxShadow: `0 0 6px ${track.color}`,
                }} />
              )}

              {waveform.map((h, i) => {
                const isPast = playing && i < currentSegment;
                const isCurrent = playing && i === currentSegment;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: 1,
                    height: `${Math.round(h * 100)}%`,
                    minHeight: 2, maxHeight: '100%',
                    background: isCurrent
                      ? track.color
                      : isPast
                        ? `${track.color}60`
                        : `${track.color}35`,
                    transition: 'background 0.15s, height 0.2s',
                    boxShadow: isCurrent ? `0 0 4px ${track.color}` : 'none',
                  }} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Stem Splitter Panel
// ─────────────────────────────────────────────────────────────────────────────

const STEM_SPLITTER_DEFS: Array<{ key: StemKey; label: string; icon: string; color: string }> = [
  { key: 'vocals', label: 'Vocals', icon: '🎤', color: '#00d0c8' },
  { key: 'drums',  label: 'Drums',  icon: '🥁', color: '#c45bb8' },
  { key: 'bass',   label: 'Bass',   icon: '🎸', color: '#1a8fe0' },
  { key: 'other',  label: 'Guitar', icon: '🎸', color: '#e07828' },
];

const EXTRA_STEMS = [
  { label: 'Piano', icon: '🎹', color: '#5a8ee0' },
  { label: 'Other', icon: '✨', color: '#7870e0' },
];

interface DAWStemSplitterPanelProps {
  stemReady: StemReadyState;
  exportPending: boolean;
  exportDone: boolean;
  onToggleStem: (key: StemKey) => void;
  onPrepareExport: () => void;
}

function DAWStemSplitterPanel({
  stemReady, exportPending, exportDone, onToggleStem, onPrepareExport,
}: DAWStemSplitterPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const anyChecked = Object.values(stemReady).some(Boolean);
  const allChecked = Object.values(stemReady).every(Boolean);

  function toggleAll() {
    const allKeys: StemKey[] = ['vocals', 'drums', 'bass', 'other'];
    if (allChecked) {
      allKeys.forEach(k => { if (stemReady[k]) onToggleStem(k); });
    } else {
      allKeys.forEach(k => { if (!stemReady[k]) onToggleStem(k); });
    }
  }

  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <button type="button" onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: '#111420',
          border: 'none', borderBottom: `1px solid ${DAW.border}`,
          cursor: 'pointer', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <Upload className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Stem Splitter</span>
        {exportDone && <span style={{ ...dawPill(DAW.green), marginLeft: 6 }}>✓ Queued</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: DAW.dim }}>{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          {/* Preset row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, padding: '8px 12px',
            background: DAW.surfaceHi, borderRadius: 8, border: `1px solid ${DAW.border}`,
          }}>
            <span style={{ fontSize: 12, color: DAW.dim }}>Preset</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: DAW.text }}>
                {allChecked ? 'Separate All Stems ✓' : 'Custom Selection'}
              </span>
              <button type="button" onClick={toggleAll} style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                border: `1px solid ${DAW.accent}40`,
                background: `${DAW.accent}15`, color: DAW.accent, cursor: 'pointer',
              }}>
                {allChecked ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Stem checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {STEM_SPLITTER_DEFS.map(({ key, label, icon, color }) => {
              const checked = stemReady[key];
              return (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: checked ? `${color}12` : DAW.surfaceHi,
                  border: `1px solid ${checked ? `${color}35` : DAW.border}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: `${color}20`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>{icon}</div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: checked ? color : DAW.text }}>
                    {label}
                  </span>
                  {checked && <span style={{ fontSize: 11, fontWeight: 700, color: DAW.green, flexShrink: 0 }}>Ready</span>}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleStem(key)}
                    aria-label={`Mark ${label} stem ready`}
                    style={{ width: 18, height: 18, accentColor: color, cursor: 'pointer', flexShrink: 0 }}
                  />
                </label>
              );
            })}

            {/* Extra visual stems (non-functional) */}
            {EXTRA_STEMS.map(({ label, icon, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
                opacity: 0.5,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: `${color}20`, border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>{icon}</div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: DAW.dim }}>{label}</span>
                <span style={{ fontSize: 10, color: DAW.dim }}>Connect service</span>
                <input type="checkbox" disabled style={{ width: 18, height: 18, cursor: 'not-allowed', flexShrink: 0 }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button"
              onClick={() => {
                const allKeys: StemKey[] = ['vocals', 'drums', 'bass', 'other'];
                allKeys.forEach(k => { if (stemReady[k]) onToggleStem(k); });
              }}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                border: `1px solid ${DAW.border}`,
                background: DAW.surfaceHi, color: DAW.dim,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
              Cancel
            </button>
            <button type="button" onClick={onPrepareExport}
              disabled={!anyChecked || exportPending}
              style={{
                flex: 2, padding: '10px', borderRadius: 8,
                border: `1px solid ${anyChecked && !exportPending ? `${DAW.accent}50` : DAW.border}`,
                background: anyChecked && !exportPending ? `${DAW.accent}20` : DAW.surfaceHi,
                color: anyChecked && !exportPending ? DAW.accent : DAW.dim,
                cursor: anyChecked && !exportPending ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 700, opacity: exportPending ? 0.6 : 1,
              }}>
              {exportPending ? 'Preparing…' : exportDone ? '✓ Applied' : 'Apply'}
            </button>
          </div>
          <p style={{ fontSize: 10, color: DAW.dim, marginTop: 8, textAlign: 'center' }}>
            Create an additional submix from deselected stems.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Pattern Sequencer
// ─────────────────────────────────────────────────────────────────────────────

const ARRANGEMENT_SECTIONS = [
  { label: 'Trap Beat 1',           color: '#00bcd4', width: 2 },
  { label: 'Trap Beat 2',           color: '#00a0b8', width: 2 },
  { label: 'Trap Beat 3',           color: '#008ea0', width: 2 },
  { label: 'Trap Beat 4',           color: '#006e80', width: 2 },
  { label: 'Bass Knocks 1',         color: '#7c4dbb', width: 1 },
  { label: 'Bass Knocks 2',         color: '#9a6dcc', width: 1 },
  { label: 'Bass Knocks 3',         color: '#6a3da8', width: 1 },
  { label: 'Bone Topper',           color: '#e0803a', width: 1 },
  { label: 'Computations Topper',   color: '#e09050', width: 2 },
] as const;

const SONG_SECTIONS = [
  { label: 'Intro',     width: 1 },
  { label: 'Verse',     width: 2 },
  { label: 'Hook',      width: 2 },
  { label: 'Breakdown', width: 2 },
] as const;

const PAD_CHANNEL_COLORS: Record<number, { on: string; glow: string }> = {
  0: { on: '#00bcd4', glow: 'rgba(0,188,212,0.4)'  },  // Kick   — cyan
  1: { on: '#ec407a', glow: 'rgba(236,64,122,0.4)' },  // Snare  — pink
  2: { on: '#ff9800', glow: 'rgba(255,152,0,0.4)'  },  // Hi-Hat — orange
  3: { on: '#7c4dff', glow: 'rgba(124,77,255,0.4)' },  // Synth  — purple
};

interface DAWPatternSequencerProps {
  beatGrid: BeatGrid;
  playbackStep: number;
  playing: boolean;
  qualityMode: PlaybackQualityMode;
  profile: ReturnType<typeof summarizePlaybackProfile>;
  bpm: number;
  onToggleBeat: (chIdx: number, stepIdx: number) => void;
  onTogglePlayback: () => void;
  onQualityModeChange: (mode: PlaybackQualityMode) => void;
  onChangeBpm: (delta: number) => void;
  onBpmInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function DAWPatternSequencer({
  beatGrid, playbackStep, playing, qualityMode, profile,
  onToggleBeat, onTogglePlayback, onQualityModeChange,
}: DAWPatternSequencerProps) {
  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      {/* Header */}
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Sparkles className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Beat Sequencer</span>
        <span style={{ ...dawPill(DAW.accent), marginLeft: 4 }}>
          {profile.activeSteps} hits · {profile.loopSeconds}s loop
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['idea', 'streaming', 'studio'] as const).map(mode => (
            <button key={mode} type="button" onClick={() => onQualityModeChange(mode)}
              style={{
                fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                border: `1px solid ${qualityMode === mode ? DAW.accent : DAW.border}`,
                background: qualityMode === mode ? `${DAW.accent}18` : 'transparent',
                color: qualityMode === mode ? DAW.accent : DAW.dim,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 12px 16px' }}>
        {/* Arrangement blocks — Logic Pro-style colored strips */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {ARRANGEMENT_SECTIONS.map((sec, i) => (
            <div key={i} style={{
              background: sec.color,
              borderRadius: 6,
              padding: '4px 6px',
              minWidth: sec.width * 52 + (sec.width - 1) * 3,
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              height: 52,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.02em', lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{sec.label}</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 18 }}>
                {Array.from({ length: 10 }, (_, j) => (
                  <div key={j} style={{
                    flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 1,
                    height: `${20 + Math.abs(Math.sin(i * 3.1 + j * 1.4)) * 70}%`,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Song section labels */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
          {SONG_SECTIONS.map((sec, i) => (
            <div key={i} style={{
              flex: sec.width,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 4, padding: '3px 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                {sec.label}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>∧</span>
            </div>
          ))}
        </div>

        {/* Beat grid header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${BEAT_STEPS}, 1fr)`,
          gap: 4, marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button type="button" onClick={onTogglePlayback}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: `1px solid ${playing ? 'rgba(0,208,240,0.5)' : DAW.border}`,
                background: playing ? 'rgba(0,208,240,0.18)' : DAW.surfaceHi,
                color: playing ? DAW.accent : DAW.dim,
                cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label={playing ? 'Stop' : 'Play'}>
              {playing ? '■' : '▶'}
            </button>
          </div>
          {Array.from({ length: BEAT_STEPS }, (_, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 9, fontWeight: 700,
              color: playing && playbackStep === i ? DAW.accent : DAW.dim,
              transition: 'color 0.1s',
            }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Channel rows — large colorful pads */}
        {BEAT_CHANNELS.map((ch, chIdx) => {
          const { on: onColor, glow } = PAD_CHANNEL_COLORS[chIdx];
          return (
            <div key={ch} style={{
              display: 'grid',
              gridTemplateColumns: `72px repeat(${BEAT_STEPS}, 1fr)`,
              gap: 4, marginBottom: 5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: onColor, opacity: 0.9 }} />
                <span style={{
                  fontSize: 11, fontWeight: 800, color: onColor,
                  letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{ch}</span>
              </div>
              {beatGrid[chIdx].map((active, stepIdx) => {
                const isCurrent = playing && playbackStep === stepIdx;
                return (
                  <button key={stepIdx} type="button"
                    onClick={() => onToggleBeat(chIdx, stepIdx)}
                    aria-label={`${ch} step ${stepIdx + 1} ${active ? 'on' : 'off'}`}
                    aria-pressed={active}
                    style={{
                      height: 36, borderRadius: 6,
                      border: active
                        ? `1.5px solid ${onColor}80`
                        : `1px solid rgba(255,255,255,0.07)`,
                      background: active
                        ? onColor
                        : isCurrent
                          ? `${onColor}22`
                          : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      boxShadow: active ? `0 2px 10px ${glow}, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
                      transform: active ? 'scale(0.94)' : 'scale(1)',
                      transition: 'all 0.1s',
                      outline: isCurrent && !active ? `2px solid ${onColor}40` : 'none',
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Velocity row */}
        <div style={{ marginTop: 8, padding: '8px 0 4px', borderTop: `1px solid ${DAW.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>
              Velocity / Value
            </span>
            <span style={{ fontSize: 9, color: DAW.dim }}>{profile.masteringLabel}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `72px repeat(${BEAT_STEPS}, 1fr)`,
            gap: 4, alignItems: 'flex-end', height: 28,
          }}>
            <div />
            {Array.from({ length: BEAT_STEPS }, (_, i) => {
              const anyActive = beatGrid.some(row => row[i]);
              const h = anyActive ? 40 + Math.abs(Math.sin(i * 1.7)) * 60 : 15;
              const chIdx = beatGrid.findIndex(row => row[i]);
              const color = chIdx >= 0 ? PAD_CHANNEL_COLORS[chIdx]?.on : DAW.dim;
              return (
                <div key={i} style={{
                  borderRadius: 2,
                  height: `${h}%`,
                  background: anyActive ? `${color}80` : 'rgba(255,255,255,0.06)',
                  alignSelf: 'flex-end',
                  transition: 'all 0.2s',
                }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Mixer + Effects Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWMixerEffectsPanelProps {
  mixer: MixerState;
  activeEffects: Set<EffectName>;
  onMixerChange: (ch: keyof MixerState, value: number) => void;
  onToggleEffect: (effect: EffectName) => void;
}

const DAW_MIXER_STRIPS: Array<{ key: keyof MixerState; label: string; color: string }> = [
  { key: 'vocals',      label: 'VOC',  color: '#00d0c8' },
  { key: 'instruments', label: 'INST', color: '#1a8fe0' },
  { key: 'bass',        label: 'BASS', color: '#a855f7' },
  { key: 'fx',          label: 'FX',   color: '#f97316' },
];

function DAWMixerEffectsPanel({ mixer, activeEffects, onMixerChange, onToggleEffect }: DAWMixerEffectsPanelProps) {
  const [mixExpanded, setMixExpanded] = useState(true);
  const [fxExpanded, setFxExpanded] = useState(false);

  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Sliders className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Mixer</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: DAW.dim }}>{activeEffects.size} FX active</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMixExpanded(prev => !prev)}
            aria-expanded={mixExpanded}
            style={dawDisclosureToggleStyle(mixExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>MIX CHANNELS</span>
              <span style={{ fontSize: 10, color: DAW.dim }}>Adjust vocals, instruments, bass, and FX levels</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: mixExpanded ? DAW.accent : DAW.dim }}>{mixExpanded ? '▼' : '▶'}</span>
            </div>
          </button>
          {mixExpanded && (
            <div style={dawDisclosureTrayStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {DAW_MIXER_STRIPS.map(({ key, label, color }) => (
                  <div key={key} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '10px 6px 8px',
                    background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
                    borderRadius: 10, gap: 5,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>{mixer[key]}</span>
                    <div style={{ width: 28, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <input type="range" min={0} max={100} value={mixer[key]}
                        onChange={e => onMixerChange(key, Number(e.target.value))}
                        aria-label={`${label} volume`}
                        style={{ width: 90, accentColor: color, transform: 'rotate(-90deg)', cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color, opacity: 0.85 }}>{label}</span>
                    <div style={{ width: '100%', height: 3, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 9999, width: `${mixer[key]}%`, background: color, transition: 'width 0.1s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => setFxExpanded(prev => !prev)}
            aria-expanded={fxExpanded}
            style={dawDisclosureToggleStyle(fxExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>FX CHAIN</span>
              <span style={{ fontSize: 10, color: DAW.dim }}>Expand to enable or disable effect tools</span>
              <span style={{ ...dawPill(activeEffects.size ? DAW.green : DAW.dim), marginLeft: 'auto', fontSize: 9 }}>
                {activeEffects.size} active
              </span>
              <span style={{ fontSize: 10, color: fxExpanded ? DAW.accent : DAW.dim }}>{fxExpanded ? '▼' : '▶'}</span>
            </div>
          </button>
          {fxExpanded && (
            <div style={dawDisclosureTrayStyle}>
              <div style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em', marginBottom: 8 }}>EFFECTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {EFFECT_LIST.map(effect => {
                  const on = activeEffects.has(effect);
                  return (
                    <button key={effect} type="button" onClick={() => onToggleEffect(effect)}
                      aria-pressed={on}
                      style={{
                        padding: '8px 4px', borderRadius: 7, cursor: 'pointer',
                        border: on ? `1.5px solid ${DAW.accent}60` : `1px solid ${DAW.border}`,
                        background: on ? `${DAW.accent}18` : DAW.surfaceHi,
                        color: on ? DAW.accent : DAW.dim,
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
                        textAlign: 'center', lineHeight: 1.3, transition: 'all 0.15s',
                      }}>
                      {effect}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Key / Pitch Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWKeyPitchPanelProps {
  bpm: number;
  musicalKey: MusicalKey;
  keyMode: 'major' | 'minor';
  pitch: number;
  onChangeBpm: (delta: number) => void;
  onBpmInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyChange: (key: MusicalKey) => void;
  onModeChange: (mode: 'major' | 'minor') => void;
  onPitchChange: (v: number) => void;
}

function DAWKeyPitchPanel({
  bpm, musicalKey, keyMode, pitch,
  onChangeBpm, onBpmInput, onKeyChange, onModeChange, onPitchChange,
}: DAWKeyPitchPanelProps) {
  const pitchColor = pitch === 0 ? DAW.dim : pitch > 0 ? DAW.green : DAW.red;
  const pickerStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 9,
    border: `1px solid ${DAW.border}`,
    background: '#0f1117',
    color: DAW.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  };
  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Radio className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Key / Tempo / Pitch</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Tempo */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em', marginBottom: 6 }}>TEMPO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {([-5, -1] as const).map(d => (
              <button key={d} type="button" onClick={() => onChangeBpm(d)}
                style={{ padding: '4px 8px', borderRadius: 5, border: `1px solid ${DAW.border}`, background: DAW.surfaceHi, color: DAW.dim, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                {d}
              </button>
            ))}
            <input type="number" value={bpm} min={60} max={180} onChange={onBpmInput}
              aria-label="BPM value"
              style={{
                flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 800,
                background: `${DAW.accent}10`, border: `1.5px solid ${DAW.accent}30`,
                borderRadius: 8, padding: '4px 8px', color: DAW.accent,
                minWidth: 0, MozAppearance: 'textfield',
              }}
            />
            {([1, 5] as const).map(d => (
              <button key={d} type="button" onClick={() => onChangeBpm(d)}
                style={{ padding: '4px 8px', borderRadius: 5, border: `1px solid ${DAW.border}`, background: DAW.surfaceHi, color: DAW.dim, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                +{d}
              </button>
            ))}
            <span style={{ fontSize: 10, fontWeight: 700, color: DAW.dim }}>BPM</span>
          </div>
        </div>

        {/* Key */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>KEY / SCALE PICKER</span>
            <span style={{ ...dawPill(DAW.accent), fontSize: 10 }}>
              {musicalKey} {keyMode}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>ROOT NOTE</span>
              <select
                value={musicalKey}
                onChange={event => onKeyChange(event.target.value as MusicalKey)}
                aria-label="Musical key"
                style={pickerStyle}
              >
                {MUSICAL_KEYS.map(keyOption => (
                  <option key={keyOption} value={keyOption}>
                    {keyOption}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>SCALE</span>
              <select
                value={keyMode}
                onChange={event => {
                  if (event.target.value !== keyMode) onModeChange(event.target.value as 'major' | 'minor');
                }}
                aria-label="Scale mode"
                style={pickerStyle}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </label>
          </div>
        </div>

        {/* Pitch */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mic2 className="w-3 h-3" style={{ color: DAW.accent }} /> PITCH SHIFT
            </span>
            <span style={{ ...dawPill(pitchColor), fontSize: 11, fontWeight: 800 }}>
              {pitch > 0 ? `+${pitch}` : pitch} st
            </span>
          </div>
          <input type="range" min={-12} max={12} step={1} value={pitch}
            onChange={e => onPitchChange(Number(e.target.value))}
            aria-label="Pitch semitone shift"
            style={{ width: '100%', accentColor: pitchColor, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: DAW.dim, marginTop: 3, padding: '0 2px' }}>
            <span>−12</span><span>−6</span><span style={{ fontWeight: 700 }}>0</span><span>+6</span><span>+12</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Chord + Melody Panel
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_CHORDS_DAW = [
  'Cmaj','Cmin','Dmaj','Dmin','Emaj','Emin',
  'Fmaj','Fmin','Gmaj','Gmin','Amaj','Amin','Bmaj','Bmin',
];

interface DAWChordMelodyPanelProps {
  progression: string[];
  chordPlaying: number | null;
  melodySuggestions: MelodySuggestion[];
  melodyLoading: boolean;
  onChangeChord: (index: number, value: string) => void;
  onChordPlay: (index: number) => void;
  onMelodyAsk: () => void;
}

function DAWChordMelodyPanel({
  progression, chordPlaying, melodySuggestions, melodyLoading,
  onChangeChord, onChordPlay, onMelodyAsk,
}: DAWChordMelodyPanelProps) {
  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Music className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Chord Builder + AI Melody</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {progression.map((chord, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 10,
              background: chordPlaying === i ? `${DAW.accent}12` : DAW.surfaceHi,
              border: `1px solid ${chordPlaying === i ? `${DAW.accent}40` : DAW.border}`,
              display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: DAW.dim }}>Slot {i + 1}</span>
              <select value={chord} onChange={e => onChangeChord(i, e.target.value)}
                aria-label={`Chord slot ${i + 1}`}
                style={{
                  padding: '4px 8px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${DAW.border}`,
                  background: '#0f1117', color: DAW.text, cursor: 'pointer',
                }}>
                {COMMON_CHORDS_DAW.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => onChordPlay(i)} aria-label={`Play ${chord}`}
                style={{
                  padding: '5px 0', borderRadius: 6, border: `1px solid ${DAW.border}`,
                  background: chordPlaying === i ? `${DAW.accent}18` : 'rgba(255,255,255,0.04)',
                  color: chordPlaying === i ? DAW.accent : DAW.dim,
                  fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {chordPlaying === i ? '▶ Playing…' : '▶ Play'}
              </button>
            </div>
          ))}
        </div>

        {melodySuggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {melodySuggestions.map(s => (
              <div key={s.title} style={{
                padding: '9px 12px', borderRadius: 10,
                background: `${DAW.accent}08`, border: `1px solid ${DAW.accent}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: DAW.text }}>{s.title}</span>
                  <span style={{ ...dawPill(DAW.accent), fontSize: 10 }}>{s.complexity}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: DAW.accent }}>{s.compatibilityScore}% fit</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: DAW.text, fontFamily: 'monospace' }}>{s.pattern}</div>
                <div style={{ fontSize: 11, color: DAW.dim, marginTop: 4 }}>{s.reason}</div>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onMelodyAsk} disabled={melodyLoading}
          style={{
            padding: '10px', borderRadius: 8,
            border: `1px solid ${DAW.accent}40`,
            background: `${DAW.accent}14`, color: DAW.accent,
            fontSize: 13, fontWeight: 700, cursor: melodyLoading ? 'not-allowed' : 'pointer',
            opacity: melodyLoading ? 0.6 : 1, transition: 'all 0.15s',
          }}>
          {melodyLoading ? '✨ Thinking…' : '✨ Ask Dr. Eams for Melody Ideas'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Release Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWReleasePanelProps {
  strategy: ReturnType<typeof buildReleaseStrategy>;
  releases: MusicRelease[];
  loading: boolean;
  publishing: string | null;
  onPublish: (id: string) => void;
}

function DAWReleasePanel({ strategy, releases, loading, publishing, onPublish }: DAWReleasePanelProps) {
  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Gauge className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Release Command</span>
        <span style={{ ...dawPill(strategy.score >= 75 ? DAW.green : DAW.accent), marginLeft: 6 }}>
          {strategy.score}/100
        </span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: DAW.surfaceHi, border: `1px solid ${DAW.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: DAW.text }}>{strategy.headline}</div>
          <div style={{ fontSize: 11, color: DAW.dim, marginTop: 4 }}>
            Build a release package that can move from prototype to launch.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DAW.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strengths</div>
            {(strategy.strengths.length > 0 ? strategy.strengths : ['Build momentum with stems, mastering, and playlists.']).map(item => (
              <div key={item} style={{ fontSize: 11, color: DAW.text, marginTop: 6 }}>• {item}</div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DAW.orange, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Fixes</div>
            {(strategy.blockers.length > 0 ? strategy.blockers : ['No blockers — move into launch mode.']).map(item => (
              <div key={item} style={{ fontSize: 11, color: DAW.text, marginTop: 6 }}>• {item}</div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em', marginBottom: 7 }}>YOUR RELEASES</div>
          {loading ? (
            <div style={{ fontSize: 12, color: DAW.dim, padding: '8px 0' }}>Loading releases…</div>
          ) : releases.length === 0 ? (
            <div style={{ fontSize: 12, color: DAW.dim, padding: '8px 0' }}>
              No releases yet.&nbsp;
              <Link href="/music/upload" style={{ color: DAW.accent }}>Upload your first track →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {releases.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
                }}>
                  <Radio className="w-3.5 h-3.5" style={{ color: DAW.accent, opacity: 0.7, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DAW.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {r.title}
                  </span>
                  {r.visibility === 'public' ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: DAW.green, flexShrink: 0 }}>✓ Live</span>
                  ) : (
                    <button type="button" onClick={() => onPublish(r.id)} disabled={publishing === r.id}
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, flexShrink: 0,
                        border: `1px solid ${DAW.accent}40`, background: `${DAW.accent}16`, color: DAW.accent,
                        cursor: publishing === r.id ? 'not-allowed' : 'pointer', opacity: publishing === r.id ? 0.6 : 1,
                      }}>
                      {publishing === r.id ? 'Publishing…' : 'Publish'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/music/upload" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px', borderRadius: 8, border: `1px solid ${DAW.border}`,
          background: DAW.surfaceHi, color: DAW.dim, fontSize: 12, textDecoration: 'none',
        }}>
          <Upload className="w-3.5 h-3.5" /> Upload New Release
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAW Collab + Playlist Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWCollabPlaylistPanelProps {
  collabActive: boolean;
  collabCode: string;
  playlist: Array<{ id: string; title: string; duration: string }>;
  onCollabToggle: () => void;
  onPlaylistMove: (index: number, dir: 'up' | 'down') => void;
  onPlaylistSave: () => void;
}

function DAWCollabPlaylistPanel({
  collabActive, collabCode, playlist, onCollabToggle, onPlaylistMove, onPlaylistSave,
}: DAWCollabPlaylistPanelProps) {
  return (
    <div style={{ background: DAW.surface }}>
      <div style={{ ...DAW_STYLES.sectionHeader }}>
        <Radio className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={DAW_STYLES.sectionTitle}>Collab Studio</span>
        {collabActive && <span style={{ ...dawPill(DAW.green) }}>Live</span>}
        <div style={{ margin: '0 8px', width: 1, height: 14, background: DAW.border }} />
        <Sliders className="w-3 h-3" style={{ color: DAW.accent }} />
        <span style={{ ...DAW_STYLES.sectionTitle, marginLeft: 6 }}>Playlist</span>
        <span style={{ ...dawPill(DAW.accent), marginLeft: 6 }}>{playlist.length} tracks</span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Collab */}
        <div>
          {collabActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                background: `${DAW.accent}08`, border: `1px solid ${DAW.accent}30`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: DAW.dim, marginBottom: 4 }}>ROOM CODE</div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.15em', color: DAW.accent, fontFamily: 'monospace' }}>
                  {collabCode}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Dr. Eams', 'Guest'].map(name => (
                  <div key={name} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 10, textAlign: 'center',
                    background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>👤</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: DAW.text }}>{name}</div>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: DAW.green, margin: '4px auto 0' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: DAW.dim }}>Start a shared session to co-produce in real time.</p>
          )}
          <button type="button" onClick={onCollabToggle}
            style={{
              width: '100%', marginTop: 10, padding: '10px', borderRadius: 8,
              border: `1px solid ${collabActive ? DAW.border : `${DAW.accent}40`}`,
              background: collabActive ? DAW.surfaceHi : `${DAW.accent}14`,
              color: collabActive ? DAW.dim : DAW.accent,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {collabActive ? 'End Session' : 'Start Collab Session'}
          </button>
        </div>

        {/* Playlist */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {playlist.map((track, i) => (
              <div key={track.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, minWidth: 16, textAlign: 'center' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DAW.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </span>
                <span style={{ fontSize: 11, color: DAW.dim, flexShrink: 0 }}>{track.duration}</span>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {(['up', 'down'] as const).map(dir => (
                    <button key={dir} type="button" onClick={() => onPlaylistMove(i, dir)}
                      disabled={dir === 'up' ? i === 0 : i === playlist.length - 1}
                      aria-label={`Move ${track.title} ${dir}`}
                      style={{
                        width: 22, height: 22, borderRadius: 5, border: `1px solid ${DAW.border}`,
                        background: DAW.surface, color: DAW.dim, fontSize: 9, cursor: 'pointer',
                        opacity: (dir === 'up' ? i === 0 : i === playlist.length - 1) ? 0.3 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {dir === 'up' ? '▲' : '▼'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={onPlaylistSave}
            style={{
              width: '100%', marginTop: 10, padding: '9px', borderRadius: 8,
              border: `1px solid ${DAW.accent}40`, background: `${DAW.accent}14`,
              color: DAW.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            Save Playlist Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: DAWPresetLibraryPanel
// ─────────────────────────────────────────────────────────────────────────────

interface DAWPresetLibraryPanelProps {
  genreFilter:      string;
  activePresetId:   string | null;
  activeTemplateId: string | null;
  presetApplied:    boolean;
  onGenreChange:    (g: string) => void;
  onApplyPreset:    (p: BeatPreset) => void;
  onApplyInstrument:(p: InstrumentPreset) => void;
  onApplyTemplate:  (t: ProjectTemplate) => void;
}

function DAWPresetLibraryPanel({
  genreFilter, activePresetId, activeTemplateId, presetApplied,
  onGenreChange, onApplyPreset, onApplyInstrument, onApplyTemplate,
}: DAWPresetLibraryPanelProps) {
  const [tab, setTab] = useState<'beats' | 'instruments' | 'templates'>('beats');

  const filteredBeats = genreFilter === 'All'
    ? BEAT_PRESETS
    : BEAT_PRESETS.filter(p => p.genre === genreFilter);

  const GENRE_COLORS: Record<string, string> = {
    Trap: '#00bcd4', Drill: '#ec407a', House: '#7c4dff', 'Deep House': '#3d85c8',
    'Lo-Fi': '#81c784', Reggaeton: '#f06292', Afrobeats: '#ffca28', Pop: '#a855f7',
    Rock: '#ef5350', 'Drum & Bass': '#ff7043', 'R&B': '#26c6da', Techno: '#b0bec5',
  };

  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}>
      <div style={{ ...DAW_STYLES.sectionHeader, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles className="w-3 h-3" style={{ color: DAW.accent }} />
          <span style={DAW_STYLES.sectionTitle}>Preset Library</span>
          {presetApplied && <span style={{ ...dawPill(DAW.green), fontSize: 9 }}>✓ Applied</span>}
        </div>
        <span style={{ fontSize: 9, color: DAW.dim }}>
          {BEAT_PRESETS.length} beats · {INSTRUMENT_PRESETS.length} instruments · {PROJECT_TEMPLATES.length} templates
        </span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${DAW.border}` }}>
        {(['beats', 'instruments', 'templates'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase',
              background: tab === t ? `${DAW.accent}14` : 'transparent',
              color: tab === t ? DAW.accent : DAW.dim,
              borderBottom: tab === t ? `2px solid ${DAW.accent}` : '2px solid transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {tab === 'beats' && (
          <>
            {/* Genre filter chips */}
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
              {(['All', ...GENRE_LIST]).map(g => (
                <button key={g} type="button" onClick={() => onGenreChange(g)}
                  style={{
                    flexShrink: 0, padding: '4px 10px', borderRadius: 999, fontSize: 10,
                    fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: genreFilter === g
                      ? (GENRE_COLORS[g] ?? DAW.accent)
                      : DAW.surfaceHi,
                    color: genreFilter === g ? '#fff' : DAW.dim,
                    transition: 'all 0.15s',
                  }}>
                  {g}
                </button>
              ))}
            </div>

            {/* Beat preset cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredBeats.map(preset => {
                const active = activePresetId === preset.id;
                const color = GENRE_COLORS[preset.genre] ?? DAW.accent;
                return (
                  <div key={preset.id} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: active ? `${color}14` : DAW.surfaceHi,
                    border: `1px solid ${active ? `${color}50` : DAW.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${color}22`, border: `1px solid ${color}40`,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '3px 4px', gap: 1,
                    }}>
                      {/* Mini grid preview */}
                      {preset.grid.map((row, ri) => (
                        <div key={ri} style={{ display: 'flex', gap: 1 }}>
                          {row.map((on, si) => (
                            <div key={si} style={{
                              flex: 1, height: 3, borderRadius: 1,
                              background: on ? color : 'rgba(255,255,255,0.1)',
                            }} />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: active ? color : DAW.text }}>
                          {preset.name}
                        </span>
                        <span style={{ ...dawPill(color), fontSize: 9 }}>{preset.genre}</span>
                      </div>
                      <div style={{ fontSize: 10, color: DAW.dim, lineHeight: 1.4 }}>
                        {preset.bpm} BPM · {preset.key} {preset.keyMode} · {preset.inspiredBy}
                      </div>
                    </div>
                    <button type="button" onClick={() => onApplyPreset(preset)}
                      style={{
                        flexShrink: 0, padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                        border: `1px solid ${active ? color : `${color}40`}`,
                        background: active ? `${color}25` : `${color}12`,
                        color: active ? color : DAW.dim,
                        fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                      }}>
                      {active ? '✓ Active' : 'Apply'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'instruments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {INSTRUMENT_PRESETS.map(inst => {
              const CAT_COLORS: Record<string, string> = {
                Synth: '#00bcd4', Drums: '#ec407a', Bass: '#7c4dff',
                Pad: '#26c6da', Lead: '#ffca28', FX: '#ef5350',
              };
              const color = CAT_COLORS[inst.category] ?? DAW.accent;
              return (
                <div key={inst.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ ...dawPill(color), fontSize: 9, flexShrink: 0 }}>{inst.category}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: DAW.text }}>{inst.name}</div>
                    <div style={{ fontSize: 10, color: DAW.dim, marginTop: 1 }}>{inst.description}</div>
                  </div>
                  <button type="button" onClick={() => onApplyInstrument(inst)}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                      border: `1px solid ${color}40`,
                      background: `${color}12`, color: DAW.dim,
                      fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    }}>
                    Load
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROJECT_TEMPLATES.map(tmpl => {
              const active = activeTemplateId === tmpl.id;
              return (
                <div key={tmpl.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: active ? `${DAW.accent}10` : DAW.surfaceHi,
                  border: `1px solid ${active ? `${DAW.accent}45` : DAW.border}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: active ? DAW.accent : DAW.text, flex: 1 }}>
                      {tmpl.name}
                    </span>
                    <span style={{ ...dawPill(DAW.accent), fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {tmpl.qualityMode}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: DAW.dim, marginBottom: 8 }}>{tmpl.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: DAW.dim }}>
                      {tmpl.bpm} BPM · {tmpl.key} {tmpl.keyMode}
                    </span>
                    <button type="button" onClick={() => onApplyTemplate(tmpl)}
                      style={{
                        padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${active ? DAW.accent : `${DAW.accent}40`}`,
                        background: active ? `${DAW.accent}22` : `${DAW.accent}12`,
                        color: active ? DAW.accent : DAW.dim,
                        fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                      }}>
                      {active ? '✓ Loaded' : 'Load Template'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// WAV encoder — convert AudioBuffer to downloadable WAV blob
// ─────────────────────────────────────────────────────────────────────────────

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, numCh, true); dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * blockAlign, true); dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: DAWFileIOPanel — Full DAW Sample Editor
//   • Self-contained: owns file input, AudioContext, AudioBuffer, playback
//   • Transport: Play/Pause/Stop/Loop + Volume
//   • Scrubable progress bar
//   • Click on waveform bar → seek to that sample position
//   • Drag on waveform → select region (highlighted)
//   • Real-time playhead cursor during playback
//   • Hover tooltip showing time position
//   • Sample operations: Trim, Fade In, Fade Out, Normalize, Reverse, Silence
//   • Receives SoundRecorder recordings via `externalLoad` prop
// ─────────────────────────────────────────────────────────────────────────────

interface DAWFileIOPanelProps {
  bpm: number;
  externalLoad: { blob: Blob; name: string; mimeType: string } | null;
  projectSnapshot: Record<string, unknown>;
  onExternalLoadConsumed: () => void;
}

const FIO_BARS = 96;  // number of waveform bars
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4] as const;
const ZOOM_LABELS: Record<number, string> = { 0.5: '½×', 0.75: '¾×', 1: '1×', 1.5: '1.5×', 2: '2×', 3: '3×', 4: '4×' };

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(2).padStart(5, '0');
  return `${m}:${rem}`;
}

function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildWaveform(buffer: AudioBuffer, bars: number): number[] {
  const raw = buffer.getChannelData(0);
  const chunkSize = Math.max(1, Math.floor(raw.length / bars));
  return Array.from({ length: bars }, (_, i) => {
    let sum = 0;
    for (let j = 0; j < chunkSize; j++) sum += Math.abs(raw[i * chunkSize + j] ?? 0);
    return Math.min(1, (sum / chunkSize) * 4.2);
  });
}

interface AudioStats {
  peakDb: number;
  rmsDb: number;
  crestDb: number;
  zeroCrossRate: number;
}

interface HistoryEntry {
  blob: Blob;
  name: string;
}

function computeAudioStats(buffer: AudioBuffer): AudioStats {
  let peak = 0;
  let sumSquares = 0;
  let samples = 0;
  let zeroCrossings = 0;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    let prev = data[0] ?? 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i] ?? 0;
      peak = Math.max(peak, Math.abs(sample));
      sumSquares += sample * sample;
      samples += 1;
      if ((sample >= 0 && prev < 0) || (sample < 0 && prev >= 0)) zeroCrossings += 1;
      prev = sample;
    }
  }

  const rms = samples > 0 ? Math.sqrt(sumSquares / samples) : 0;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const crestDb = Number.isFinite(peakDb - rmsDb) ? peakDb - rmsDb : 0;

  return {
    peakDb,
    rmsDb,
    crestDb,
    zeroCrossRate: samples > 0 ? zeroCrossings / samples : 0,
  };
}

function DAWFileIOPanel({ bpm, externalLoad, projectSnapshot, onExternalLoadConsumed }: DAWFileIOPanelProps) {
  // ── Audio state ──
  const [fileName,      setFileName]      = useState<string | null>(null);
  const [fileSize,      setFileSize]       = useState(0);
  const [duration,      setDuration]       = useState(0);
  const [sampleRate,    setSampleRate]     = useState(0);
  const [numChannels,   setNumChannels]    = useState(0);
  const [waveform,      setWaveform]       = useState<number[]>([]);
  const [audioStats,    setAudioStats]     = useState<AudioStats | null>(null);
  const [isImporting,   setIsImporting]    = useState(false);
  const [importErr,     setImportErr]      = useState<string | null>(null);

  // ── Playback state ──
  const [isPlaying,     setIsPlaying]      = useState(false);
  const [isLooping,     setIsLooping]      = useState(false);
  const [selectionLoop, setSelectionLoop]  = useState(false);
  const [volume,        setVolume]         = useState(0.85);
  const [playPos,       setPlayPos]        = useState(0);   // 0-1

  // ── Zoom ──
  const [zoomLevel,     setZoomLevel]      = useState(1);

  // ── Waveform interaction ──
  const [hoveredBar,    setHoveredBar]     = useState<number | null>(null);
  const [selStart,      setSelStart]       = useState<number | null>(null);   // bar indices
  const [selEnd,        setSelEnd]         = useState<number | null>(null);
  const [isDragging,    setIsDragging]     = useState(false);
  const [dragAnchor,    setDragAnchor]     = useState<number | null>(null);

  // ── Operation feedback ──
  const [opMsg,         setOpMsg]          = useState<string | null>(null);
  const [opPending,     setOpPending]      = useState(false);
  const [historyTick,   setHistoryTick]    = useState(0);
  const [playbackMode,  setPlaybackMode]   = useState<'full' | 'selection-once' | 'selection-loop'>('full');
  const [sourceLibrary, setSourceLibrary]  = useState<ArrangementSource[]>([]);
  const [arrTracks, setArrTracks]          = useState<ArrangementTrackState[]>(() => ARRANGEMENT_TRACKS.map(track => ({ ...track })));
  const [arrClips, setArrClips]            = useState<ArrangementClip[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [arrPlaying, setArrPlaying]        = useState(false);
  const [arrLooping, setArrLooping]        = useState(true);
  const [arrPlayheadBar, setArrPlayheadBar] = useState(0);

  // ── Refs ──
  const fileInputRef    = useRef<HTMLInputElement | null>(null);
  const waveformScrollRef = useRef<HTMLDivElement | null>(null);
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const audioBufRef     = useRef<AudioBuffer | null>(null);
  const audioBlobRef    = useRef<Blob | null>(null);
  const blobUrlRef      = useRef<string | null>(null);
  const playRafRef      = useRef<number>(0);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const undoStackRef    = useRef<HistoryEntry[]>([]);
  const redoStackRef    = useRef<HistoryEntry[]>([]);
  const arrangementBuffersRef = useRef<Record<string, AudioBuffer>>({});
  const arrangementSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const arrangementGainsRef   = useRef<GainNode[]>([]);
  const arrangementTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrangementPlayheadRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helper: get/create OfflineAudioContext for processing ──
  function getOfflineCtx(length: number, sr: number, ch: number) {
    return new OfflineAudioContext(ch, length, sr);
  }

  // ── Helper: show operation message ──
  function showOpMsg(msg: string) {
    setOpMsg(msg);
    setTimeout(() => setOpMsg(null), 3500);
  }

  // ── Helper: download a blob ──
  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function clampZoom(next: number) {
    return Math.max(0.5, Math.min(4, Math.round(next * 4) / 4));
  }

  function getCurrentHistoryEntry(): HistoryEntry | null {
    if (!audioBlobRef.current || !fileName) return null;
    return { blob: audioBlobRef.current, name: fileName };
  }

  function syncHistoryTick() {
    setHistoryTick(v => v + 1);
  }

  function pushHistory(ref: React.MutableRefObject<HistoryEntry[]>, entry: HistoryEntry) {
    ref.current.push(entry);
    if (ref.current.length > 24) ref.current.shift();
    syncHistoryTick();
  }

  function clearRedoStack() {
    if (redoStackRef.current.length > 0) {
      redoStackRef.current = [];
      syncHistoryTick();
    }
  }

  function syncWaveformViewport(targetBar: number, explicitZoom?: number) {
    const scroller = waveformScrollRef.current;
    if (!scroller || waveform.length === 0) return;
    const activeBarWidth = Math.max(3, Math.round(4 * (explicitZoom ?? zoomLevel))) + 1;
    const targetLeft = Math.max(0, targetBar * activeBarWidth - scroller.clientWidth * 0.2);
    scroller.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }

  function getBarSeconds() {
    return 240 / Math.max(60, bpm);
  }

  function captureCurrentToRack() {
    const currentBlob = audioBlobRef.current;
    const currentBuffer = audioBufRef.current;
    if (!fileName || !currentBlob || !currentBuffer) {
      showOpMsg('⚠ Load a decodable audio clip first');
      return;
    }

    const id = `src-${Date.now()}`;
    const color = ARRANGEMENT_SOURCE_COLORS[sourceLibrary.length % ARRANGEMENT_SOURCE_COLORS.length];
    arrangementBuffersRef.current[id] = currentBuffer;
    const entry: ArrangementSource = {
      id,
      name: fileName,
      durationSec: currentBuffer.duration,
      waveform: [...waveform],
      color,
    };
    setSourceLibrary(prev => [...prev, entry]);
    setSelectedSourceId(id);
    showOpMsg(`✓ Added ${fileName} to Source Rack`);
  }

  function placeArrangementClip(trackId: ArrangementTrackId, startBar: number) {
    const sourceId = selectedSourceId ?? sourceLibrary[0]?.id ?? null;
    if (!sourceId) {
      showOpMsg('⚠ Capture a clip into the Source Rack first');
      return;
    }
    const source = sourceLibrary.find(item => item.id === sourceId);
    if (!source) {
      showOpMsg('⚠ Selected source is unavailable');
      return;
    }
    const barLength = Math.max(1, Math.min(4, Math.ceil(source.durationSec / getBarSeconds())));
    const clip: ArrangementClip = {
      id: `clip-${Date.now()}-${Math.round(Math.random() * 999)}`,
      trackId,
      sourceId,
      label: source.name.replace(/\.[^.]+$/, ''),
      startBar: Math.max(0, Math.min(ARRANGEMENT_BARS - barLength, startBar)),
      barLength,
      gain: 1,
      color: source.color,
    };
    setArrClips(prev => [...prev, clip]);
    setSelectedClipId(clip.id);
    showOpMsg(`✓ Placed ${source.name} on ${arrTracks.find(track => track.id === trackId)?.label ?? trackId}`);
  }

  function updateSelectedClip(updater: (clip: ArrangementClip) => ArrangementClip | null) {
    if (!selectedClipId) {
      showOpMsg('⚠ Select an arrangement clip first');
      return;
    }
    setArrClips(prev => prev.flatMap(clip => {
      if (clip.id !== selectedClipId) return [clip];
      const next = updater(clip);
      return next ? [next] : [];
    }));
  }

  function stopArrangementPlayback(resetPlayhead = true) {
    arrangementSourcesRef.current.forEach(node => {
      try { node.stop(); } catch { /* already stopped */ }
    });
    arrangementSourcesRef.current = [];
    arrangementGainsRef.current.forEach(node => {
      try { node.disconnect(); } catch { /* ignore */ }
    });
    arrangementGainsRef.current = [];
    if (arrangementTimerRef.current) {
      clearTimeout(arrangementTimerRef.current);
      arrangementTimerRef.current = null;
    }
    if (arrangementPlayheadRef.current) {
      clearInterval(arrangementPlayheadRef.current);
      arrangementPlayheadRef.current = null;
    }
    setArrPlaying(false);
    if (resetPlayhead) setArrPlayheadBar(0);
  }

  // ── Load blob (from file input or external recording) ──
  const loadBlob = useCallback(async (blob: Blob, name: string) => {
    setImportErr(null);
    setIsImporting(true);
    setIsPlaying(false);
    setPlaybackMode('full');
    setSelectionLoop(false);
    setPlayPos(0);
    setSelStart(null); setSelEnd(null);

    // Revoke old blob URL
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(blob);
    audioBlobRef.current = blob;

    try {
      // Decode with Web Audio API
      if (!audioCtxRef.current) {
        const W = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
        const Ctor = window.AudioContext ?? W.webkitAudioContext;
        if (Ctor) audioCtxRef.current = new Ctor();
      }
      const ctx = audioCtxRef.current;
      let audioBuf: AudioBuffer | null = null;
      if (ctx) {
        const ab = await blob.arrayBuffer();
        audioBuf = await ctx.decodeAudioData(ab).catch(() => null);
      }

      if (audioBuf) {
        audioBufRef.current = audioBuf;
        setDuration(audioBuf.duration);
        setSampleRate(audioBuf.sampleRate);
        setNumChannels(audioBuf.numberOfChannels);
        setWaveform(buildWaveform(audioBuf, FIO_BARS));
        setAudioStats(computeAudioStats(audioBuf));
      } else {
        // Fallback: use HTML Audio for duration only, fake waveform
        audioBufRef.current = null;
        const tmpAudio = new Audio(blobUrlRef.current);
        await new Promise<void>(resolve => {
          tmpAudio.onloadedmetadata = () => { setDuration(tmpAudio.duration); resolve(); };
          tmpAudio.onerror = () => resolve();
        });
        setWaveform(Array.from({ length: FIO_BARS }, (_, i) => Math.abs(Math.sin(i * 0.38)) * 0.6 + 0.12));
        setSampleRate(44100); setNumChannels(1);
        setAudioStats(null);
      }

      setFileName(name);
      setFileSize(blob.size);

      // Set up HTML Audio element for playback
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      const audio = new Audio(blobUrlRef.current);
      audio.loop = isLooping;
      audio.volume = volume;
      audio.onended = () => { setIsPlaying(false); setPlayPos(0); cancelAnimationFrame(playRafRef.current); };
      audio.onerror = () => { setIsPlaying(false); setImportErr('Playback failed — format may be unsupported by this browser. Export as WAV instead.'); };
      audioRef.current = audio;

    } catch (err) {
      setImportErr(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsImporting(false);
  }, [isLooping, volume]);

  const restoreHistory = useCallback(async (direction: 'undo' | 'redo') => {
    const source = direction === 'undo' ? undoStackRef : redoStackRef;
    const target = direction === 'undo' ? redoStackRef : undoStackRef;
    const entry = source.current.pop();
    if (!entry) {
      showOpMsg(direction === 'undo' ? '⚠ Nothing to undo' : '⚠ Nothing to redo');
      return;
    }

    const current = getCurrentHistoryEntry();
    if (current) pushHistory(target, current);
    await loadBlob(entry.blob, entry.name);
    showOpMsg(direction === 'undo' ? `↺ Undo restored ${entry.name}` : `↻ Redo restored ${entry.name}`);
    syncHistoryTick();
  }, [loadBlob]);

  const applyProcessedBuffer = useCallback(async (
    nextBuffer: AudioBuffer,
    nextName: string,
    successMessage: string,
    options?: { download?: boolean; clearSelection?: boolean },
  ) => {
    const current = getCurrentHistoryEntry();
    if (current) pushHistory(undoStackRef, current);
    clearRedoStack();

    const wav = encodeWav(nextBuffer);
    if (options?.download !== false) downloadBlob(wav, nextName);
    await loadBlob(wav, nextName);
    if (options?.clearSelection !== false) {
      setSelStart(null);
      setSelEnd(null);
    }
    showOpMsg(successMessage);
  }, [loadBlob]);

  const startArrangementPlayback = useCallback(() => {
    if (!arrClips.length) {
      showOpMsg('⚠ Add clips to the arrangement first');
      return;
    }
    if (!audioCtxRef.current) {
      const W = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? W.webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) {
      showOpMsg('⚠ AudioContext unavailable');
      return;
    }
    stopArrangementPlayback(false);

    const soloTracks = new Set(arrTracks.filter(track => track.solo).map(track => track.id));
    const audibleTracks = new Set(
      arrTracks
        .filter(track => !track.muted && (soloTracks.size === 0 || soloTracks.has(track.id)))
        .map(track => track.id),
    );
    const barSeconds = getBarSeconds();
    const cycleSeconds = ARRANGEMENT_BARS * barSeconds;
    const startAt = ctx.currentTime + 0.05;

    for (const clip of arrClips) {
      if (!audibleTracks.has(clip.trackId)) continue;
      const buffer = arrangementBuffersRef.current[clip.sourceId];
      const track = arrTracks.find(item => item.id === clip.trackId);
      if (!buffer || !track) continue;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1.2, clip.gain * track.volume));
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      const clipDurationSec = Math.min(buffer.duration, clip.barLength * barSeconds);
      source.start(startAt + clip.startBar * barSeconds, 0, clipDurationSec);
      arrangementSourcesRef.current.push(source);
      arrangementGainsRef.current.push(gainNode);
    }

    const startedAt = performance.now();
    setArrPlaying(true);
    setArrPlayheadBar(0);
    arrangementPlayheadRef.current = setInterval(() => {
      const elapsedSec = (performance.now() - startedAt) / 1000;
      const bar = Math.min(ARRANGEMENT_BARS - 1, Math.floor(elapsedSec / barSeconds));
      setArrPlayheadBar(bar);
    }, 50);
    arrangementTimerRef.current = setTimeout(() => {
      if (arrLooping) {
        startArrangementPlayback();
      } else {
        stopArrangementPlayback();
      }
    }, cycleSeconds * 1000 + 80);
    showOpMsg(`✓ Arrangement preview ${arrLooping ? 'looping' : 'playing'} across ${ARRANGEMENT_BARS} bars`);
  }, [arrClips, arrLooping, arrTracks]);

  const toggleArrangementPlayback = useCallback(() => {
    if (arrPlaying) {
      stopArrangementPlayback();
      return;
    }
    startArrangementPlayback();
  }, [arrPlaying, startArrangementPlayback]);

  // ── React to external load (from SoundRecorder "Send to Editor") ──
  useEffect(() => {
    if (!externalLoad) return;
    loadBlob(externalLoad.blob, externalLoad.name);
    onExternalLoadConsumed();
   
  }, [externalLoad]);

  // ── Sync loop/volume to audio element ──
  useEffect(() => {
    if (audioRef.current) { audioRef.current.loop = isLooping && playbackMode === 'full'; }
  }, [isLooping, playbackMode]);
  useEffect(() => {
    if (audioRef.current) { audioRef.current.volume = volume; }
  }, [volume]);

  // ── Playback animation ──
  const animatePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    if (audio.duration && selStart !== null && selEnd !== null && playbackMode !== 'full') {
      const regionStart = (selStart / waveform.length) * audio.duration;
      const regionEnd = ((selEnd + 1) / waveform.length) * audio.duration;
      if (audio.currentTime >= regionEnd) {
        if (playbackMode === 'selection-loop') {
          audio.currentTime = regionStart;
        } else {
          audio.pause();
          setIsPlaying(false);
          setPlaybackMode('full');
          setPlayPos(regionEnd / audio.duration);
          cancelAnimationFrame(playRafRef.current);
          return;
        }
      }
    }
    if (audio.duration) setPlayPos(audio.currentTime / audio.duration);
    playRafRef.current = requestAnimationFrame(animatePlayback);
  }, [playbackMode, selEnd, selStart, waveform.length]);

  const clearSelection = useCallback(() => {
    setSelStart(null);
    setSelEnd(null);
    setSelectionLoop(false);
    if (playbackMode !== 'full') setPlaybackMode('full');
  }, [playbackMode]);

  const zoomToSelection = useCallback(() => {
    if (selStart === null || selEnd === null) return;
    const selectionBars = Math.max(1, selEnd - selStart + 1);
    const targetZoom = clampZoom(FIO_BARS / Math.max(selectionBars, 12));
    setZoomLevel(targetZoom);
    syncWaveformViewport(selStart, targetZoom);
  }, [selEnd, selStart]);

  const fitFullWaveform = useCallback(() => {
    setZoomLevel(1);
    waveformScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, []);

  const auditionSelection = useCallback((loop = false) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || selStart === null || selEnd === null) {
      showOpMsg('⚠ Select a region first');
      return;
    }
    const regionStart = (selStart / waveform.length) * audio.duration;
    audio.currentTime = regionStart;
    setPlaybackMode(loop ? 'selection-loop' : 'selection-once');
    audio.play().then(() => {
      setIsPlaying(true);
      animatePlayback();
    }).catch((err: Error) => {
      setImportErr(`Playback failed: ${err?.message || 'Try tapping play again after any user gesture.'}`);
    });
  }, [animatePlayback, selEnd, selStart, waveform.length]);

  // ── Keyboard shortcuts for faster DAW workflow ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      if (e.key === ' ' && !!fileName) {
        e.preventDefault();
        if (e.shiftKey && selStart !== null && selEnd !== null) {
          auditionSelection(selectionLoop);
          return;
        }
        togglePlay();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        void restoreHistory(e.shiftKey ? 'redo' : 'undo');
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        fitFullWaveform();
        return;
      }

      if (e.key.toLowerCase() === 'z' && !e.metaKey && !e.ctrlKey && selStart !== null && selEnd !== null) {
        e.preventDefault();
        zoomToSelection();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    auditionSelection,
    clearSelection,
    fileName,
    fitFullWaveform,
    restoreHistory,
    selEnd,
    selStart,
    selectionLoop,
    zoomToSelection,
  ]);

  // ── Transport: Play / Pause ──
  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !fileName) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setPlaybackMode('full');
      cancelAnimationFrame(playRafRef.current);
    } else {
      // If there's a selection and no current seek, start from selection start
      if (selStart !== null && audio.currentTime === 0 && audio.duration) {
        audio.currentTime = (selStart / waveform.length) * audio.duration;
      }
      setPlaybackMode('full');
      audio.play().then(() => {
        setIsPlaying(true);
        animatePlayback();
      }).catch((err: Error) => {
        setImportErr(`Playback failed: ${err?.message || 'Try tapping play again after any user gesture.'}`);
      });
    }
  }

  // ── Transport: Stop ──
  function handleStop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setPlaybackMode('full');
    setPlayPos(0);
    cancelAnimationFrame(playRafRef.current);
  }

  // ── Seek from progress bar click ──
  function handleSeekBar(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    setPlayPos(pct);
  }

  // ── Waveform: click to seek + drag to select ──
  function handleBarMouseDown(barIdx: number, e: React.MouseEvent) {
    e.preventDefault();
    setDragAnchor(barIdx);
    setIsDragging(true);
    setSelStart(barIdx); setSelEnd(barIdx);
    // Seek to this position
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (barIdx / waveform.length) * audio.duration;
      setPlayPos(barIdx / waveform.length);
    }
  }

  function handleBarMouseEnter(barIdx: number) {
    setHoveredBar(barIdx);
    if (isDragging && dragAnchor !== null) {
      const lo = Math.min(dragAnchor, barIdx);
      const hi = Math.max(dragAnchor, barIdx);
      setSelStart(lo); setSelEnd(hi);
    }
  }

  function handleBarMouseUp() {
    setIsDragging(false);
  }

  // ── Sample operation helpers ──

  function getSelectionBuffer(): AudioBuffer | null {
    const buf = audioBufRef.current;
    if (!buf) return null;
    const start = selStart !== null ? Math.floor((selStart / waveform.length) * buf.length) : 0;
    const end   = selEnd   !== null ? Math.floor(((selEnd + 1) / waveform.length) * buf.length) : buf.length;
    const len   = Math.max(1, end - start);
    // Create a copy of the region using OfflineAudioContext
    const result = getOfflineCtx(len, buf.sampleRate, buf.numberOfChannels);
    const src = result.createBufferSource();
    // Build offline buffer
    const offBuf = result.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      offBuf.copyToChannel(buf.getChannelData(ch).slice(start, start + len), ch);
    }
    src.buffer = offBuf;
    src.connect(result.destination);
    return offBuf;
  }

  async function handleTrim() {
    const trimBuf = getSelectionBuffer();
    if (!trimBuf) { showOpMsg('⚠ Load audio first'); return; }
    setOpPending(true);
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    await applyProcessedBuffer(
      trimBuf,
      `${baseName}-trimmed.wav`,
      '✓ Trimmed to selection — now editing trimmed clip',
    );
    setOpPending(false);
  }

  async function handleFadeIn() {
    const buf = audioBufRef.current;
    if (!buf) { showOpMsg('⚠ Load audio first'); return; }
    setOpPending(true);
    const start = selStart !== null ? Math.floor((selStart / waveform.length) * buf.length) : 0;
    const end   = selEnd   !== null ? Math.floor(((selEnd + 1) / waveform.length) * buf.length) : buf.length;
    const len   = end - start;
    const newBuf = audioCtxRef.current?.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate) ?? null;
    if (!newBuf) { showOpMsg('⚠ AudioContext unavailable'); setOpPending(false); return; }
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      for (let i = 0; i < buf.length; i++) {
        if (i >= start && i < end) {
          dst[i] = src[i] * ((i - start) / len);
        } else {
          dst[i] = src[i];
        }
      }
    }
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    await applyProcessedBuffer(newBuf, `${baseName}-fadein.wav`, '✓ Fade In applied + downloaded');
    setOpPending(false);
  }

  async function handleFadeOut() {
    const buf = audioBufRef.current;
    if (!buf) { showOpMsg('⚠ Load audio first'); return; }
    setOpPending(true);
    const start = selStart !== null ? Math.floor((selStart / waveform.length) * buf.length) : 0;
    const end   = selEnd   !== null ? Math.floor(((selEnd + 1) / waveform.length) * buf.length) : buf.length;
    const len   = end - start;
    const newBuf = audioCtxRef.current?.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate) ?? null;
    if (!newBuf) { showOpMsg('⚠ AudioContext unavailable'); setOpPending(false); return; }
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      for (let i = 0; i < buf.length; i++) {
        if (i >= start && i < end) {
          dst[i] = src[i] * (1 - (i - start) / len);
        } else {
          dst[i] = src[i];
        }
      }
    }
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    await applyProcessedBuffer(newBuf, `${baseName}-fadeout.wav`, '✓ Fade Out applied + downloaded');
    setOpPending(false);
  }

  async function handleNormalize() {
    const buf = audioBufRef.current;
    if (!buf) { showOpMsg('⚠ Load audio first'); return; }
    setOpPending(true);
    let peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    }
    const gain = peak > 0 ? 0.99 / peak : 1;
    const newBuf = audioCtxRef.current?.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate) ?? null;
    if (!newBuf) { showOpMsg('⚠ AudioContext unavailable'); setOpPending(false); return; }
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      for (let i = 0; i < buf.length; i++) dst[i] = src[i] * gain;
    }
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    const gainDb = (20 * Math.log10(gain)).toFixed(1);
    await applyProcessedBuffer(newBuf, `${baseName}-normalized.wav`, `✓ Normalized +${gainDb} dB — downloaded as WAV`);
    setOpPending(false);
  }

  async function handleReverse() {
    const buf = audioBufRef.current;
    if (!buf) { showOpMsg('⚠ Load audio first'); return; }
    setOpPending(true);
    const start = selStart !== null ? Math.floor((selStart / waveform.length) * buf.length) : 0;
    const end   = selEnd   !== null ? Math.floor(((selEnd + 1) / waveform.length) * buf.length) : buf.length;
    const newBuf = audioCtxRef.current?.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate) ?? null;
    if (!newBuf) { showOpMsg('⚠ AudioContext unavailable'); setOpPending(false); return; }
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      dst.set(src);
      // Reverse the selected region
      for (let lo = start, hi = end - 1; lo < hi; lo++, hi--) {
        [dst[lo], dst[hi]] = [dst[hi], dst[lo]];
      }
    }
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    await applyProcessedBuffer(newBuf, `${baseName}-reversed.wav`, '✓ Reversed — downloaded as WAV');
    setOpPending(false);
  }

  async function handleSilence() {
    const buf = audioBufRef.current;
    if (!buf) { showOpMsg('⚠ Load audio first'); return; }
    if (selStart === null) { showOpMsg('⚠ Select a region first (drag on waveform)'); return; }
    setOpPending(true);
    const start = Math.floor((selStart / waveform.length) * buf.length);
    const end   = Math.floor(((selEnd! + 1) / waveform.length) * buf.length);
    const newBuf = audioCtxRef.current?.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate) ?? null;
    if (!newBuf) { showOpMsg('⚠ AudioContext unavailable'); setOpPending(false); return; }
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = newBuf.getChannelData(ch);
      dst.set(src);
      for (let i = start; i < end; i++) dst[i] = 0;
    }
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    await applyProcessedBuffer(newBuf, `${baseName}-silenced.wav`, '✓ Region silenced — downloaded as WAV');
    setOpPending(false);
  }

  function handleExportAudio() {
    const buf = audioBufRef.current;
    if (!buf) {
      // Fall back to original blob
      if (audioBlobRef.current && fileName) {
        downloadBlob(audioBlobRef.current, fileName);
        showOpMsg(`✓ Downloaded: ${fileName}`);
      } else {
        showOpMsg('⚠ No audio loaded');
      }
      return;
    }
    const wav = encodeWav(buf);
    const baseName = (fileName ?? 'audio').replace(/\.[^.]+$/, '');
    downloadBlob(wav, `${baseName}.wav`);
    showOpMsg(`✓ Downloaded as WAV: ${baseName}.wav`);
  }

  function handleExportProject() {
    const snapshot = {
      ...projectSnapshot,
      arrangement: {
        bars: ARRANGEMENT_BARS,
        looping: arrLooping,
        selectedSourceId,
        tracks: arrTracks,
        sources: sourceLibrary.map(source => ({
          id: source.id,
          name: source.name,
          durationSec: source.durationSec,
          color: source.color,
        })),
        clips: arrClips,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `starmaker-project-${Date.now()}.json`);
    showOpMsg('✓ Project JSON exported');
    recordForgeTransfer('music', 'games', 'beat-pattern', 'StarMaker beat pattern → GameEngin');
  }

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      stopArrangementPlayback();
      cancelAnimationFrame(playRafRef.current);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch((err) => {
          console.warn('Sample editor audio context close skipped:', err);
        });
      }
    };
   
  }, []);

  // ── Computed display values ──
  const barWidth = Math.max(3, Math.round(4 * zoomLevel));
  const playheadBar = Math.floor(playPos * waveform.length);

  const hasSelection = selStart !== null && selEnd !== null;
  const selDuration = hasSelection
    ? ((selEnd! - selStart! + 1) / waveform.length) * duration
    : 0;
  const selStartSec = hasSelection ? (selStart! / waveform.length) * duration : 0;
  const selEndSec = hasSelection ? selStartSec + selDuration : 0;
  const selectionCoveragePct = hasSelection ? ((selEnd! - selStart! + 1) / waveform.length) * 100 : 0;

  const hoveredTime = hoveredBar !== null
    ? (hoveredBar / waveform.length) * duration
    : null;

  const hasAudio = !!fileName;
  const undoDepth = undoStackRef.current.length;
  const redoDepth = redoStackRef.current.length;
  return (
    <div style={{ background: DAW.surface, borderBottom: `1px solid ${DAW.border}` }}
      onMouseUp={handleBarMouseUp}
      onMouseLeave={() => { handleBarMouseUp(); setHoveredBar(null); }}>

      {/* ── Header ── */}
      <div style={{ ...DAW_STYLES.sectionHeader, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileAudio className="w-3 h-3" style={{ color: DAW.accent }} />
          <span style={DAW_STYLES.sectionTitle}>Sample Editor</span>
          {fileName && <span style={{ ...dawPill(DAW.green), fontSize: 9 }}>Loaded</span>}
          {externalLoad && <span style={{ ...dawPill(DAW.orange), fontSize: 9, animation: 'pulse 1s infinite' }}>Incoming ↗</span>}
        </div>
        <span style={{ fontSize: 9, color: DAW.dim }}>WAV · MP3 · OGG · FLAC · AAC</span>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Import / Export buttons ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: isImporting ? 'not-allowed' : 'pointer',
              border: `1px solid ${DAW.accent}40`, background: `${DAW.accent}12`,
              color: DAW.accent, fontSize: 13, fontWeight: 700, opacity: isImporting ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s',
            }}>
            <FolderOpen className="w-4 h-4" />
            {isImporting ? 'Decoding…' : hasAudio ? 'Re-Import' : 'Import Audio'}
          </button>

          <button type="button" onClick={handleExportAudio}
            disabled={!hasAudio}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: hasAudio ? 'pointer' : 'not-allowed',
              border: `1px solid rgba(34,197,94,0.35)`, background: 'rgba(34,197,94,0.1)',
              color: DAW.green, fontSize: 13, fontWeight: 700, opacity: hasAudio ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s',
            }}>
            <Download className="w-4 h-4" />
            {hasSelection ? 'Export Selection' : 'Export WAV'}
          </button>

          <button type="button" onClick={handleExportProject}
            title="Export project as JSON"
            style={{
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${DAW.border}`, background: DAW.surfaceHi,
              color: DAW.dim, fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file"
          accept="audio/wav,audio/mp3,audio/mpeg,audio/ogg,audio/flac,audio/aac,audio/mp4,.wav,.mp3,.ogg,.flac,.aac,.m4a"
          aria-label="Import audio file for editing"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await loadBlob(f, f.name);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />

        {/* ── Error / status messages ── */}
        {importErr && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, lineHeight: 1.5,
            background: 'rgba(239,68,68,0.1)', color: DAW.red, border: `1px solid rgba(239,68,68,0.25)`,
          }}>⚠️ {importErr}</div>
        )}
        {opMsg && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: opMsg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.08)',
            color: opMsg.startsWith('✓') ? DAW.green : '#f59e0b',
            border: `1px solid ${opMsg.startsWith('✓') ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.2)'}`,
          }}>{opMsg}</div>
        )}

        {/* ── File metadata ── */}
        {hasAudio && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <FileAudio className="w-4 h-4" style={{ color: DAW.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: DAW.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
            {[
              fmtSec(duration),
              `${sampleRate ? (sampleRate / 1000).toFixed(1) + 'kHz' : '—'}`,
              numChannels === 2 ? 'Stereo' : numChannels === 1 ? 'Mono' : `${numChannels}ch`,
              fmtFileSize(fileSize),
            ].map(v => (
              <span key={v} style={{ ...dawPill(DAW.dim), fontSize: 9, flexShrink: 0 }}>{v}</span>
            ))}
          </div>
        )}

        {/* ── Production stats ── */}
        {hasAudio && audioStats && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(0,0,0,0.16)', border: `1px solid ${DAW.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: DAW.dim }}>
              MASTER READOUT
            </span>
            <span style={{ ...dawPill(DAW.red), fontSize: 9 }}>Peak {audioStats.peakDb.toFixed(1)} dBFS</span>
            <span style={{ ...dawPill(DAW.accent), fontSize: 9 }}>RMS {audioStats.rmsDb.toFixed(1)} dBFS</span>
            <span style={{ ...dawPill(DAW.purple), fontSize: 9 }}>Crest {audioStats.crestDb.toFixed(1)} dB</span>
            <span style={{ ...dawPill(DAW.orange), fontSize: 9 }}>Zero-cross {(audioStats.zeroCrossRate * 100).toFixed(2)}%</span>
            {hasSelection && (
              <span style={{ ...dawPill(DAW.green), fontSize: 9 }}>Selection {selectionCoveragePct.toFixed(1)}%</span>
            )}
          </div>
        )}

        {/* ── Transport controls ── */}
        {hasAudio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Transport row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Play/Pause */}
              <button type="button" onClick={togglePlay}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: isPlaying ? DAW.red : DAW.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying
                  ? <Pause className="w-5 h-5 fill-current" />
                  : <Play  className="w-5 h-5 fill-current" style={{ marginLeft: 2 }} />
                }
              </button>

              {/* Stop */}
              <button type="button" onClick={handleStop}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: `1px solid ${DAW.border}`,
                  cursor: 'pointer', background: DAW.surfaceHi, color: DAW.dim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                aria-label="Stop">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'currentColor' }} />
              </button>

              {/* Loop toggle */}
              <button type="button" onClick={() => setIsLooping(p => !p)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${isLooping ? DAW.accent : DAW.border}`,
                  cursor: 'pointer', background: isLooping ? `${DAW.accent}18` : DAW.surfaceHi,
                  color: isLooping ? DAW.accent : DAW.dim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0, transition: 'all 0.15s',
                }}
                aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
                title="Loop">
                ↺
              </button>

              {/* Time display */}
              <div style={{ flex: 1, textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: DAW.dim }}>
                <span style={{ color: DAW.text, fontWeight: 700 }}>{fmtSec(playPos * duration)}</span>
                {' / '}{fmtSec(duration)}
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: DAW.dim, fontWeight: 700 }}>VOL</span>
                <input type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  aria-label="Playback volume"
                  style={{ width: 60, accentColor: DAW.accent, cursor: 'pointer' }} />
                <span style={{ fontSize: 9, color: DAW.dim, fontFamily: 'monospace', width: 28 }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>

            {/* Workflow row */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }} data-history-tick={historyTick}>
              {[
                {
                  label: `Undo ${undoDepth ? `(${undoDepth})` : ''}`.trim(),
                  action: () => void restoreHistory('undo'),
                  enabled: undoDepth > 0,
                  color: DAW.orange,
                  title: 'Undo last destructive audio edit (Ctrl/Cmd+Z)',
                },
                {
                  label: `Redo ${redoDepth ? `(${redoDepth})` : ''}`.trim(),
                  action: () => void restoreHistory('redo'),
                  enabled: redoDepth > 0,
                  color: DAW.orange,
                  title: 'Redo reverted audio edit (Shift+Ctrl/Cmd+Z)',
                },
                {
                  label: 'Audition Sel',
                  action: () => auditionSelection(false),
                  enabled: hasSelection,
                  color: DAW.accent,
                  title: 'Play just the selected region once (Shift+Space)',
                },
                {
                  label: selectionLoop ? 'Loop Sel On' : 'Loop Sel',
                  action: () => {
                    const next = !selectionLoop;
                    setSelectionLoop(next);
                    if (hasSelection && next) auditionSelection(true);
                    if (!next && playbackMode === 'selection-loop') setPlaybackMode('full');
                  },
                  enabled: hasSelection,
                  color: DAW.purple,
                  title: 'Loop the selected region while auditioning',
                },
                {
                  label: 'Zoom Sel',
                  action: zoomToSelection,
                  enabled: hasSelection,
                  color: DAW.green,
                  title: 'Zoom into the selected region (Z)',
                },
                {
                  label: 'Fit Full',
                  action: fitFullWaveform,
                  enabled: true,
                  color: DAW.dim,
                  title: 'Reset zoom and fit the whole clip (F)',
                },
                {
                  label: 'Clear Sel',
                  action: clearSelection,
                  enabled: hasSelection,
                  color: DAW.red,
                  title: 'Clear selected region (Esc)',
                },
              ].map(control => (
                <button
                  key={control.label}
                  type="button"
                  onClick={control.action}
                  disabled={!control.enabled}
                  title={control.title}
                  style={{
                    padding: '6px 10px', borderRadius: 8,
                    cursor: control.enabled ? 'pointer' : 'not-allowed',
                    border: `1px solid ${control.color}35`,
                    background: `${control.color}${control.enabled ? '12' : '08'}`,
                    color: control.enabled ? control.color : DAW.dim,
                    fontSize: 10, fontWeight: 700,
                    opacity: control.enabled ? 1 : 0.45,
                    transition: 'all 0.15s',
                  }}
                >
                  {control.label}
                </button>
              ))}
            </div>

            {/* Progress bar (scrubable) */}
            <div
              role="slider"
              aria-label="Playback position"
              aria-valuenow={Math.round(playPos * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onClick={handleSeekBar}
              style={{
                height: 8, borderRadius: 999, cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden',
              }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${playPos * 100}%`,
                background: `linear-gradient(90deg, ${DAW.accent} 0%, ${DAW.purple} 100%)`,
                borderRadius: 999, transition: isPlaying ? 'none' : 'width 0.1s',
              }} />
              {/* Playhead pip */}
              <div style={{
                position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                left: `${playPos * 100}%`,
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff', border: `2px solid ${DAW.accent}`,
                transition: isPlaying ? 'none' : 'left 0.1s',
              }} />
            </div>
          </div>
        )}

        {/* ── Zoom controls ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ZoomOut className="w-3 h-3" style={{ color: DAW.dim }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em' }}>ZOOM</span>
              <ZoomIn className="w-3 h-3" style={{ color: DAW.dim }} />
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {ZOOM_LEVELS.map(z => (
                <button key={z} type="button" onClick={() => setZoomLevel(z)}
                  style={{
                    padding: '3px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700,
                    cursor: 'pointer', border: `1px solid ${zoomLevel === z ? DAW.accent : DAW.border}`,
                    background: zoomLevel === z ? `${DAW.accent}18` : 'transparent',
                    color: zoomLevel === z ? DAW.accent : DAW.dim, transition: 'all 0.12s',
                  }}>
                  {ZOOM_LABELS[z]}
                </button>
              ))}
            </div>
          </div>
          <input type="range" min={0.5} max={4} step={0.25} value={zoomLevel}
            onChange={e => setZoomLevel(Number(e.target.value))}
            aria-label="Timeline zoom level"
            style={{ width: '100%', accentColor: DAW.accent, cursor: 'pointer', marginBottom: 6 }}
          />
        </div>

        {/* ── Waveform / Sample Editor ── */}
        <div style={{ borderRadius: 8, background: '#090b12', border: `1px solid ${DAW.border}`, overflow: 'hidden', position: 'relative', userSelect: 'none' }}>

          {/* Time ruler */}
          <div style={{ display: 'flex', height: 14, background: '#0d0f17', borderBottom: `1px solid ${DAW.border}` }}>
            {Array.from({ length: 8 }, (_, i) => {
              const t = duration ? fmtSec((i / 8) * duration) : `${i + 1}`;
              return (
                <div key={i} style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  borderLeft: i > 0 ? `1px solid ${DAW.border}` : 'none',
                  paddingLeft: 3,
                  fontSize: 7, fontWeight: 700, color: DAW.dim, fontFamily: 'monospace',
                }}>
                  {t}
                </div>
              );
            })}
          </div>

          {/* Scrollable waveform */}
          <div ref={waveformScrollRef} style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 1,
                height: 72, padding: '4px 6px',
                minWidth: `${barWidth * waveform.length + waveform.length}px`,
                position: 'relative', cursor: 'crosshair',
              }}>

              {/* Render bars */}
              {(waveform.length > 0 ? waveform : Array.from({ length: FIO_BARS }, (_, i) => Math.abs(Math.sin(i * 0.42)) * 0.55 + 0.08)).map((h, i) => {
                const inSel = hasSelection && i >= selStart! && i <= selEnd!;
                const isPlayhead = i === playheadBar && isPlaying;
                const isHovered = i === hoveredBar;

                let barColor: string;
                if (isPlayhead) {
                  barColor = '#ffffff';
                } else if (inSel) {
                  barColor = `rgba(168,85,247,${0.55 + h * 0.45})`;
                } else if (isHovered) {
                  barColor = `rgba(0,208,240,${0.7 + h * 0.3})`;
                } else if (waveform.length > 0) {
                  barColor = `rgba(0,208,240,${0.3 + h * 0.7})`;
                } else {
                  barColor = `rgba(0,208,240,${0.15 + h * 0.25})`;
                }

                return (
                  <div
                    key={i}
                    onMouseDown={(e) => handleBarMouseDown(i, e)}
                    onMouseEnter={() => handleBarMouseEnter(i)}
                    title={duration ? `${fmtSec((i / waveform.length) * duration)} — Click to seek, Drag to select` : 'Click to seek'}
                    style={{
                      width: barWidth, borderRadius: 1, flexShrink: 0,
                      background: barColor,
                      height: `${Math.round(Math.max(6, h * 96))}%`,
                      cursor: 'pointer',
                      transition: 'background 0.05s, height 0.15s',
                      outline: isPlayhead ? `1px solid white` : 'none',
                    }}
                  />
                );
              })}

              {/* Playhead line overlay */}
              {isPlaying && waveform.length > 0 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(playPos * 100)}%`,
                  width: 1.5, background: DAW.accent,
                  pointerEvents: 'none',
                  boxShadow: `0 0 4px ${DAW.accent}`,
                  transition: 'none',
                }} />
              )}
            </div>
          </div>

          {/* Empty state overlay */}
          {waveform.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
              background: 'rgba(9,11,18,0.80)', pointerEvents: 'none',
            }}>
              <FileAudio className="w-6 h-6" style={{ color: `${DAW.accent}60` }} />
              <span style={{ fontSize: 11, color: DAW.dim, textAlign: 'center', padding: '0 20px' }}>
                Import an audio file to edit it here
                <br />
                <span style={{ fontSize: 9, opacity: 0.7 }}>Or tap ⚡ DAW in the Recorder to send a take directly</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Waveform info row (hover + selection) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: DAW.dim }}>
          <span>
            {hoveredTime !== null
              ? `🕐 ${fmtSec(hoveredTime)} — click to seek · drag to select`
              : hasAudio ? 'Click bar to seek · Drag to select region · Shift+Space audition · Ctrl/Cmd+Z undo' : 'Zoom: ' + zoomLevel + '×'}
          </span>
          {hasSelection && (
            <span style={{ color: DAW.purple, fontWeight: 700 }}>
              ◀ {fmtSec(selStartSec)} → {fmtSec(selEndSec)} ({fmtSec(selDuration)}) ▶
            </span>
          )}
        </div>

        {/* ── Sample Operations Toolbar ── */}
        {hasAudio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: DAW.dim, letterSpacing: '0.08em', marginBottom: 2 }}>
              SAMPLE OPERATIONS {hasSelection ? `· selection: ${fmtSec(selDuration)}` : '· (select region to target)'}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { label: 'Trim',       icon: '✂',  action: handleTrim,      color: DAW.accent,  title: 'Trim to selection (or full file). Downloads trimmed WAV.' },
                { label: 'Fade In',    icon: '↗',  action: handleFadeIn,    color: DAW.green,   title: 'Apply linear fade-in to selection (or full file).' },
                { label: 'Fade Out',   icon: '↘',  action: handleFadeOut,   color: DAW.green,   title: 'Apply linear fade-out to selection (or full file).' },
                { label: 'Normalize',  icon: '⇕',  action: handleNormalize, color: DAW.orange,  title: 'Normalize peak to -0.1dBFS. Downloads as WAV.' },
                { label: 'Reverse',    icon: '⟵⟶', action: handleReverse,   color: DAW.purple,  title: 'Reverse selection (or full file). Downloads as WAV.' },
                { label: 'Silence',    icon: '—',  action: handleSilence,   color: DAW.red,     title: 'Silence selected region. Select first.' },
              ].map(op => (
                <button key={op.label} type="button" onClick={op.action}
                  disabled={opPending}
                  title={op.title}
                  style={{
                    padding: '7px 12px', borderRadius: 8, cursor: opPending ? 'not-allowed' : 'pointer',
                    border: `1px solid ${op.color}35`,
                    background: `${op.color}10`, color: op.color,
                    fontSize: 11, fontWeight: 700, opacity: opPending ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 12 }}>{op.icon}</span> {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <MultitrackArrangementPanel
          hasAudio={hasAudio}
          sourceLibrary={sourceLibrary}
          selectedSourceId={selectedSourceId}
          selectedClipId={selectedClipId}
          arrTracks={arrTracks}
          arrClips={arrClips}
          arrPlaying={arrPlaying}
          arrLooping={arrLooping}
          arrPlayheadBar={arrPlayheadBar}
          formatSeconds={fmtSec}
          onCaptureCurrentToRack={captureCurrentToRack}
          onToggleArrangementPlayback={toggleArrangementPlayback}
          onToggleArrangementLoop={() => setArrLooping(prev => !prev)}
          onSelectSource={setSelectedSourceId}
          onSelectClip={setSelectedClipId}
          onTrackMuteToggle={(trackId) => setArrTracks(prev => prev.map(item => item.id === trackId ? { ...item, muted: !item.muted } : item))}
          onTrackSoloToggle={(trackId) => setArrTracks(prev => prev.map(item => item.id === trackId ? { ...item, solo: !item.solo } : item))}
          onTrackVolumeChange={(trackId, volume) => setArrTracks(prev => prev.map(item => item.id === trackId ? { ...item, volume } : item))}
          onPlaceClip={placeArrangementClip}
          onNudgeClipLeft={() => updateSelectedClip(clip => ({ ...clip, startBar: Math.max(0, clip.startBar - 1) }))}
          onNudgeClipRight={() => updateSelectedClip(clip => ({ ...clip, startBar: Math.min(ARRANGEMENT_BARS - clip.barLength, clip.startBar + 1) }))}
          onShortenClip={() => updateSelectedClip(clip => ({ ...clip, barLength: Math.max(1, clip.barLength - 1) }))}
          onLengthenClip={() => updateSelectedClip(clip => ({ ...clip, barLength: Math.min(ARRANGEMENT_BARS - clip.startBar, clip.barLength + 1) }))}
          onDuplicateClip={() => {
            const selectedClip = arrClips.find(clip => clip.id === selectedClipId) ?? null;
            if (!selectedClip) { showOpMsg('⚠ Select an arrangement clip first'); return; }
            const duplicate: ArrangementClip = {
              ...selectedClip,
              id: `clip-${Date.now()}-${Math.round(Math.random() * 999)}`,
              startBar: Math.min(ARRANGEMENT_BARS - selectedClip.barLength, selectedClip.startBar + selectedClip.barLength),
            };
            setArrClips(prev => [...prev, duplicate]);
            setSelectedClipId(duplicate.id);
          }}
          onRemoveClip={() => {
            const selectedClip = arrClips.find(clip => clip.id === selectedClipId) ?? null;
            if (!selectedClip) { showOpMsg('⚠ Select an arrangement clip first'); return; }
            setArrClips(prev => prev.filter(clip => clip.id !== selectedClip.id));
            setSelectedClipId(null);
          }}
          onSelectedClipGainChange={(gain) => updateSelectedClip(clip => ({ ...clip, gain }))}
        />

        {/* ── Formats notice ── */}
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 10,
          background: DAW.surfaceHi, border: `1px solid ${DAW.border}`,
          color: DAW.dim, lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: DAW.text }}>Import: </span>
          WAV · MP3 · OGG · FLAC · AAC · M4A
          {' · '}
          <span style={{ fontWeight: 700, color: DAW.text }}>Export: </span>
          WAV (all operations) · Original file · Project JSON
          <br />
          <span style={{ color: `${DAW.accent}99` }}>
            Inspired by Ableton, Logic Pro, Pro Tools, Cubase, FL Studio · Splice stem compatibility
          </span>
        </div>
      </div>
    </div>
  );
}
