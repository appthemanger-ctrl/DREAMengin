/**
 * lib/music/starmakerDaw.ts — Extended DAW data models for StarMakerEngin.
 *
 * Covers the industry-standard feature set inspired by:
 *  - Pro Tools : Comping / Playlist / Takes management
 *  - Ableton Live : Session View (clip launcher)
 *  - FL Studio / Logic Pro : Piano Roll MIDI editor
 *  - Cubase / Logic : Automation lanes
 *  - All DAWs : Audio warp markers / time-stretch
 *
 * Pure data types & helpers — no side effects, safe for SSR and workers.
 */

// ─── MIDI / Piano Roll ────────────────────────────────────────────────────────

/** Standard MIDI note (0 = C-2, 60 = C4, 127 = G9). */
export interface MidiNote {
  id: string;
  /** MIDI pitch 0-127. */
  pitch: number;
  /** Start position in beats from the beginning of the pattern. */
  startBeat: number;
  /** Duration in beats. */
  durationBeats: number;
  /** Velocity 1-127. */
  velocity: number;
  /** MIDI channel 0-15. */
  channel: number;
}

export type PianoRollQuantize = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32';

export interface PianoRollState {
  notes: MidiNote[];
  totalBeats: number;
  quantize: PianoRollQuantize;
  /** Lowest visible MIDI pitch. */
  viewBottomPitch: number;
  /** Number of pitches visible vertically. */
  viewPitchRange: number;
}

export const PIANO_ROLL_DEFAULTS: PianoRollState = {
  notes: [],
  totalBeats: 16,
  quantize: '1/8',
  viewBottomPitch: 48, // C3
  viewPitchRange: 24,
};

/** Semitone name for display in the piano keyboard. */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Return the note name + octave for a MIDI pitch number (C3 = 60). */
export function midiPitchToName(pitch: number): string {
  const name = NOTE_NAMES[pitch % 12];
  const octave = Math.floor(pitch / 12) - 2;
  return `${name}${octave}`;
}

/** Return true if the pitch is a black key. */
export function isBlackKey(pitch: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitch % 12);
}

