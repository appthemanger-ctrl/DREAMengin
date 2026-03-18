export type PlaybackQualityMode = 'idea' | 'streaming' | 'studio';

export interface PlaybackMixerState {
  vocals: number;
  instruments: number;
  bass: number;
  fx: number;
}

export interface StemExportState {
  vocals: boolean;
  drums: boolean;
  bass: boolean;
  other: boolean;
}

export interface PlaybackProfileInput {
  beatGrid: boolean[][];
  bpm: number;
  mixer: PlaybackMixerState;
  activeEffects: readonly string[];
  qualityMode: PlaybackQualityMode;
}

export interface PlaybackProfile {
  activeSteps: number;
  densityPct: number;
  loopSeconds: number;
  stereoWidthPct: number;
  headroomDb: number;
  masteringLabel: string;
  punchLabel: string;
  marketEdge: string[];
}

export interface ReleaseTarget {
  id: string;
  label: string;
  focus: string;
  readiness: 'ready' | 'needs-work';
}

export interface ReleaseStrategyInput {
  stemReady: StemExportState;
  releasesCount: number;
  playlistCount: number;
  activeEffects: readonly string[];
  qualityMode: PlaybackQualityMode;
  collabActive: boolean;
}

export interface ReleaseStrategy {
  score: number;
  headline: string;
  blockers: string[];
  strengths: string[];
  targets: ReleaseTarget[];
}

export interface MelodySuggestion {
  title: string;
  pattern: string;
  notes: string[];
  reason: string;
  compatibilityScore: number;
  complexity: 'Hook' | 'Lift' | 'Lead';
}

export interface MelodySuggestionInput {
  musicalKey: string;
  keyMode: 'major' | 'minor';
  bpm: number;
  pitch: number;
  chordProgression: string[];
  activeEffects: readonly string[];
}

const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDb(value: number): number {
  return Math.round(value * 10) / 10;
}

function getScale(musicalKey: string, keyMode: 'major' | 'minor'): string[] {
  const rootIndex = NOTE_ORDER.indexOf(musicalKey as (typeof NOTE_ORDER)[number]);
  const safeIndex = rootIndex === -1 ? 0 : rootIndex;
  const intervals = keyMode === 'minor' ? MINOR_INTERVALS : MAJOR_INTERVALS;
  return intervals.map(interval => NOTE_ORDER[(safeIndex + interval) % NOTE_ORDER.length]);
}

function getChordRoot(chord: string): string {
  const match = chord.match(/^[A-G]#?/);
  return match?.[0] ?? 'C';
}

function rotateNotes(notes: string[], startIndex: number, length: number): string[] {
  return Array.from({ length }, (_, index) => notes[(startIndex + index) % notes.length]);
}

export function summarizePlaybackProfile(input: PlaybackProfileInput): PlaybackProfile {
  const activeSteps = input.beatGrid.reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0,
  );
  const totalSteps = Math.max(1, input.beatGrid.length * (input.beatGrid[0]?.length ?? 0));
  const densityPct = Math.round((activeSteps / totalSteps) * 100);
  const averageMix =
    (input.mixer.vocals + input.mixer.instruments + input.mixer.bass + input.mixer.fx) / 4;
  const qualityBoost = input.qualityMode === 'studio' ? 1.6 : input.qualityMode === 'streaming' ? 0.9 : 0;
  const effectBonus =
    (input.activeEffects.includes('Chorus') ? 5 : 0) +
    (input.activeEffects.includes('Delay') ? 4 : 0) +
    (input.activeEffects.includes('Reverb') ? 4 : 0);
  const dynamicsPenalty =
    (input.activeEffects.includes('Limiter') ? 1.5 : 0) +
    (input.activeEffects.includes('Compressor') ? 1 : 0);

  const loopSeconds = toDb((60 / Math.max(1, input.bpm)) * ((input.beatGrid[0]?.length ?? 8) / 2));
  const stereoWidthPct = clamp(
    Math.round(46 + densityPct * 0.22 + effectBonus + qualityBoost * 8),
    40,
    100,
  );
  const headroomDb = toDb(
    clamp(12.4 - averageMix * 0.095 - dynamicsPenalty + qualityBoost, 2.4, 12.5),
  );

  let masteringLabel = 'Idea sketch';
  if (input.qualityMode === 'streaming') masteringLabel = 'Streaming-ready chain';
  if (input.qualityMode === 'studio') masteringLabel = 'Studio master chain';
  if (headroomDb < 4) masteringLabel = 'Loud and risky';

  const punchLabel =
    densityPct >= 45 ? 'High-impact loop' : densityPct >= 24 ? 'Balanced groove' : 'Open arrangement';

  const marketEdge = [
    `${stereoWidthPct}% stereo image`,
    `${headroomDb} dB headroom`,
    input.qualityMode === 'studio' ? 'release-grade monitoring' : 'fast idea audition',
  ];

  return {
    activeSteps,
    densityPct,
    loopSeconds,
    stereoWidthPct,
    headroomDb,
    masteringLabel,
    punchLabel,
    marketEdge,
  };
}

