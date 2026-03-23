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
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import Link from 'next/link';
import {
  ArrowLeft,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

          <PlaybackStudioWidget
            playing={playbackActive}
            playbackStep={playbackStep}
            qualityMode={qualityMode}
            profile={playbackProfile}
            onTogglePlayback={handleTransportToggle}
            onQualityModeChange={setQualityMode}
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

          <ReleaseCommandWidget strategy={releaseStrategy} />

          {/* ── Waveform Visualizer ── */}
          <WaveformVisualizerWidget
            bars={visibleWaveformBars}
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

interface PlaybackStudioWidgetProps {
  playing: boolean;
  playbackStep: number;
  qualityMode: PlaybackQualityMode;
  profile: ReturnType<typeof summarizePlaybackProfile>;
  onTogglePlayback: () => void;
  onQualityModeChange: (mode: PlaybackQualityMode) => void;
}

function PlaybackStudioWidget({
  playing,
  playbackStep,
  qualityMode,
  profile,
  onTogglePlayback,
  onQualityModeChange,
}: PlaybackStudioWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Playback Deck
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: `${ACCENT}14`, color: ACCENT, border: `1px solid ${ACCENT}28` }}
        >
          custom HQ preview
        </span>
      </div>

      <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            ['idea', 'Idea'],
            ['streaming', 'Streaming'],
            ['studio', 'Studio'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onQualityModeChange(mode)}
              aria-pressed={qualityMode === mode}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${qualityMode === mode ? ACCENT : `${ACCENT}22`}`,
                background: qualityMode === mode ? `${ACCENT}16` : 'rgba(255,255,255,0.5)',
                color: qualityMode === mode ? ACCENT : 'var(--de-text)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 12,
            alignItems: 'center',
            padding: '12px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(42,138,184,0.14), rgba(139,92,246,0.12))',
            border: '1px solid rgba(160,195,240,0.2)',
          }}
        >
          <button
            type="button"
            onClick={onTogglePlayback}
            className={playing ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
            aria-label={playing ? 'Pause playback preview' : 'Play custom high quality preview'}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" style={{ marginLeft: 2 }} />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                {profile.masteringLabel}
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                {profile.punchLabel} · {profile.loopSeconds}s loop · {profile.activeSteps} programmed hits
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BEAT_STEPS}, 1fr)`, gap: 5 }}>
              {Array.from({ length: BEAT_STEPS }, (_, index) => (
                <div
                  key={index}
                  style={{
                    height: 16,
                    borderRadius: 999,
                    background: playbackStep === index ? ACCENT : 'rgba(160,195,240,0.24)',
                    opacity: playing ? 1 : index <= playbackStep ? 0.8 : 0.45,
                    boxShadow: playbackStep === index ? `0 0 0 3px ${ACCENT}20` : 'none',
                    transition: 'all 120ms ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            { label: 'Stereo', value: `${profile.stereoWidthPct}%` },
            { label: 'Headroom', value: `${profile.headroomDb} dB` },
            { label: 'Density', value: `${profile.densityPct}%` },
          ].map(metric => (
            <div
              key={metric.label}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(160,195,240,0.18)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)' }}>{metric.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profile.marketEdge.map(edge => (
            <span
              key={edge}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '5px 8px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.58)',
                border: '1px solid rgba(160,195,240,0.18)',
                color: 'var(--de-text)',
              }}
            >
              {edge}
            </span>
          ))}
        </div>
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

interface ReleaseCommandWidgetProps {
  strategy: ReturnType<typeof buildReleaseStrategy>;
}

const DEFAULT_STRENGTH_MESSAGE = 'Build momentum with stems, mastering, and playlists.';
const DEFAULT_BLOCKER_MESSAGE = 'No blockers — move into launch mode.';

function ReleaseCommandWidget({ strategy }: ReleaseCommandWidgetProps) {
  return (
    <div className="de-widget">
      <div className="de-widget-header">
        <span className="de-widget-title">
          <Gauge className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
          Release Command
        </span>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: strategy.score >= 75 ? 'rgba(34,197,94,0.12)' : `${ACCENT}14`,
            color: strategy.score >= 75 ? '#16a34a' : ACCENT,
            border: `1px solid ${strategy.score >= 75 ? 'rgba(34,197,94,0.22)' : `${ACCENT}28`}`,
          }}
        >
          {strategy.score}/100
        </span>
      </div>

      <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.52)',
            border: '1px solid rgba(160,195,240,0.18)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
            {strategy.headline}
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>
            Build a release package that can move from prototype to launch without leaving the Daydream.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.18)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Strengths
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {(strategy.strengths.length > 0 ? strategy.strengths : [DEFAULT_STRENGTH_MESSAGE]).map(item => (
                <div key={item} style={{ fontSize: 11, color: 'var(--de-heading)' }}>• {item}</div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Next fixes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {(strategy.blockers.length > 0 ? strategy.blockers : [DEFAULT_BLOCKER_MESSAGE]).map(item => (
                <div key={item} style={{ fontSize: 11, color: 'var(--de-heading)' }}>• {item}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {strategy.targets.map(target => (
            <div
              key={target.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(160,195,240,0.18)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', minWidth: 96 }}>
                {target.label}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--de-text-dim)' }}>{target.focus}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 999,
                  flexShrink: 0,
                  background: target.readiness === 'ready' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                  color: target.readiness === 'ready' ? '#16a34a' : '#d97706',
                  border: `1px solid ${target.readiness === 'ready' ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.2)'}`,
                }}
              >
                {target.readiness === 'ready' ? 'Ready' : 'Needs work'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
  suggestions: MelodySuggestion[];
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
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.title}
                style={{
                  padding: '9px 12px', borderRadius: 10,
                  background: `${ACCENT}08`,
                  border: `1px solid ${ACCENT}25`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--de-heading)' }}>
                    {suggestion.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 7px',
                      borderRadius: 999,
                      background: `${ACCENT}14`,
                      color: ACCENT,
                    }}
                  >
                    {suggestion.complexity}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: ACCENT }}>
                    {suggestion.compatibilityScore}% fit
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', fontFamily: 'monospace' }}>
                  {suggestion.pattern}
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>
                  {suggestion.reason}
                </div>
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
