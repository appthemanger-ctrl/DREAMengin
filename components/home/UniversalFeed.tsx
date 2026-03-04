'use client';

import React, { useState } from 'react';
import type { FeedItem } from '@/lib/dreams/types';
import DecentralizedFeedPanel from './DecentralizedFeedPanel';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

type Tab = 'home' | 'decentralized' | 'trending';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home',          label: 'Home' },
  { id: 'decentralized', label: '🌐 Decentralized' },
  { id: 'trending',      label: '🔥 Trending' },
];

type Props = {
  items: FeedItem[];
  loading: boolean;
  onRefresh: () => void;
};

export default function UniversalFeed({ items, loading, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

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
      {/* Tab bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 12px 0',
          borderBottom: '1px solid rgba(100,150,255,0.1)',
          gap: 4,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id
                ? 'rgba(240,244,255,0.95)'
                : 'rgba(160,185,255,0.45)',
              padding: '6px 10px 8px',
              borderBottom: activeTab === tab.id
                ? '2px solid rgba(100,150,255,0.7)'
                : '2px solid transparent',
              transition: 'color 0.15s ease',
              letterSpacing: '0.01em',
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Refresh / item count — only for Home tab */}
        {activeTab === 'home' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(160,185,255,0.4)' }}>
              {items.length} items
            </span>
            <button
              type="button"
              aria-label="Refresh feed"
              onClick={onRefresh}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(160,185,255,0.4)', fontSize: 15, padding: 4, lineHeight: 1 }}
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {/* ── Home tab ── */}
      {activeTab === 'home' && (
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
      )}

      {/* ── Decentralized tab ── */}
      {activeTab === 'decentralized' && (
        <div style={{ padding: '0 14px 14px' }}>
          <DecentralizedFeedPanel />
        </div>
      )}

      {/* ── Trending tab ── */}
      {activeTab === 'trending' && (
        <div style={{ height: 340, overflowY: 'auto', overflowX: 'hidden' }}>
          {items
            .slice()
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((item, i) => (
              <FeedRow key={item.id} item={item} rank={i + 1} />
            ))}
          {items.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'rgba(160,185,255,0.35)', fontSize: 12 }}>
              No trending items yet
            </div>
          )}
        </div>
      )}
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
