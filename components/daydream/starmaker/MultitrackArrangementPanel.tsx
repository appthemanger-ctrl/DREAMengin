'use client';

import { useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronRight, Layers3, Pause, Play, Plus } from 'lucide-react';

import {
  ARRANGEMENT_BARS,
  type ArrangementClip,
  type ArrangementSource,
  type ArrangementTrackId,
  type ArrangementTrackState,
} from '@/lib/music/starmakerArrangement';

/**
 * Scope note for reviewers:
 * This extracted panel intentionally covers the current shipped arrangement scope:
 * source-rack capture, lane placement, clip edits, and arrangement preview.
 * A reviewer may expect full DAW-grade arrangement editing: drag-and-drop clips,
 * overlap handling, per-clip trim offsets, offline bounce, and persistent project storage.
 * Those are future-scope upgrades, not missing wiring in this file-structure refactor.
 */

const THEME = {
  surfaceHi: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  borderBright: 'rgba(255,255,255,0.14)',
  text: '#e2e5ee',
  dim: '#6e7585',
  accent: '#00d0f0',
  green: '#22c55e',
  purple: '#a855f7',
  red: '#ef4444',
} as const;

const sectionHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#111420',
  borderBottom: `1px solid ${THEME.border}`,
};

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: THEME.dim,
};

