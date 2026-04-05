import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  buildReleaseStrategy,
  createMelodySuggestions,
  summarizePlaybackProfile,
} from '@/lib/music/starmaker';

import {
  midiPitchToName,
  isBlackKey,
  createMidiNote,
  snapToGrid,
  createInitialCompingState,
  createInitialSessionView,
  createInitialWarpState,
  computeWarpPlaybackRate,
  audioQualityLabel,
  AUDIO_QUALITY_PRESETS,
  PIANO_ROLL_DEFAULTS,
} from '@/lib/music/starmakerDaw';

const starmakerSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/StarMakerEngin.tsx'),
  'utf8',
);
const arrangementPanelSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/starmaker/MultitrackArrangementPanel.tsx'),
  'utf8',
);
const arrangementModelSource = fs.readFileSync(
  path.join(process.cwd(), 'lib/music/starmakerArrangement.ts'),
  'utf8',
);
const pianoRollSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/starmaker/PianoRollPanel.tsx'),
  'utf8',
);
const compingSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/starmaker/CompingPanel.tsx'),
  'utf8',
);
const sessionViewSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/starmaker/SessionViewPanel.tsx'),
  'utf8',
);
const dawModelSource = fs.readFileSync(
  path.join(process.cwd(), 'lib/music/starmakerDaw.ts'),
  'utf8',
);

describe('summarizePlaybackProfile', () => {
  it('derives playback metrics from density, effects, and quality mode', () => {
    const profile = summarizePlaybackProfile({
      beatGrid: [
        [true, false, true, false, true, false, true, false],
        [false, true, false, true, false, true, false, true],
        [true, true, false, false, true, true, false, false],
        [false, false, true, true, false, false, true, true],
      ],
      bpm: 120,
      mixer: { vocals: 82, instruments: 76, bass: 74, fx: 58 },
      activeEffects: ['Chorus', 'Delay', 'Limiter'],
      qualityMode: 'studio',
    });

    expect(profile.activeSteps).toBe(16);
    expect(profile.loopSeconds).toBe(2);
    expect(profile.stereoWidthPct).toBeGreaterThan(60);
    expect(profile.headroomDb).toBeGreaterThan(3);
    expect(profile.masteringLabel).toBe('Studio master chain');
    expect(profile.marketEdge).toContain('release-grade monitoring');
  });

  it('downgrades the mastering label when the mix gets too hot', () => {
    const profile = summarizePlaybackProfile({
      beatGrid: Array.from({ length: 4 }, () => Array.from({ length: 8 }, () => true)),
      bpm: 150,
      mixer: { vocals: 100, instruments: 98, bass: 96, fx: 92 },
      activeEffects: ['Limiter', 'Compressor'],
      qualityMode: 'streaming',
    });

    expect(profile.headroomDb).toBeLessThan(4.1);
    expect(profile.masteringLabel).toBe('Loud and risky');
  });
});

describe('buildReleaseStrategy', () => {
  it('scores a complete studio-ready package higher than a draft', () => {
    const polished = buildReleaseStrategy({
      stemReady: { vocals: true, drums: true, bass: true, other: true },
      releasesCount: 2,
      playlistCount: 3,
      activeEffects: ['Limiter', 'Compressor', 'Reverb'],
      qualityMode: 'studio',
      collabActive: true,
    });

    const draft = buildReleaseStrategy({
      stemReady: { vocals: true, drums: false, bass: false, other: false },
      releasesCount: 0,
      playlistCount: 1,
      activeEffects: [],
      qualityMode: 'idea',
      collabActive: false,
    });

    expect(polished.score).toBeGreaterThan(draft.score);
    expect(polished.headline).toBe('Prime for wide release');
    expect(polished.blockers).toHaveLength(0);
    expect(polished.targets.every(target => target.readiness === 'ready')).toBe(true);

    expect(draft.headline).toBe('Keep polishing before launch');
    expect(draft.blockers.some(item => item.includes('Limiter + Compressor'))).toBe(true);
    expect(draft.targets.some(target => target.readiness === 'needs-work')).toBe(true);
  });
});

