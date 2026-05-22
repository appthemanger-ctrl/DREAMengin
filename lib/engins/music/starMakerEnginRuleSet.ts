/**
 * lib/engins/music/starMakerEnginRuleSet.ts
 *
 * StarMakerEngin Rule-Set — the ONLY place StarMakerEngin domain logic lives.
 *
 * Domain: music production (BPM, key, stems, releases, playback).
 * Handoff kinds: music:stem-ready → ContentEngin, music:brand-audio-brief → BrandingEngin.
 *
 * ZERO infrastructure here: no fetch, no Supabase, no localStorage.
 * The EnginRuntime handles all of that.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Ruleset.
 */

import {
    patchBaseState,
    type EnginBaseState,
} from '@/lib/engin-runtime/EnginBaseState';
import type { EnginCapability } from '@/lib/engin-runtime/EnginCapabilities';
import type {
    ConstraintResult,
    EnginAction,
    EnginConstraint,
    EnginRuleSetContract,
    EnginRuleSetParams,
} from '@/lib/engin-runtime/EnginRuleSetContract';

// ─── Playback quality modes ───────────────────────────────────────────────────

export type PlaybackQualityMode = 'normal' | 'hq' | 'offline';

// ─── Stem channel ─────────────────────────────────────────────────────────────

export interface StemChannel {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
}

// ─── Release entry ────────────────────────────────────────────────────────────

export interface MusicRelease {
  id: string;
  title: string;
  visibility: 'private' | 'public';
  created_at: string;
}

// ─── Domain state shape ───────────────────────────────────────────────────────

export interface StarMakerEnginDerivedState extends Record<string, unknown> {
  lifecycle: EnginBaseState['lifecycle'];
  bpm: number;
  key: string;
  isMinor: boolean;
  pitchShift: number;
  stems: StemChannel[];
  activeStem: string | null;
  stemExportReady: boolean;
  releases: MusicRelease[];
  playbackMode: PlaybackQualityMode;
  audioBriefReady: boolean;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type StarMakerEnginAction =
  | EnginAction<'music:bpm-set',          { bpm: number }>
  | EnginAction<'music:key-set',          { key: string; isMinor: boolean }>
  | EnginAction<'music:pitch-shift',      { semitones: number }>
  | EnginAction<'music:stem-volume',      { stemId: string; volume: number }>
  | EnginAction<'music:stem-mute',        { stemId: string; muted: boolean }>
  | EnginAction<'music:stem-activate',    { stemId: string }>
  | EnginAction<'music:stems-loaded',     { stems: StemChannel[] }>
  | EnginAction<'music:export-ready',     Record<string, never>>
  | EnginAction<'music:releases-loaded',  { releases: MusicRelease[] }>
  | EnginAction<'music:release-publish',  { releaseId: string }>
  | EnginAction<'music:playback-mode',    { mode: PlaybackQualityMode }>
  | EnginAction<'music:audio-brief-ready', Record<string, never>>;

// ─── Default domain state ─────────────────────────────────────────────────────

const DEFAULT_STEMS: StemChannel[] = [
  { id: 'kick',  name: 'Kick',   volume: 80, muted: false },
  { id: 'snare', name: 'Snare',  volume: 75, muted: false },
  { id: 'bass',  name: 'Bass',   volume: 70, muted: false },
  { id: 'lead',  name: 'Lead',   volume: 85, muted: false },
];

const DEFAULT_DOMAIN: Omit<StarMakerEnginDerivedState, 'lifecycle'> = {
  bpm: 120,
  key: 'C',
  isMinor: false,
  pitchShift: 0,
  stems: DEFAULT_STEMS,
  activeStem: null,
  stemExportReady: false,
  releases: [],
  playbackMode: 'normal',
  audioBriefReady: false,
};

// ─── Constraints ──────────────────────────────────────────────────────────────

const bpmConstraint: EnginConstraint<StarMakerEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'music:bpm-set') return { valid: true };
  const { bpm } = (action as EnginAction<'music:bpm-set', { bpm: number }>).payload ?? {};
  if (typeof bpm !== 'number' || bpm < 20 || bpm > 300) {
    return { valid: false, reason: 'BPM must be between 20 and 300.' };
  }
  return { valid: true };
};

const pitchConstraint: EnginConstraint<StarMakerEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'music:pitch-shift') return { valid: true };
  const { semitones } = (action as EnginAction<'music:pitch-shift', { semitones: number }>).payload ?? {};
  if (typeof semitones !== 'number' || semitones < -12 || semitones > 12) {
    return { valid: false, reason: 'Pitch shift must be between -12 and +12 semitones.' };
  }
  return { valid: true };
};

const volumeConstraint: EnginConstraint<StarMakerEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'music:stem-volume') return { valid: true };
  const { volume } = (action as EnginAction<'music:stem-volume', { stemId: string; volume: number }>).payload ?? {};
  if (typeof volume !== 'number' || volume < 0 || volume > 100) {
    return { valid: false, reason: 'Volume must be between 0 and 100.' };
  }
  return { valid: true };
};

// ─── Transform ────────────────────────────────────────────────────────────────