export function buildReleaseStrategy(input: ReleaseStrategyInput): ReleaseStrategy {
  const readyStemCount = Object.values(input.stemReady).filter(Boolean).length;
  const blockers: string[] = [];
  const strengths: string[] = [];

  if (readyStemCount < 4) blockers.push(`Finish ${4 - readyStemCount} more stem${readyStemCount === 3 ? '' : 's'} for full export coverage.`);
  else strengths.push('All four stems are export-ready.');

  if (!input.activeEffects.includes('Limiter') || !input.activeEffects.includes('Compressor')) {
    blockers.push('Add Limiter + Compressor before wide distribution.');
  } else {
    strengths.push('Mastering chain has limiter and compression in place.');
  }

  if (input.qualityMode !== 'studio') blockers.push('Switch monitoring to Studio mode for final QC.');
  else strengths.push('Studio monitoring is enabled for release checks.');

  if (input.playlistCount >= 3) strengths.push('Playlist sequencing is strong enough for EP or campaign rollout.');
  if (input.collabActive) strengths.push('Collab room is live for faster revision cycles.');

  const rawScore =
    readyStemCount * 16 +
    (input.activeEffects.includes('Limiter') ? 10 : 0) +
    (input.activeEffects.includes('Compressor') ? 10 : 0) +
    (input.qualityMode === 'studio' ? 18 : input.qualityMode === 'streaming' ? 10 : 4) +
    Math.min(input.playlistCount, 4) * 5 +
    Math.min(input.releasesCount, 3) * 4 +
    (input.collabActive ? 5 : 0);

  const score = clamp(rawScore, 18, 100);
  const headline =
    score >= 85 ? 'Prime for wide release' :
    score >= 65 ? 'Strong single-ready package' :
    'Keep polishing before launch';

  const targets: ReleaseTarget[] = [
    {
      id: 'spotify',
      label: 'Spotify',
      focus: 'Editorial + algorithmic streaming',
      readiness: score >= 70 ? 'ready' : 'needs-work',
    },
    {
      id: 'apple-music',
      label: 'Apple Music',
      focus: 'Premium listener conversion',
      readiness: score >= 78 ? 'ready' : 'needs-work',
    },
    {
      id: 'youtube-shorts',
      label: 'YouTube Shorts',
      focus: 'High-velocity discovery loops',
      readiness: score >= 60 ? 'ready' : 'needs-work',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      focus: 'Hook testing and creator reuse',
      readiness: score >= 60 ? 'ready' : 'needs-work',
    },
  ];

  return {
    score,
    headline,
    blockers,
    strengths,
    targets,
  };
}

export function createMelodySuggestions(input: MelodySuggestionInput): MelodySuggestion[] {
  const scale = getScale(input.musicalKey, input.keyMode);
  const roots = input.chordProgression.map(getChordRoot);
  const anchorRoot = roots[0] ?? input.musicalKey;
  const anchorIndex = Math.max(0, scale.indexOf(anchorRoot));
  const pitchFlavor = input.pitch > 3 ? 'upper-register lift' : input.pitch < -3 ? 'low-register anchor' : 'balanced range';
  const fastTrack = input.bpm >= 128;
  const fxFlavor =
    input.activeEffects.includes('Delay') || input.activeEffects.includes('Reverb')
      ? 'space-ready phrasing'
      : 'dry upfront phrasing';

  const hookNotes = rotateNotes(scale, anchorIndex, 5);
  const liftNotes = rotateNotes(scale, (anchorIndex + (fastTrack ? 2 : 1)) % scale.length, 5);
  const leadNotes = rotateNotes(scale, (anchorIndex + 4) % scale.length, 6);

  return [
    {
      title: 'Hook line',
      notes: [hookNotes[0], hookNotes[1], hookNotes[2], hookNotes[1], hookNotes[3], hookNotes[4]],
      pattern: `${hookNotes[0]} ${hookNotes[1]} ${hookNotes[2]} ${hookNotes[1]} ${hookNotes[3]} ${hookNotes[4]}`,
      reason: `Locks to ${anchorRoot} and the first chord for an immediately singable topline with ${fxFlavor}.`,
      compatibilityScore: clamp(80 + (fastTrack ? 4 : 0), 0, 100),
      complexity: 'Hook',
    },
    {
      title: 'Pre-chorus lift',
      notes: [liftNotes[0], liftNotes[1], liftNotes[2], liftNotes[3], liftNotes[2], liftNotes[4]],
      pattern: `${liftNotes[0]} ${liftNotes[1]} ${liftNotes[2]} ${liftNotes[3]} ${liftNotes[2]} ${liftNotes[4]}`,
      reason: `Builds tension for the next section with ${pitchFlavor} while staying inside ${input.musicalKey} ${input.keyMode}.`,
      compatibilityScore: clamp(74 + (input.pitch !== 0 ? 4 : 0), 0, 100),
      complexity: 'Lift',
    },
    {
      title: 'Lead motif',
      notes: [leadNotes[0], leadNotes[2], leadNotes[3], leadNotes[4], leadNotes[2], leadNotes[5]],
      pattern: `${leadNotes[0]} ${leadNotes[2]} ${leadNotes[3]} ${leadNotes[4]} ${leadNotes[2]} ${leadNotes[5]}`,
      reason: `A more energetic lead phrase tuned for ${fastTrack ? 'fast-release momentum' : 'midtempo detail'} and ${fxFlavor}.`,
      compatibilityScore: clamp(70 + (input.activeEffects.includes('Chorus') ? 6 : 0), 0, 100),
      complexity: 'Lead',
    },
  ];
}
