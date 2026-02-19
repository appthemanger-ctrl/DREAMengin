'use client';

import React from 'react';

type CardProps = {
  title: string;
  subtitle: string;
  accent?: 'blue' | 'gold' | 'white';
  tall?: boolean;
  wide?: boolean;
  scrollX?: boolean;
};

function WidgetCard({ title, subtitle, accent = 'blue', tall, wide, scrollX }: CardProps) {
  const accentColor = accent === 'gold' ? 'var(--de-gold)' : accent === 'white' ? 'var(--de-white)' : '#7cb6ff';
  return (
    <article
      data-scrollable={scrollX ? 'x' : 'y'}
      className="de-widget-card"
      style={{
        minHeight: tall ? 320 : 150,
        gridColumn: wide ? 'span 2' : undefined,
        overflowX: scrollX ? 'auto' : 'hidden',
        overflowY: 'hidden',
        touchAction: scrollX ? 'pan-x' : 'pan-y',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>{title}</div>
      <div className="selectableText" style={{ marginTop: 8, color: accentColor, fontSize: 24, fontWeight: 600 }}>{subtitle}</div>
      {scrollX ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 16, width: 'max-content', paddingBottom: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 120, height: tall ? 210 : 90, borderRadius: 14, background: 'rgba(8,22,72,0.72)', border: '1px solid var(--de-border)' }} />
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 12, height: tall ? 210 : 72, borderRadius: 12, background: 'rgba(8,22,72,0.52)', border: '1px solid var(--de-border)' }} />
      )}
    </article>
  );
}

export default function HomeFeedWidgetGrid({ onOpenDrEams }: { onOpenDrEams: () => void }) {
  return (
    <div data-scrollable="y" className="dreamnav-surface" style={{ overflowY: 'auto', maxHeight: '72vh', paddingRight: 4, touchAction: 'pan-y' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
        <WidgetCard title="Instagram" subtitle="Stories" accent="gold" />
        <WidgetCard title="Facebook" subtitle="Live" accent="white" />
        <WidgetCard title="Twitter" subtitle="#Space" accent="blue" />
        <WidgetCard title="TikTok" subtitle="Trending" accent="gold" />

        <WidgetCard title="Home Feed" subtitle="Live Stream" wide scrollX />
        <WidgetCard title="Media Stack" subtitle="Clips" tall scrollX />

        <WidgetCard title="YouTube" subtitle="Playlist" accent="gold" />
        <WidgetCard title="Spotify" subtitle="Now Playing" accent="white" />
        <WidgetCard title="Weather" subtitle="72°" accent="gold" />
        <WidgetCard title="Portfolio" subtitle="Updates" accent="blue" />
      </div>
      <button
        type="button"
        onClick={onOpenDrEams}
        style={{
          marginTop: 12,
          width: '100%',
          borderRadius: 14,
          border: '1px solid rgba(212,168,67,0.45)',
          background: 'rgba(212,168,67,0.12)',
          color: 'var(--de-gold)',
          padding: '10px 14px',
          fontWeight: 600,
        }}
      >
        Open Dr. Eams
      </button>
    </div>
  );
}