function transform(state: EnginBaseState, action: StarMakerEnginAction): EnginBaseState {
  const domain = (state.domain as Partial<typeof DEFAULT_DOMAIN>);

  switch (action.type) {
    case 'music:bpm-set': {
      const { bpm } = (action as EnginAction<'music:bpm-set', { bpm: number }>).payload!;
      return patchBaseState(state, { domain: { ...domain, bpm } });
    }

    case 'music:key-set': {
      const { key, isMinor } = (action as EnginAction<'music:key-set', { key: string; isMinor: boolean }>).payload!;
      return patchBaseState(state, { domain: { ...domain, key, isMinor } });
    }

    case 'music:pitch-shift': {
      const { semitones } = (action as EnginAction<'music:pitch-shift', { semitones: number }>).payload!;
      return patchBaseState(state, { domain: { ...domain, pitchShift: semitones } });
    }

    case 'music:stem-volume': {
      const { stemId, volume } = (action as EnginAction<'music:stem-volume', { stemId: string; volume: number }>).payload!;
      const stems = ((domain.stems ?? DEFAULT_STEMS) as StemChannel[]).map(
        (s) => s.id === stemId ? { ...s, volume } : s,
      );
      return patchBaseState(state, { domain: { ...domain, stems } });
    }

    case 'music:stem-mute': {
      const { stemId, muted } = (action as EnginAction<'music:stem-mute', { stemId: string; muted: boolean }>).payload!;
      const stems = ((domain.stems ?? DEFAULT_STEMS) as StemChannel[]).map(
        (s) => s.id === stemId ? { ...s, muted } : s,
      );
      return patchBaseState(state, { domain: { ...domain, stems } });
    }

    case 'music:stem-activate': {
      const { stemId } = (action as EnginAction<'music:stem-activate', { stemId: string }>).payload!;
      return patchBaseState(state, { domain: { ...domain, activeStem: stemId } });
    }

    case 'music:stems-loaded': {
      const { stems } = (action as EnginAction<'music:stems-loaded', { stems: StemChannel[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, stems } });
    }

    case 'music:export-ready': {
      return patchBaseState(state, { domain: { ...domain, stemExportReady: true } });
    }

    case 'music:releases-loaded': {
      const { releases } = (action as EnginAction<'music:releases-loaded', { releases: MusicRelease[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, releases } });
    }

    case 'music:release-publish': {
      const { releaseId } = (action as EnginAction<'music:release-publish', { releaseId: string }>).payload!;
      const releases = ((domain.releases ?? []) as MusicRelease[]).map(
        (r) => r.id === releaseId ? { ...r, visibility: 'public' as const } : r,
      );
      return patchBaseState(state, { domain: { ...domain, releases } });
    }

    case 'music:playback-mode': {
      const { mode } = (action as EnginAction<'music:playback-mode', { mode: PlaybackQualityMode }>).payload!;
      return patchBaseState(state, { domain: { ...domain, playbackMode: mode } });
    }

    case 'music:audio-brief-ready': {
      return patchBaseState(state, { domain: { ...domain, audioBriefReady: true } });
    }

    default:
      return state;
  }
}

// ─── deriveState ──────────────────────────────────────────────────────────────

function deriveState(state: EnginBaseState): StarMakerEnginDerivedState {
  const d = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  return {
    lifecycle:       state.lifecycle,
    bpm:             (d.bpm             ?? DEFAULT_DOMAIN.bpm)             as number,
    key:             (d.key             ?? DEFAULT_DOMAIN.key)             as string,
    isMinor:         (d.isMinor         ?? DEFAULT_DOMAIN.isMinor)         as boolean,
    pitchShift:      (d.pitchShift      ?? DEFAULT_DOMAIN.pitchShift)      as number,
    stems:           (d.stems           ?? DEFAULT_DOMAIN.stems)           as StemChannel[],
    activeStem:      (d.activeStem      ?? DEFAULT_DOMAIN.activeStem)      as string | null,
    stemExportReady: (d.stemExportReady ?? DEFAULT_DOMAIN.stemExportReady) as boolean,
    releases:        (d.releases        ?? DEFAULT_DOMAIN.releases)        as MusicRelease[],
    playbackMode:    (d.playbackMode    ?? DEFAULT_DOMAIN.playbackMode)    as PlaybackQualityMode,
    audioBriefReady: (d.audioBriefReady ?? DEFAULT_DOMAIN.audioBriefReady) as boolean,
  };
}

// ─── Rule-set params ──────────────────────────────────────────────────────────

const PARAMS: EnginRuleSetParams = {
  enginId: 'music',
  name: 'StarMakerEngin',
  layoutMode: 'standard',
  accentColor: '#a855f7',
};

const REQUIRED_CAPABILITIES: ReadonlyArray<EnginCapability> = [
  'state:read',
  'state:write',
  'session:start',
  'session:end',
  'assets:load',
  'assets:upload',
  'bridge:emit',
  'bridge:listen',
];

// ─── Exported rule-set ────────────────────────────────────────────────────────

export const STAR_MAKER_ENGIN_RULE_SET: EnginRuleSetContract<StarMakerEnginAction> = {
  params: PARAMS,
  requiredCapabilities: REQUIRED_CAPABILITIES,
  constraints: [bpmConstraint, pitchConstraint, volumeConstraint],
  transform,
  deriveState,
};