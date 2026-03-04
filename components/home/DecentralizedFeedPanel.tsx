'use client';

// components/home/DecentralizedFeedPanel.tsx
// Panel displaying decentralized social posts with platform filter tabs.

import React, { useState } from 'react';
import Link from 'next/link';
import { useDecentralizedFeed } from '@/hooks/useDecentralizedFeed';
import DecentralizedFeedCard from './DecentralizedFeedCard';
import type { NormalizedPost } from '@/lib/social/decentralizedFeed';

type PlatformFilter = 'all' | 'mastodon' | 'bluesky' | 'nostr';

const FILTER_TABS: { id: PlatformFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'mastodon', label: '🐘 Mastodon' },
  { id: 'bluesky',  label: '🦋 Bluesky' },
  { id: 'nostr',    label: '⚡ Nostr' },
];

// Skeleton loader matching DREAMengin style
function SkeletonCard() {
  return (
    <div
      style={{
        background: 'rgba(5,15,45,0.4)',
        border: '1px solid rgba(100,150,255,0.07)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(100,150,255,0.08)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: 'rgba(100,150,255,0.1)', borderRadius: 4, marginBottom: 6, width: '50%' }} />
          <div style={{ height: 8, background: 'rgba(100,150,255,0.07)', borderRadius: 4, marginBottom: 4, width: '80%' }} />
          <div style={{ height: 8, background: 'rgba(100,150,255,0.07)', borderRadius: 4, width: '65%' }} />
        </div>
      </div>
    </div>
  );
}

export default function DecentralizedFeedPanel() {
  const [filter, setFilter] = useState<PlatformFilter>('all');
  const { posts, loading, error, refresh, sources } = useDecentralizedFeed();

  const filtered: NormalizedPost[] =
    filter === 'all' ? posts : posts.filter((p) => p.platform === filter);

  const hasAnyData = posts.length > 0;

  return (
    <div>
      {/* Platform filter bar */}
      <div
        style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          padding: '10px 0 12px',
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              background: filter === tab.id ? 'rgba(100,150,255,0.18)' : 'rgba(100,150,255,0.06)',
              border: `1px solid ${filter === tab.id ? 'rgba(100,150,255,0.4)' : 'rgba(100,150,255,0.12)'}`,
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11, fontWeight: filter === tab.id ? 700 : 500,
              color: filter === tab.id ? 'rgba(200,220,255,0.95)' : 'rgba(160,185,255,0.55)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
            {tab.id !== 'all' && sources.includes(tab.id) && (
              <span
                style={{
                  marginLeft: 4,
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
              />
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh decentralized feed"
          style={{
            marginLeft: 'auto',
            background: 'none', border: 'none',
            cursor: loading ? 'default' : 'pointer',
            color: 'rgba(160,185,255,0.4)',
            fontSize: 15, padding: 4, lineHeight: 1,
            opacity: loading ? 0.4 : 1,
          }}
        >
          ↺
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '12px 14px', fontSize: 11,
            color: 'rgba(255,100,100,0.7)',
            background: 'rgba(255,50,50,0.06)',
            border: '1px solid rgba(255,50,50,0.15)',
            borderRadius: 10, marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !hasAnyData && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Empty state */}
      {!loading && !hasAnyData && !error && (
        <div
          style={{
            padding: '32px 16px', textAlign: 'center',
            color: 'rgba(160,185,255,0.35)', fontSize: 12,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
          <p style={{ margin: '0 0 10px' }}>No decentralized feeds connected</p>
          <Link
            href="/connectors"
            style={{
              color: 'rgba(100,150,255,0.7)',
              textDecoration: 'underline',
              fontSize: 11,
            }}
          >
            Connect Mastodon, Bluesky, or Nostr →
          </Link>
        </div>
      )}

      {/* No results for current filter */}
      {!loading && hasAnyData && filtered.length === 0 && (
        <div
          style={{
            padding: '28px 16px', textAlign: 'center',
            color: 'rgba(160,185,255,0.35)', fontSize: 12,
          }}
        >
          No posts from {filter} yet
        </div>
      )}

      {/* Feed cards */}
      <div style={{ maxHeight: 520, overflowY: 'auto', overflowX: 'hidden' }}>
        {filtered.map((post) => (
          <DecentralizedFeedCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