/** Create an empty piano roll MIDI note. */
export function createMidiNote(
  pitch: number,
  startBeat: number,
  durationBeats: number = 0.5,
  velocity: number = 100,
): MidiNote {
  return {
    id: `note-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    pitch,
    startBeat,
    durationBeats,
    velocity,
    channel: 0,
  };
}

/** Snap a beat value to the nearest quantize grid position. */
export function snapToGrid(beat: number, quantize: PianoRollQuantize): number {
  const divisions: Record<PianoRollQuantize, number> = {
    '1/1': 1, '1/2': 0.5, '1/4': 0.25, '1/8': 0.125, '1/16': 0.0625, '1/32': 0.03125,
  };
  const div = divisions[quantize];
  return Math.round(beat / div) * div;
}

// ─── Comping / Takes ──────────────────────────────────────────────────────────

export type TakeRating = 0 | 1 | 2 | 3;

/** A single recorded audio take for a track or vocal line. */
export interface AudioTake {
  id: string;
  name: string;
  /** Unix timestamp (ms). */
  recordedAt: number;
  durationSec: number;
  /** Simplified waveform amplitude bars for visual display. */
  waveform: number[];
  /** Whether this take contributes to the current comp. */
  active: boolean;
  /** Star rating (0 = unrated, 1-3 = stars). */
  rating: TakeRating;
  color: string;
}

/** A comp region maps a time span to a specific take. */
export interface CompRegion {
  id: string;
  /** Start in seconds from the top of the record. */
  startSec: number;
  /** End in seconds from the top of the record. */
  endSec: number;
  /** Which take to use for this region. */
  takeId: string;
}

export interface CompingState {
  takes: AudioTake[];
  compRegions: CompRegion[];
  /** Length of the full comp (driven by longest take). */
  totalDurationSec: number;
}

export const TAKE_COLORS = [
  '#00d0f0', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#38bdf8', '#facc15',
] as const;

/** Create a demo take with a synthetic waveform. */
export function createDemoTake(index: number, durationSec: number = 6): AudioTake {
  const seed = index * 7 + 13;
  const waveform = Array.from({ length: 48 }, (_, i) =>
    Math.min(1, Math.max(0.05, Math.abs(Math.sin((seed * 3 + i * 0.8) * 1.7)) * 0.85 + 0.1)),
  );
  return {
    id: `take-${index}`,
    name: `Take ${index + 1}`,
    recordedAt: Date.now() - (3 - index) * 60_000,
    durationSec,
    waveform,
    active: index === 0,
    rating: 0,
    color: TAKE_COLORS[index % TAKE_COLORS.length],
  };
}

/** Build an initial comping state with demo takes. */
export function createInitialCompingState(takeCount: number = 3): CompingState {
  const takes = Array.from({ length: takeCount }, (_, i) => createDemoTake(i));
  const totalDurationSec = takes.reduce((max, t) => Math.max(max, t.durationSec), 0);
  return { takes, compRegions: [], totalDurationSec };
}

// ─── Session View (Ableton-style clip launcher) ────────────────────────────────

export interface SessionClip {
  id: string;
  name: string;
  color: string;
  /** Number of bars in the clip (for loop display). */
  durationBars: number;
  looping: boolean;
  /** Whether this clip is currently playing in the Session View. */
  playing: boolean;
  /** An empty slot — can be recorded into. */
  isEmpty: boolean;
}

export interface SessionTrack {
  id: string;
  name: string;
  color: string;
  /** Arm for recording. */
  armed: boolean;
  muted: boolean;
  solo: boolean;
  volume: number;
  /** Ordered clip slots (one per scene row). */
  clips: SessionClip[];
}

export interface SessionScene {
  id: string;
  name: string;
  tempo?: number;
}

export interface SessionViewState {
  tracks: SessionTrack[];
  scenes: SessionScene[];
  /** Track id of the currently solo'd track, or null. */
  soloTrackId: string | null;
}

/** Create an empty session clip slot. */
export function createEmptyClip(trackId: string, sceneIndex: number): SessionClip {
  return {
    id: `clip-${trackId}-${sceneIndex}-${Date.now()}`,
    name: '',
    color: '#00d0f0',
    durationBars: 2,
    looping: true,
    playing: false,
    isEmpty: true,
  };
}

const SESSION_TRACK_DEFAULTS: Array<{ id: string; name: string; color: string }> = [
  { id: 'drums',   name: 'Drums',   color: '#ef4444' },
  { id: 'bass',    name: 'Bass',    color: '#a855f7' },
  { id: 'chords',  name: 'Chords',  color: '#22c55e' },
  { id: 'lead',    name: 'Lead',    color: '#00d0f0' },
  { id: 'fx',      name: 'FX',      color: '#f97316' },
];

const SESSION_SCENE_DEFAULTS = [
  'Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro',
];

/** Demo clip content per track × scene. Empty = unfilled slot. */
const SESSION_DEMO_CLIPS: Record<string, Record<number, Partial<SessionClip>>> = {
  drums:  { 0: { name: 'Intro Kit',  durationBars: 4, isEmpty: false }, 1: { name: 'Verse Beat', durationBars: 4, isEmpty: false }, 3: { name: 'Chorus Full', durationBars: 4, isEmpty: false } },
  bass:   { 1: { name: 'Verse Line', durationBars: 4, isEmpty: false }, 3: { name: 'Chorus Bass', durationBars: 4, isEmpty: false } },
  chords: { 0: { name: 'Pad Intro',  durationBars: 8, isEmpty: false }, 3: { name: 'Power Chords', durationBars: 4, isEmpty: false } },
  lead:   { 3: { name: 'Lead Hook',  durationBars: 4, isEmpty: false }, 4: { name: 'Bridge Riff', durationBars: 4, isEmpty: false } },
  fx:     { 0: { name: 'Riser',      durationBars: 4, isEmpty: false }, 5: { name: 'Outro Sweep', durationBars: 2, isEmpty: false } },
};

/** Build a default Session View with demo content. */
export function createInitialSessionView(): SessionViewState {
  const scenes: SessionScene[] = SESSION_SCENE_DEFAULTS.map((name, i) => ({
    id: `scene-${i}`,
    name,
  }));

  const tracks: SessionTrack[] = SESSION_TRACK_DEFAULTS.map(def => ({
    ...def,
    armed: false,
    muted: false,
    solo: false,
    volume: 0.85,
    clips: scenes.map((_, sceneIndex) => {
      const demoPatch = SESSION_DEMO_CLIPS[def.id]?.[sceneIndex];
      const base = createEmptyClip(def.id, sceneIndex);
      base.color = def.color;
      if (demoPatch) {
        return { ...base, ...demoPatch };
      }
      return base;
    }),
  }));

  return { tracks, scenes, soloTrackId: null };
}

// ─── Automation ───────────────────────────────────────────────────────────────

export interface AutomationPoint {
  /** Beat position. */
  beat: number;
  /** Normalized 0-1 value. */
  value: number;
}

export interface AutomationLane {
  id: string;
  paramId: string;
  paramLabel: string;
  color: string;
  points: AutomationPoint[];
}

export type AutomationMode = 'read' | 'write' | 'latch' | 'off';

export interface AutomationState {
  lanes: AutomationLane[];
  mode: AutomationMode;
}

export const AUTOMATABLE_PARAMS = [
  { id: 'mixer.vocals',      label: 'Vocals Vol',   color: '#ec4899' },
  { id: 'mixer.instruments', label: 'Instr Vol',    color: '#2a8ab8' },
  { id: 'mixer.bass',        label: 'Bass Vol',     color: '#8b5cf6' },
  { id: 'mixer.fx',          label: 'FX Vol',       color: '#f59e0b' },
  { id: 'pan.vocals',        label: 'Vocals Pan',   color: '#ec4899' },
  { id: 'send.reverb',       label: 'Reverb Send',  color: '#22c55e' },
  { id: 'send.delay',        label: 'Delay Send',   color: '#00d0f0' },
] as const;

/** Create a default automation state with a volume lane. */
export function createInitialAutomationState(): AutomationState {
  const vocalsLane: AutomationLane = {
    id: 'lane-vocals',
    paramId: 'mixer.vocals',
    paramLabel: 'Vocals Vol',
    color: '#ec4899',
    points: [
      { beat: 0,  value: 0.8 },
      { beat: 4,  value: 0.85 },
      { beat: 8,  value: 0.9 },
      { beat: 12, value: 0.75 },
      { beat: 16, value: 0.8 },
    ],
  };
  return { lanes: [vocalsLane], mode: 'read' };
}

// ─── Warp Markers ─────────────────────────────────────────────────────────────

export interface WarpMarker {
  id: string;
  /** Sample position in the original audio (0-1 normalized). */
  samplePos: number;
  /** Beat position in the project. */
  beatPos: number;
  /** Whether this marker is locked (cannot be moved). */
  locked: boolean;
}

export interface WarpState {
  enabled: boolean;
  markers: WarpMarker[];
  /** 'complex' (best quality), 'beats' (rhythmic content), 'tones' (melodic content), 'texture' (ambient). */
  warpMode: 'complex' | 'beats' | 'tones' | 'texture';
  /** Target BPM after warp (0 = use project BPM). */
  warpBpm: number;
  /** Pitch shift in semitones independent of tempo stretch. */
  pitchShift: number;
  /** Formant preservation (0-1) for vocal content. */
  formantPreservation: number;
}

export function createInitialWarpState(projectBpm: number = 120): WarpState {
  return {
    enabled: false,
    markers: [
      { id: 'warp-0', samplePos: 0, beatPos: 0, locked: true },
      { id: 'warp-1', samplePos: 1, beatPos: 4, locked: false },
    ],
    warpMode: 'complex',
    warpBpm: projectBpm,
    pitchShift: 0,
    formantPreservation: 0.5,
  };
}

/** Compute the playback rate multiplier needed to stretch original audio to target BPM. */
export function computeWarpPlaybackRate(originalBpm: number, targetBpm: number): number {
  if (originalBpm <= 0) return 1;
  return targetBpm / originalBpm;
}

// ─── High-Resolution Audio ────────────────────────────────────────────────────

export type BitDepth = 16 | 24 | 32;
export type SampleRateHz = 44100 | 48000 | 88200 | 96000 | 176400 | 192000;

export interface AudioQualityConfig {
  bitDepth: BitDepth;
  sampleRate: SampleRateHz;
  /** Dithering algorithm for bit-depth reduction. */
  dither: 'none' | 'triangular' | 'shaped';
  /** Whether to enable noise shaping on export. */
  noiseShaping: boolean;
}

export const AUDIO_QUALITY_PRESETS: Record<string, AudioQualityConfig> = {
  'CD Quality':       { bitDepth: 16, sampleRate: 44100,  dither: 'triangular', noiseShaping: false },
  'Hi-Res Streaming': { bitDepth: 24, sampleRate: 48000,  dither: 'none',       noiseShaping: false },
  'Studio 96k':       { bitDepth: 24, sampleRate: 96000,  dither: 'none',       noiseShaping: true  },
  'Studio 192k':      { bitDepth: 32, sampleRate: 192000, dither: 'none',       noiseShaping: true  },
  'Mastering Grade':  { bitDepth: 32, sampleRate: 192000, dither: 'shaped',     noiseShaping: true  },
};

/** Human-readable label for a quality config. */
export function audioQualityLabel(cfg: AudioQualityConfig): string {
  return `${cfg.bitDepth}-bit / ${cfg.sampleRate >= 1000 ? `${cfg.sampleRate / 1000}kHz` : `${cfg.sampleRate}Hz`}`;
}
