'use client';

import React, { useState, useRef } from 'react';
import WidgetCard from './WidgetCard';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  url?: string;
}

interface PlayMediaWidgetProps {
  tracks?: Track[];
  title?: string;
}

export default function PlayMediaWidget({ tracks = [], title = 'Play Media' }: PlayMediaWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = currentIndex !== null ? tracks[currentIndex] : null;

  const play = (index: number) => {
    setCurrentIndex(index);
    setPlaying(true);
  };

  const togglePlay = () => {
    setPlaying((v) => !v);
  };

  const prev = () => {
    if (currentIndex === null) return;
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const next = () => {
    if (currentIndex === null) return;
    setCurrentIndex(Math.min(tracks.length - 1, currentIndex + 1));
  };

  return (
    <WidgetCard
      title={title}
      actions={
        <button
          type="button"
          className="de-btn de-btn-ghost"
          style={{ fontSize: 11 }}
          onClick={() => setShowQueue((v) => !v)}
        >
          {showQueue ? 'Hide Queue' : 'Show Queue'}
        </button>
      }
    >
      {/* Now Playing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          🎵
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentTrack ? currentTrack.title : 'Nothing playing'}
          </div>
          <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
            {currentTrack ? currentTrack.artist : 'Select a track below'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 }}>
        <button type="button" className="de-icon-btn" onClick={prev} disabled={currentIndex === null || currentIndex === 0} aria-label="Previous">⏮</button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!currentTrack}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: currentTrack ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
            border: 'none', cursor: currentTrack ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button type="button" className="de-icon-btn" onClick={next} disabled={currentIndex === null || currentIndex >= tracks.length - 1} aria-label="Next">⏭</button>
      </div>

      {/* Audio element (native iOS-compatible) */}
      {currentTrack?.url && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onEnded={next}
          style={{ display: 'none' }}
        />
      )}

      {/* Queue */}
      {showQueue && (
        <div style={{ borderTop: '1px solid rgba(160,195,240,0.2)', paddingTop: 10 }}>
          {tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--de-text-dim)' }}>
              No tracks in queue. Connect a music service to add tracks.
            </div>
          ) : (
            tracks.map((track, i) => (
              <button
                key={track.id}
                type="button"
                onClick={() => play(i)}
                style={{
                  display: 'flex', width: '100%', gap: 10, alignItems: 'center',
                  padding: '8px 4px', background: currentIndex === i ? 'rgba(42,138,184,0.08)' : 'none',
                  border: 'none', cursor: 'pointer',
                  borderRadius: 8, textAlign: 'left',
                  borderBottom: i < tracks.length - 1 ? '1px solid rgba(160,195,240,0.12)' : 'none',
                }}
              >
                <span style={{ width: 18, fontSize: 11, color: 'var(--de-text-dim)', flexShrink: 0 }}>
                  {currentIndex === i && playing ? '▶' : `${i + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: currentIndex === i ? 'var(--de-accent)' : 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{track.artist}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Add to Feed / Profile */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(160,195,240,0.15)', marginTop: 4 }}>
        <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 10, padding: '5px 10px' }}>❤️ Favorite</button>
        <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 10, padding: '5px 10px' }}>+ Add to Feed</button>
        <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 10, padding: '5px 10px' }}>👤 Add to Profile</button>
      </div>
    </WidgetCard>
  );
}
