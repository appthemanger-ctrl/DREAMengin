import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  buildReleaseStrategy,
  createMelodySuggestions,
  summarizePlaybackProfile,
} from '@/lib/music/starmaker';

const starmakerSource = fs.readFileSync(
  path.join(process.cwd(), 'components/daydream/StarMakerEngin.tsx'),
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
});