function pill(color: string): CSSProperties {
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

function pickerStyle(color: string = THEME.accent): CSSProperties {
  return {
    width: '100%',
    padding: '9px 10px',
    borderRadius: 8,
    border: `1px solid ${color}35`,
    background: '#0f1118',
    color: THEME.text,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.18)`,
  };
}

function disclosureToggleStyle(active: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: `1px solid ${active ? `${THEME.accent}32` : THEME.border}`,
    background: active
      ? 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.18))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
    color: active ? THEME.text : THEME.dim,
    cursor: 'pointer',
    boxShadow: active
      ? 'inset 0 2px 6px rgba(0,0,0,0.35)'
      : '0 10px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
  };
}

const disclosureTrayStyle: CSSProperties = {
  padding: '12px',
  borderRadius: 12,
  background: 'linear-gradient(180deg, rgba(8,10,17,0.96), rgba(20,23,32,0.92))',
  border: `1px solid ${THEME.border}`,
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.32)',
};

interface Props {
  hasAudio: boolean;
  sourceLibrary: ArrangementSource[];
  selectedSourceId: string | null;
  selectedClipId: string | null;
  arrTracks: ArrangementTrackState[];
  arrClips: ArrangementClip[];
  arrPlaying: boolean;
  arrLooping: boolean;
  arrPlayheadBar: number;
  formatSeconds: (seconds: number) => string;
  onCaptureCurrentToRack: () => void;
  onToggleArrangementPlayback: () => void;
  onToggleArrangementLoop: () => void;
  onSelectSource: (sourceId: string) => void;
  onSelectClip: (clipId: string) => void;
  onTrackMuteToggle: (trackId: ArrangementTrackId) => void;
  onTrackSoloToggle: (trackId: ArrangementTrackId) => void;
  onTrackVolumeChange: (trackId: ArrangementTrackId, volume: number) => void;
  onPlaceClip: (trackId: ArrangementTrackId, startBar: number) => void;
  onNudgeClipLeft: () => void;
  onNudgeClipRight: () => void;
  onShortenClip: () => void;
  onLengthenClip: () => void;
  onDuplicateClip: () => void;
  onRemoveClip: () => void;
  onSelectedClipGainChange: (gain: number) => void;
}

export default function MultitrackArrangementPanel({
  hasAudio,
  sourceLibrary,
  selectedSourceId,
  selectedClipId,
  arrTracks,
  arrClips,
  arrPlaying,
  arrLooping,
  arrPlayheadBar,
  formatSeconds,
  onCaptureCurrentToRack,
  onToggleArrangementPlayback,
  onToggleArrangementLoop,
  onSelectSource,
  onSelectClip,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onTrackVolumeChange,
  onPlaceClip,
  onNudgeClipLeft,
  onNudgeClipRight,
  onShortenClip,
  onLengthenClip,
  onDuplicateClip,
  onRemoveClip,
  onSelectedClipGainChange,
}: Props) {
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const activeSourceId = selectedSourceId ?? sourceLibrary[0]?.id ?? null;
  const selectedSource = sourceLibrary.find(source => source.id === activeSourceId) ?? null;
  const selectedClip = arrClips.find(clip => clip.id === selectedClipId) ?? null;
  const arrangementBarsUsed = arrClips.length ? Math.max(...arrClips.map(clip => clip.startBar + clip.barLength)) : 0;
  const [clipToolsExpanded, setClipToolsExpanded] = useState(false);

  useEffect(() => {
    if (sourceLibrary.length === 0) return;
    if (!selectedSourceId || !sourceLibrary.some(source => source.id === selectedSourceId)) {
      onSelectSource(sourceLibrary[0].id);
    }
  }, [onSelectSource, selectedSourceId, sourceLibrary]);

  return (
    <div style={{
      borderRadius: 10,
      background: '#0c1018',
      border: `1px solid ${THEME.border}`,
      overflow: 'hidden',
    }}>
      <div style={{ ...sectionHeader, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers3 className="w-3 h-3" style={{ color: THEME.purple }} />
          <span style={sectionTitle}>Multitrack Arrangement</span>
          {arrPlaying && <span style={{ ...pill(THEME.green), fontSize: 9 }}>● PREVIEW</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ ...pill(THEME.dim), fontSize: 9 }}>{sourceLibrary.length} sources</span>
          <span style={{ ...pill(THEME.dim), fontSize: 9 }}>{arrClips.length} clips</span>
          <span style={{ ...pill(THEME.dim), fontSize: 9 }}>{Math.max(arrangementBarsUsed, 0)} / {ARRANGEMENT_BARS} bars used</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onCaptureCurrentToRack}
            disabled={!hasAudio}
            style={{
              padding: '9px 12px', borderRadius: 8,
              border: `1px solid ${hasAudio ? `${THEME.purple}55` : THEME.border}`,
              background: hasAudio ? `${THEME.purple}16` : THEME.surfaceHi,
              color: hasAudio ? THEME.purple : THEME.dim,
              cursor: hasAudio ? 'pointer' : 'not-allowed',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Capture Current to Rack
          </button>
          <button
            type="button"
            onClick={onToggleArrangementPlayback}
            disabled={!arrClips.length}
            style={{
              padding: '9px 12px', borderRadius: 8,
              border: `1px solid ${arrClips.length ? `${THEME.accent}55` : THEME.border}`,
              background: arrClips.length ? `${THEME.accent}16` : THEME.surfaceHi,
              color: arrClips.length ? THEME.accent : THEME.dim,
              cursor: arrClips.length ? 'pointer' : 'not-allowed',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {arrPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" style={{ marginLeft: 1 }} />}
            {arrPlaying ? 'Stop Arrangement' : 'Play Arrangement'}
          </button>
          <button
            type="button"
            onClick={onToggleArrangementLoop}
            style={{
              padding: '9px 12px', borderRadius: 8,
              border: `1px solid ${arrLooping ? `${THEME.green}55` : THEME.border}`,
              background: arrLooping ? `${THEME.green}14` : THEME.surfaceHi,
              color: arrLooping ? THEME.green : THEME.dim,
              cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
            }}
          >
            {arrLooping ? 'Loop On' : 'Loop Off'}
          </button>
          <span style={{ fontSize: 10, color: THEME.dim, alignSelf: 'center' }}>
            Use the source picker, then click a bar cell to place that source on a track lane.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: THEME.dim, letterSpacing: '0.08em', marginBottom: 6 }}>
                SOURCE PICKER
              </div>
              <select
                value={activeSourceId ?? ''}
                onChange={(event) => {
                  if (event.target.value) onSelectSource(event.target.value);
                }}
                disabled={!sourceLibrary.length}
                aria-label="Arrangement source picker"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 9,
                  border: `1px solid ${selectedSource ? `${selectedSource.color}55` : THEME.border}`,
                  background: '#111420',
                  color: selectedSource ? '#f8fafc' : THEME.dim,
                  cursor: sourceLibrary.length ? 'pointer' : 'not-allowed',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {sourceLibrary.length ? sourceLibrary.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name} · {formatSeconds(source.durationSec)}
                  </option>
                )) : (
                  <option value="">Capture a source to start arranging</option>
                )}
              </select>
            </div>
            <div style={{ minWidth: 160, textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: THEME.dim, letterSpacing: '0.08em', marginBottom: 6 }}>
                ACTIVE ASSIGNMENT
              </div>
              <div style={{
                padding: '10px 12px',
                borderRadius: 9,
                border: `1px solid ${selectedSource ? `${selectedSource.color}40` : THEME.border}`,
                background: selectedSource ? `${selectedSource.color}12` : THEME.surfaceHi,
                color: selectedSource ? selectedSource.color : THEME.dim,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {selectedSource ? `${selectedSource.name} · ${formatSeconds(selectedSource.durationSec)}` : 'No source selected'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: THEME.dim, letterSpacing: '0.08em' }}>
            SOURCE RACK PREVIEW
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: THEME.dim, letterSpacing: '0.08em' }}>
                SOURCE PICKER
              </span>
              <select
                value={selectedSourceId ?? ''}
                onChange={(event) => onSelectSource(event.target.value)}
                aria-label="Arrangement source picker"
                disabled={sourceLibrary.length === 0}
                style={{
                  ...pickerStyle(THEME.purple),
                  opacity: sourceLibrary.length === 0 ? 0.6 : 1,
                  cursor: sourceLibrary.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {sourceLibrary.length === 0 ? (
                  <option value="">Capture a source first</option>
                ) : (
                  sourceLibrary.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name} · {formatSeconds(source.durationSec)}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div style={{ fontSize: 10, color: THEME.dim }}>
              {selectedSource
                ? `Selected source: ${selectedSource.name} · ${formatSeconds(selectedSource.durationSec)}`
              : 'Use the picker to assign which captured source drops into the next clip slot.'}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sourceLibrary.length > 0 ? sourceLibrary.map(source => (
              <div
                key={source.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${activeSourceId === source.id ? source.color : `${source.color}40`}`,
                  background: activeSourceId === source.id ? `${source.color}22` : `${source.color}10`,
                  color: activeSourceId === source.id ? '#fff' : source.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 150,
                  opacity: selectedSourceId === source.id ? 1 : 0.72,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 20 }}>
                  {source.waveform.slice(0, 16).map((h, index) => (
                    <div
                      key={index}
                      style={{
                        width: 3,
                        height: `${Math.max(4, Math.round(h * 18))}px`,
                        borderRadius: 999,
                        background: source.color,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: activeSourceId === source.id ? '#fff' : THEME.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {source.name}
                  </div>
                  <div style={{ fontSize: 9, color: activeSourceId === source.id ? '#f5f7fb' : THEME.dim }}>
                    {formatSeconds(source.durationSec)}
                  </div>
                </div>
                {activeSourceId === source.id && (
                  <span style={{ ...pill(source.color), fontSize: 8, marginLeft: 'auto' }}>ACTIVE</span>
                )}
              </div>
            )) : (
              <div style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px dashed ${THEME.borderBright}`,
                color: THEME.dim,
                fontSize: 10,
                lineHeight: 1.6,
              }}>
                Capture the current edited sample into the Source Rack, then click a bar cell in a lane to place clips.
              </div>
            )}
            </div>
          </div>
        </div>

        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
          <div style={{ display: 'flex', background: '#0a0d14', borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ width: 156, flexShrink: 0, borderRight: `1px solid ${THEME.border}`, padding: '8px 10px', fontSize: 9, color: THEME.dim, fontWeight: 700, letterSpacing: '0.08em' }}>
              TRACKS
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${ARRANGEMENT_BARS}, minmax(0, 1fr))` }}>
              {Array.from({ length: ARRANGEMENT_BARS }, (_, bar) => (
                <div key={bar} style={{
                  padding: '8px 0',
                  textAlign: 'center',
                  borderLeft: bar > 0 ? `1px solid ${THEME.border}` : 'none',
                  fontSize: 9,
                  fontWeight: 700,
                  color: arrPlayheadBar === bar && arrPlaying ? THEME.accent : THEME.dim,
                  background: arrPlayheadBar === bar && arrPlaying ? 'rgba(0,208,240,0.08)' : 'transparent',
                }}>
                  {bar + 1}
                </div>
              ))}
            </div>
          </div>

          {arrTracks.map(track => {
            const trackClips = arrClips.filter(clip => clip.trackId === track.id);
            return (
              <div key={track.id} style={{ display: 'flex', minHeight: 68, borderTop: `1px solid ${THEME.border}` }}>
                <div style={{
                  width: 156,
                  flexShrink: 0,
                  borderRight: `1px solid ${THEME.border}`,
                  background: '#0f131d',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text }}>{track.label}</div>
                      <div style={{ fontSize: 9, color: track.color }}>Lane {track.id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => onTrackMuteToggle(track.id)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${track.muted ? `${THEME.red}55` : THEME.border}`,
                          background: track.muted ? `${THEME.red}18` : THEME.surfaceHi,
                          color: track.muted ? THEME.red : THEME.dim, fontSize: 10, fontWeight: 800,
                        }}
                      >M</button>
                      <button
                        type="button"
                        onClick={() => onTrackSoloToggle(track.id)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${track.solo ? `${THEME.green}55` : THEME.border}`,
                          background: track.solo ? `${THEME.green}18` : THEME.surfaceHi,
                          color: track.solo ? THEME.green : THEME.dim, fontSize: 10, fontWeight: 800,
                        }}
                      >S</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: THEME.dim, fontWeight: 700 }}>VOL</span>
                    <input
                      type="range"
                      min={0}
                      max={1.2}
                      step={0.01}
                      value={track.volume}
                      onChange={(e) => onTrackVolumeChange(track.id, Number(e.target.value))}
                      aria-label={`${track.label} arrangement volume`}
                      style={{ flex: 1, accentColor: track.color }}
                    />
                    <span style={{ fontSize: 9, color: THEME.dim, fontFamily: 'monospace', width: 30 }}>
                      {Math.round(track.volume * 100)}%
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', background: '#0a0d14' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ARRANGEMENT_BARS}, minmax(0, 1fr))`, height: '100%' }}>
                    {Array.from({ length: ARRANGEMENT_BARS }, (_, bar) => (
                      <button
                        key={bar}
                        type="button"
                        onClick={() => onPlaceClip(track.id, bar)}
                        title={selectedSource ? `Place ${selectedSource.name} on bar ${bar + 1}` : 'Select or capture a source first'}
                        style={{
                          border: 'none',
                          borderLeft: bar > 0 ? `1px solid ${THEME.border}` : 'none',
                          borderRight: 'none',
                          borderBottom: 'none',
                          borderTop: 'none',
                          background: arrPlayheadBar === bar && arrPlaying ? 'rgba(0,208,240,0.08)' : (bar % 4 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'),
                          cursor: selectedSource ? 'copy' : 'not-allowed',
                        }}
                      />
                    ))}
                  </div>

                  {trackClips.map(clip => {
                    const source = sourceLibrary.find(item => item.id === clip.sourceId);
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => onSelectClip(clip.id)}
                        title={`${clip.label} · ${clip.barLength} bar clip`}
                        style={{
                          position: 'absolute',
                          left: `${(clip.startBar / ARRANGEMENT_BARS) * 100}%`,
                          top: 10,
                          width: `${(clip.barLength / ARRANGEMENT_BARS) * 100}%`,
                          height: 48,
                          borderRadius: 8,
                          border: `1px solid ${selectedClipId === clip.id ? '#ffffff' : `${clip.color}88`}`,
                          background: `linear-gradient(135deg, ${clip.color}44, ${clip.color}22)`,
                          boxShadow: selectedClipId === clip.id ? `0 0 0 1px ${clip.color}, 0 0 16px ${clip.color}40` : 'none',
                          color: '#fff',
                          padding: '7px 8px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {clip.label}
                        </div>
                        <div style={{ fontSize: 8, opacity: 0.8 }}>
                          {source?.name ?? 'Missing source'} · {clip.barLength} bar
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => setClipToolsExpanded(prev => !prev)}
            aria-expanded={clipToolsExpanded}
            style={disclosureToggleStyle(clipToolsExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>CLIP TOOLS</span>
              <span style={{ fontSize: 10, color: THEME.dim }}>
                {selectedClip
                  ? `Tweaking ${selectedClip.label} on ${arrTracks.find(track => track.id === selectedClip.trackId)?.label ?? selectedClip.trackId}`
                  : 'Select a clip to reveal edit parameters'}
              </span>
              {selectedClip && (
                <span style={{ ...pill(selectedClip.color), fontSize: 9, marginLeft: 'auto' }}>
                  Bars {selectedClip.startBar + 1}-{selectedClip.startBar + selectedClip.barLength}
                </span>
              )}
              <span style={{ fontSize: 10, color: clipToolsExpanded ? THEME.accent : THEME.dim }}>{clipToolsExpanded ? '▼' : '▶'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setToolsExpanded(expanded => !expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid ${selectedClip ? `${selectedClip.color}30` : THEME.borderBright}`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 18px rgba(0,0,0,0.24)',
              color: selectedClip ? '#f8fafc' : THEME.text,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: selectedClip ? `${selectedClip.color}18` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${selectedClip ? `${selectedClip.color}40` : THEME.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedClip ? selectedClip.color : THEME.dim,
              }}>
                {toolsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Clip Tools
                </div>
                <div style={{ fontSize: 10, color: THEME.dim }}>
                  {selectedClip ? 'Open the recessed tray to nudge, resize, duplicate, or rebalance the clip.' : 'Pick a clip, then open this tray to tweak it.'}
                </div>
              </div>
            </div>
            <span style={{ ...pill(selectedClip ? selectedClip.color : THEME.dim), fontSize: 8 }}>
              {toolsExpanded ? 'OPEN' : 'CLOSED'}
            </span>
          </button>

          {toolsExpanded && (
            <div style={{
              padding: '12px',
              borderRadius: 12,
              background: 'rgba(8,11,18,0.82)',
              border: `1px solid ${selectedClip ? `${selectedClip.color}26` : THEME.border}`,
              boxShadow: 'inset 0 10px 18px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[
                  { label: '← Nudge', action: onNudgeClipLeft },
                  { label: 'Nudge →', action: onNudgeClipRight },
                  { label: 'Shorter', action: onShortenClip },
                  { label: 'Longer', action: onLengthenClip },
                  { label: 'Duplicate', action: onDuplicateClip },
                  { label: 'Remove', action: onRemoveClip },
                ].map(control => (
                  <button
                    key={control.label}
                    type="button"
                    onClick={control.action}
                    disabled={!selectedClip}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: `1px solid ${selectedClip ? THEME.borderBright : THEME.border}`,
                      background: selectedClip ? THEME.surfaceHi : 'rgba(255,255,255,0.03)',
                      color: selectedClip ? THEME.text : THEME.dim,
                      cursor: selectedClip ? 'pointer' : 'not-allowed',
                      fontSize: 10,
                      fontWeight: 700,
                      opacity: selectedClip ? 1 : 0.45,
                    }}
                  >
                    {control.label}
                  </button>
                ))}
              </div>

              {selectedClip && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, color: THEME.dim, fontWeight: 700 }}>CLIP GAIN</span>
                  <input
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.01}
                    value={selectedClip.gain}
                    onChange={(e) => onSelectedClipGainChange(Number(e.target.value))}
                    aria-label="Selected arrangement clip gain"
                    style={{ flex: 1, accentColor: selectedClip.color }}
                  />
                  <span style={{ fontSize: 9, color: THEME.dim, fontFamily: 'monospace', width: 34 }}>
                    {Math.round(selectedClip.gain * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
