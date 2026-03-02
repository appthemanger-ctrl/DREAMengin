'use client';

import React from 'react';
import type { FeedItem } from '@/lib/dreams/types';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

type Props = {
  items: FeedItem[];
  loading: boolean;
  onRefresh: () => void;
};

export default function UniversalFeed({ items, loading, onRefresh }: Props) {
  return (
    <section
      style={{
        background: 'rgba(5,15,45,0.65)',
        borderRadius: 20,
        border: '1px solid rgba(100,150,255,0.12)',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px 10px',
          borderBottom: '1px solid rgba(100,150,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: '#22c55e',
              boxShadow: '0 0 8px rgba(34,197,94,0.7)',
              display: 'inline-block',
              animation: 'dream-pulse 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,244,255,0.9)', letterSpacing: '0.02em' }}>
            Live Feed
          </span>
          <span style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)', marginLeft: 2 }}>
            {items.length} items
          </span>
        </div>
        <button
          type="button"
          aria-label="Refresh feed"
          onClick={onRefresh}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(160,185,255,0.4)', fontSize: 15, padding: 4, lineHeight: 1 }}
        >
          ↺
        </button>
      </div>

      {/* Feed items — own independent scroll */}
      <div style={{ height: 340, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading && items.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'rgba(160,185,255,0.35)', fontSize: 12 }}>
            Loading dreams…
          </div>
        )}
        {!loading && items.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'rgba(160,185,255,0.35)', fontSize: 12 }}>
            Activate dreams below to populate your feed
          </div>
        )}
        {items.map((item, i) => (
          <FeedRow key={item.id} item={item} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

function FeedRow({ item, rank }: { item: FeedItem; rank: number }) {
  const inner = (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(100,150,255,0.07)',
        cursor: item.url ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Dream source icon */}
      <span style={{ fontSize: 14, flexShrink: 0, paddingTop: 1, opacity: 0.7 }}>
        {item.dreamIcon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,244,255,0.88)', lineHeight: 1.4, marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: 'rgba(160,185,255,0.3)', marginRight: 6, userSelect: 'none' }}>
            {rank}
          </span>
          {item.title}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'rgba(212,168,67,0.5)', fontWeight: 600 }}>{item.dreamLabel}</span>
          {item.subtitle && <span>{item.subtitle}</span>}
          {item.score != null && <span>▲ {item.score}</span>}
          {item.comments != null && <span>{item.comments} comments</span>}
          <span>{timeAgo(item.timestamp)}</span>
        </div>
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </a>
    );
  }
  return inner;
}
