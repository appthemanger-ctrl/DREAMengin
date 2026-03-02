'use client';

import React, { useEffect, useState, useCallback } from 'react';

type Story = {
  id: number;
  title: string;
  url?: string;
  by: string;
  score: number;
  descendants?: number;
  time: number;
};

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function domain(url?: string): string {
  if (!url) return 'news.ycombinator.com';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

export default function LiveNewsFeed() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news?limit=30');
      if (!res.ok) throw new Error('Failed to load news');
      const data = await res.json();
      setStories(data.stories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section
      style={{
        width: '100%',
        background: 'rgba(5,15,45,0.7)',
        borderRadius: 20,
        border: '1px solid rgba(100,150,255,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 10px',
          borderBottom: '1px solid rgba(100,150,255,0.1)',
        }}
      >
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--de-gold, #d4a843)' }}>
            Live
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading, #f0f4ff)', marginLeft: 8 }}>
            Hacker News
          </span>
        </div>
        <button
          type="button"
          aria-label="Refresh news"
          onClick={() => { void load(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(160,185,255,0.5)', fontSize: 14, padding: 4,
          }}
        >
          ↺
        </button>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 420, overflowY: 'auto', padding: '4px 0' }}>
        {loading && (
          <div style={{ padding: '24px 18px', color: 'rgba(160,185,255,0.4)', fontSize: 13, textAlign: 'center' }}>
            Loading…
          </div>
        )}
        {error && (
          <div style={{ padding: '16px 18px', color: 'rgba(255,100,100,0.7)', fontSize: 12 }}>
            {error}
          </div>
        )}
        {!loading && !error && stories.map((s, i) => (
          <a
            key={s.id}
            href={s.url ?? `https://news.ycombinator.com/item?id=${s.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 18px',
              borderBottom: '1px solid rgba(100,150,255,0.07)',
              textDecoration: 'none', color: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(100,150,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 11, color: 'rgba(160,185,255,0.35)', minWidth: 20, paddingTop: 2, userSelect: 'none' }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading, #f0f4ff)', lineHeight: 1.4, marginBottom: 3 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(160,185,255,0.45)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>{domain(s.url)}</span>
                <span>▲ {s.score}</span>
                <span>{s.descendants ?? 0} comments</span>
                <span>{timeAgo(s.time)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