describe('createMelodySuggestions', () => {
  it('keeps generated notes inside the chosen major scale', () => {
    const suggestions = createMelodySuggestions({
      musicalKey: 'D',
      keyMode: 'major',
      bpm: 126,
      pitch: 2,
      chordProgression: ['Dmaj', 'Bmin', 'Gmaj', 'Amaj'],
      activeEffects: ['Delay'],
    });

    expect(suggestions).toHaveLength(3);
    for (const suggestion of suggestions) {
      expect(suggestion.notes.every(note => ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'].includes(note))).toBe(true);
      expect(suggestion.compatibilityScore).toBeGreaterThanOrEqual(70);
    }
    expect(suggestions[0].reason).toContain('D');
  });

  it('adjusts phrasing copy for minor mode and extreme pitch shifts', () => {
    const suggestions = createMelodySuggestions({
      musicalKey: 'A',
      keyMode: 'minor',
      bpm: 92,
      pitch: -5,
      chordProgression: ['Amin', 'Fmaj', 'Cmaj', 'Gmaj'],
      activeEffects: ['Chorus', 'Reverb'],
    });

    expect(suggestions[1].reason).toContain('A minor');
    expect(suggestions[1].reason).toContain('low-register anchor');
    expect(suggestions[2].compatibilityScore).toBeGreaterThan(suggestions[1].compatibilityScore - 5);
  });
});

describe('StarMaker sample editor advanced workflow', () => {
  it('includes destructive edit history controls for undo and redo', () => {
    expect(starmakerSource).toContain("Undo");
    expect(starmakerSource).toContain("Redo");
    expect(starmakerSource).toContain("restoreHistory");
    expect(starmakerSource).toContain("undoStackRef");
    expect(starmakerSource).toContain("redoStackRef");
  });

  it('supports selection audition and selection loop workflow', () => {
    expect(starmakerSource).toContain("Audition Sel");
    expect(starmakerSource).toContain("Loop Sel");
    expect(starmakerSource).toContain("selection-loop");
    expect(starmakerSource).toContain("selection-once");
  });

  it('supports workflow shortcuts and zoom-to-selection controls', () => {
    expect(starmakerSource).toContain("Zoom Sel");
    expect(starmakerSource).toContain("Fit Full");
    expect(starmakerSource).toContain("Shift+Space");
    expect(starmakerSource).toContain("Ctrl/Cmd+Z");
  });

  it('adds a real multitrack arrangement surface with source rack and clip lanes', () => {
    expect(starmakerSource).toContain('MultitrackArrangementPanel');
    expect(arrangementPanelSource).toContain('Multitrack Arrangement');
    expect(arrangementPanelSource).toContain('SOURCE RACK');
    expect(arrangementPanelSource).toContain('SOURCE PICKER');
    expect(arrangementPanelSource).toContain('CLIP TOOLS');
    expect(arrangementPanelSource).toContain('Capture Current to Rack');
    expect(arrangementPanelSource).toContain('Play Arrangement');
  });

  it('uses pickers for assignment flows and disclosure for tweak-heavy controls', () => {
    expect(starmakerSource).toContain('SCALE PICKER');
    expect(starmakerSource).toContain('ROOT NOTE');
    expect(starmakerSource).toContain('FX CHAIN');
    expect(starmakerSource).toContain('MIX CHANNELS');
    expect(arrangementPanelSource).toContain('Use the picker to assign which captured source drops into the next clip slot.');
  });

  it('exports arrangement state with tracks, sources, and clips', () => {
    expect(starmakerSource).toContain('arrangement: {');
    expect(starmakerSource).toContain('tracks: arrTracks');
    expect(starmakerSource).toContain('sources: sourceLibrary.map');
    expect(starmakerSource).toContain('clips: arrClips');
  });

  it('uses Web Audio scheduling for arrangement preview playback', () => {
    expect(starmakerSource).toContain('createBufferSource()');
    expect(starmakerSource).toContain('toggleArrangementPlayback');
    expect(starmakerSource).toContain('arrangementBuffersRef');
    expect(starmakerSource).toContain('arrLooping');
  });

  it('gives arrangement its own dedicated file structure and shared model module', () => {
    expect(starmakerSource).toContain("@/components/daydream/starmaker/MultitrackArrangementPanel");
    expect(starmakerSource).toContain("@/lib/music/starmakerArrangement");
    expect(arrangementModelSource).toContain('export const ARRANGEMENT_BARS = 16');
    expect(arrangementModelSource).toContain('export interface ArrangementClip');
  });

  it('includes the reviewer expectation note about full DAW-grade editing scope', () => {
    expect(arrangementPanelSource).toContain('A reviewer may expect full DAW-grade arrangement editing');
    expect(arrangementPanelSource).toContain('drag-and-drop clips');
    expect(arrangementPanelSource).toContain('persistent project storage');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// starmakerDaw data model helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('midiPitchToName', () => {
  it('converts standard MIDI pitch numbers to note names', () => {
    expect(midiPitchToName(60)).toBe('C3');   // middle C
    expect(midiPitchToName(69)).toBe('A3');   // concert A
    expect(midiPitchToName(0)).toBe('C-2');   // lowest MIDI
  });
});

describe('isBlackKey', () => {
  it('identifies sharps/flats as black keys', () => {
    expect(isBlackKey(61)).toBe(true);   // C#3
    expect(isBlackKey(60)).toBe(false);  // C3
    expect(isBlackKey(64)).toBe(false);  // E3
    expect(isBlackKey(66)).toBe(true);   // F#3
  });
});

describe('createMidiNote + snapToGrid', () => {
  it('creates a MIDI note with correct defaults', () => {
    const note = createMidiNote(60, 0, 0.5, 100);
    expect(note.pitch).toBe(60);
    expect(note.startBeat).toBe(0);
    expect(note.durationBeats).toBe(0.5);
    expect(note.velocity).toBe(100);
    expect(note.channel).toBe(0);
    expect(note.id).toMatch(/^note-/);
  });

  it('snaps beats to the nearest quantize grid', () => {
    expect(snapToGrid(0.13, '1/8')).toBeCloseTo(0.125, 5);
    expect(snapToGrid(0.3, '1/4')).toBeCloseTo(0.25, 5);
    expect(snapToGrid(1.9, '1/2')).toBeCloseTo(2, 5);
    expect(snapToGrid(0.0, '1/16')).toBe(0);
  });
});

describe('createInitialCompingState', () => {
  it('creates the requested number of demo takes', () => {
    const state = createInitialCompingState(4);
    expect(state.takes).toHaveLength(4);
    expect(state.takes[0].active).toBe(true);
    expect(state.takes.every(t => t.waveform.length === 48)).toBe(true);
  });

  it('sets totalDurationSec from the longest take', () => {
    const state = createInitialCompingState(3);
    const maxDuration = Math.max(...state.takes.map(t => t.durationSec));
    expect(state.totalDurationSec).toBe(maxDuration);
  });
});

describe('createInitialSessionView', () => {
  it('creates 5 tracks and 6 scenes', () => {
    const view = createInitialSessionView();
    expect(view.tracks).toHaveLength(5);
    expect(view.scenes).toHaveLength(6);
    expect(view.soloTrackId).toBeNull();
  });

  it('includes demo clips in the drums track', () => {
    const view = createInitialSessionView();
    const drums = view.tracks.find(t => t.id === 'drums');
    expect(drums).toBeDefined();
    const filledClips = drums!.clips.filter(c => !c.isEmpty);
    expect(filledClips.length).toBeGreaterThan(0);
  });
});

describe('createInitialWarpState + computeWarpPlaybackRate', () => {
  it('creates warp state with correct default values', () => {
    const state = createInitialWarpState(120);
    expect(state.enabled).toBe(false);
    expect(state.warpBpm).toBe(120);
    expect(state.pitchShift).toBe(0);
    expect(state.markers).toHaveLength(2);
  });

  it('computes correct playback rate for tempo stretching', () => {
    expect(computeWarpPlaybackRate(120, 120)).toBe(1);
    expect(computeWarpPlaybackRate(100, 120)).toBeCloseTo(1.2, 5);
    expect(computeWarpPlaybackRate(140, 70)).toBeCloseTo(0.5, 5);
    expect(computeWarpPlaybackRate(0, 120)).toBe(1); // safe: avoids divide-by-zero
  });
});

describe('audioQualityLabel + AUDIO_QUALITY_PRESETS', () => {
  it('produces correct label for hi-res presets', () => {
    expect(audioQualityLabel(AUDIO_QUALITY_PRESETS['Studio 192k']!)).toBe('32-bit / 192kHz');
    expect(audioQualityLabel(AUDIO_QUALITY_PRESETS['CD Quality']!)).toBe('16-bit / 44.1kHz');
  });

  it('has all five presets with increasing quality', () => {
    const presets = Object.values(AUDIO_QUALITY_PRESETS);
    expect(presets).toHaveLength(5);
    const sampleRates = presets.map(p => p.sampleRate);
    expect(sampleRates).toContain(192000);
    expect(sampleRates).toContain(44100);
  });
});

describe('PIANO_ROLL_DEFAULTS', () => {
  it('has sensible default values', () => {
    expect(PIANO_ROLL_DEFAULTS.quantize).toBe('1/8');
    expect(PIANO_ROLL_DEFAULTS.totalBeats).toBe(16);
    expect(PIANO_ROLL_DEFAULTS.notes).toHaveLength(0);
    expect(PIANO_ROLL_DEFAULTS.viewBottomPitch).toBe(48);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Industry-standard DAW panels — structural tests
// ─────────────────────────────────────────────────────────────────────────────

describe('PianoRollPanel', () => {
  it('renders a piano keyboard strip with beat ruler', () => {
    expect(pianoRollSource).toContain('Piano Roll — MIDI Editor');
    expect(pianoRollSource).toContain('piano keyboard');
    expect(pianoRollSource).toContain('QUANTIZE');
    expect(pianoRollSource).toContain('VELOCITY');
    expect(pianoRollSource).toContain('BARS');
  });

  it('supports note add and remove via click', () => {
    expect(pianoRollSource).toContain('handleCellClick');
    expect(pianoRollSource).toContain('createMidiNote');
    expect(pianoRollSource).toContain('Remove note');
    expect(pianoRollSource).toContain('Add note');
  });

  it('uses the starmakerDaw model module', () => {
    expect(pianoRollSource).toContain('@/lib/music/starmakerDaw');
    expect(pianoRollSource).toContain('isBlackKey');
    expect(pianoRollSource).toContain('midiPitchToName');
    expect(pianoRollSource).toContain('snapToGrid');
  });
});

describe('CompingPanel', () => {
  it('implements Pro Tools-style takes management', () => {
    expect(compingSource).toContain('Comping — Takes Manager');
    expect(compingSource).toContain('Add Take');
    expect(compingSource).toContain('Auto Comp');
    expect(compingSource).toContain('Remove Selected');
  });

  it('shows star ratings and active toggle per take', () => {
    expect(compingSource).toContain('StarRating');
    expect(compingSource).toContain('active: !take.active');
    expect(compingSource).toContain('ACTIVE COMP');
  });

  it('is inspired by Pro Tools playlist workflow', () => {
    expect(compingSource).toContain('Pro Tools Playlist comping workflow');
    expect(compingSource).toContain('@/lib/music/starmakerDaw');
  });
});

describe('SessionViewPanel', () => {
  it('implements Ableton Live Session View clip launcher', () => {
    expect(sessionViewSource).toContain('Session View — Clip Launcher');
    expect(sessionViewSource).toContain('handleSceneLaunch');
    expect(sessionViewSource).toContain('handleStopAll');
    expect(sessionViewSource).toContain('Stop All');
  });

  it('has per-track Mute, Solo, and Arm controls', () => {
    expect(sessionViewSource).toContain('handleMuteToggle');
    expect(sessionViewSource).toContain('handleSoloToggle');
    expect(sessionViewSource).toContain('handleArmToggle');
  });

  it('references Ableton Live in attribution', () => {
    expect(sessionViewSource).toContain('Ableton Live Session View');
    expect(sessionViewSource).toContain('@/lib/music/starmakerDaw');
  });
});

describe('StarMakerEngin industry-standard DAW panel integration', () => {
  it('imports and renders PianoRollPanel, CompingPanel, and SessionViewPanel', () => {
    expect(starmakerSource).toContain('PianoRollPanel');
    expect(starmakerSource).toContain('CompingPanel');
    expect(starmakerSource).toContain('SessionViewPanel');
  });

  it('maintains piano roll, comping, and session view state', () => {
    expect(starmakerSource).toContain('pianoRollState');
    expect(starmakerSource).toContain('compingState');
    expect(starmakerSource).toContain('sessionViewState');
    expect(starmakerSource).toContain('PIANO_ROLL_DEFAULTS');
    expect(starmakerSource).toContain('createInitialCompingState');
    expect(starmakerSource).toContain('createInitialSessionView');
  });

  it('exports from starmakerDaw module', () => {
    expect(starmakerSource).toContain('@/lib/music/starmakerDaw');
    expect(dawModelSource).toContain('export interface MidiNote');
    expect(dawModelSource).toContain('export interface AudioTake');
    expect(dawModelSource).toContain('export interface SessionViewState');
    expect(dawModelSource).toContain('export interface WarpState');
    expect(dawModelSource).toContain('export const AUDIO_QUALITY_PRESETS');
  });
});

