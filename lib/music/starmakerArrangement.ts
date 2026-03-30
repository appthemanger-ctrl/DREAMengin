export type ArrangementTrackId = 'lead' | 'stack' | 'bass' | 'fx';

export interface ArrangementSource {
  id: string;
  name: string;
  durationSec: number;
  waveform: number[];
  color: string;
}

export interface ArrangementClip {
  id: string;
  trackId: ArrangementTrackId;
  sourceId: string;
  label: string;
  startBar: number;
  barLength: number;
  gain: number;
  color: string;
}

export interface ArrangementTrackState {
  id: ArrangementTrackId;
  label: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export const ARRANGEMENT_BARS = 16;

export const ARRANGEMENT_TRACKS: ArrangementTrackState[] = [
  { id: 'lead', label: 'Lead Vox', color: '#00d0f0', volume: 0.95, muted: false, solo: false },
  { id: 'stack', label: 'Stacks', color: '#a855f7', volume: 0.85, muted: false, solo: false },
  { id: 'bass', label: 'Bass / Low', color: '#22c55e', volume: 0.9, muted: false, solo: false },
  { id: 'fx', label: 'FX / Texture', color: '#f97316', volume: 0.78, muted: false, solo: false },
];

export const ARRANGEMENT_SOURCE_COLORS = ['#00d0f0', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#38bdf8'] as const;
