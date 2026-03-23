'use client';

/**
 * components/feeds/EmbedFeedWidget.tsx
 *
 * Renders the baked social embed feed populated by the GitHub Actions
 * `update-embed-feed` workflow.
 *
 * Data source: GET /api/embed-feed (Supabase `embed_feed_items` → JSON fallback)
 *
 * Features:
 *   • Provider filter tabs (All / YouTube / Instagram)
 *   • YouTube iframes (16:9 aspect-ratio, lazy-load)
 *   • Instagram oEmbed blockquotes with embed.js loader
 *   • Thumbnail fallback for items with no embed support
 *   • View count, tags, channel name, relative time
 *   • Loading skeleton + empty state
 *   • Refresh button to re-fetch without page reload
 *
 * Props:
 *   defaultProvider — initial provider tab ('all' | 'youtube' | 'instagram')
 *   limit           — max items to load (default 20)
 *   className       — optional wrapper class
 *
 * AXIOMS.md §3 — Every visible action does something real (Refresh calls the API).
 * ARCHITECTURE.md §3 — Component layer; no DB calls; fetches from /api/embed-feed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ExternalLink, Eye, Hash } from 'lucide-react';
import type { EmbedFeedItem } from '@/lib/feeds/embedFeedLoader';

// ── Types ─────────────────────────────────────────────────────────────────────

type Provider = 'all' | 'youtube' | 'instagram';

interface EmbedFeedWidgetProps {
  defaultProvider?: Provider;
  limit?: number;
  className?: string;
}

interface FeedState {
  items: EmbedFeedItem[];
  generatedAt: string;
  loading: boolean;
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatViews(n: number): string {
  if (n <= 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n.toLocaleString()} views`;
}

// ── Instagram embed script loader ─────────────────────────────────────────────

function useInstagramEmbedScript(hasInstagram: boolean) {
  useEffect(() => {
    if (!hasInstagram) return;
    if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
      // Already loaded — trigger re-process for new blockquotes
      if (typeof window !== 'undefined' && (window as Record<string, unknown>).instgrm) {
        ((window as Record<string, unknown>).instgrm as { Embeds: { process: () => void } })
          .Embeds.process();
      }
      return;
    }
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }, [hasInstagram]);
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: 'rgba(160,195,240,0.08)',
      border: '1px solid rgba(160,195,240,0.12)',
    }}>
      <div style={{
        width: '100%', paddingTop: '56.25%',
        background: 'rgba(160,195,240,0.15)',
        animation: 'de-pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, borderRadius: 6, background: 'rgba(160,195,240,0.18)', width: '80%' }} />
        <div style={{ height: 11, borderRadius: 6, background: 'rgba(160,195,240,0.12)', width: '50%' }} />
      </div>
    </div>
  );
}

// ── Embed card ────────────────────────────────────────────────────────────────

function EmbedCard({ item }: { item: EmbedFeedItem }) {
  const isYouTube   = item.provider === 'youtube';
  const isInstagram = item.provider === 'instagram';

  // Extract YouTube video ID for a proper iframe
  const ytId = isYouTube ? item.id : null;

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(160,195,240,0.14)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Embed area ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        {isYouTube && ytId ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
            <iframe
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              src={`https://www.youtube.com/embed/${ytId}`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : isInstagram ? (
          <div style={{ padding: '0 4px', background: '#fff' }}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={item.permalink}
              data-instgrm-version="14"
              style={{
                background: '#FFF',
                border: 0,
                borderRadius: 3,
                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                margin: '1px',
                minWidth: '326px',
                padding: 0,
                width: '99.375%',
              }}
            />
          </div>
        ) : item.thumbnail_url ? (
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnail_url}
              alt={item.title}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : null}
      </div>

      {/* ── Meta ── */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Title */}
        <a
          href={item.permalink}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            fontSize: 13, fontWeight: 600, lineHeight: 1.35,
            color: 'var(--de-heading)',
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title || item.permalink}
        </a>

        {/* Channel + views + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {item.channel_title && (
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 500 }}>
              {item.channel_title}
            </span>
          )}
          {item.view_count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--de-text-dim)' }}>
              <Eye size={9} />{formatViews(item.view_count)}
            </span>
          )}
          {item.published_at && (
            <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
              {relativeTime(item.published_at)}
            </span>
          )}
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open original post"
            style={{ marginLeft: 'auto', color: 'var(--de-accent)', opacity: 0.7 }}
          >
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontSize: 9, fontWeight: 600, padding: '2px 6px',
                  borderRadius: 99, background: 'rgba(160,195,240,0.12)',
                  color: 'var(--de-accent)',
                }}
              >
                <Hash size={7} />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmbedFeedWidget({
  defaultProvider = 'all',
  limit = 20,
  className = '',
}: EmbedFeedWidgetProps) {
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [state, setState] = useState<FeedState>({
    items: [],
    generatedAt: '',
    loading: true,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(async (prov: Provider) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (prov !== 'all') params.set('provider', prov);
      const res = await fetch(`/api/embed-feed?${params.toString()}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        ok: boolean; items: EmbedFeedItem[]; generated_at: string; error?: string;
      };
      if (!data.ok) throw new Error(data.error ?? 'Feed unavailable');
      setState({ items: data.items, generatedAt: data.generated_at, loading: false, error: null });
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setState((s) => ({
        ...s,
        loading: false,
        error: (err instanceof Error ? err.message : 'Failed to load embed feed'),
      }));
    }
  }, [limit]);

  useEffect(() => {
    fetchFeed(provider);
  }, [fetchFeed, provider]);

  const hasInstagram = state.items.some((i) => i.provider === 'instagram');
  useInstagramEmbedScript(hasInstagram);

  // ── Provider tabs ──────────────────────────────────────────────────────────
  const tabs: { id: Provider; label: string; icon: string }[] = [
    { id: 'all',       label: 'All',       icon: '✨' },
    { id: 'youtube',   label: 'YouTube',   icon: '📺' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
  ];

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProvider(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
                background: provider === tab.id
                  ? 'rgba(160,195,240,0.2)'
                  : 'transparent',
                border: provider === tab.id
                  ? '1px solid rgba(160,195,240,0.35)'
                  : '1px solid transparent',
                color: provider === tab.id
                  ? 'var(--de-accent)'
                  : 'var(--de-text-dim)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => fetchFeed(provider)}
          disabled={state.loading}
          aria-label="Refresh embed feed"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 8px', borderRadius: 8, fontSize: 11,
            background: 'transparent',
            border: '1px solid rgba(160,195,240,0.2)',
            color: 'var(--de-text-dim)',
            cursor: state.loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw
            size={11}
            style={{ animation: state.loading ? 'de-spin 1s linear infinite' : 'none' }}
          />
        </button>
      </div>

      {/* Generated-at timestamp */}
      {state.generatedAt && !state.loading && (
        <div style={{ fontSize: 10, color: 'var(--de-text-dim)', opacity: 0.7 }}>
          Feed updated {relativeTime(state.generatedAt)}
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(220,68,68,0.08)',
          color: '#dc4444', fontSize: 12,
        }}>
          {state.error}
        </div>
      )}

      {/* Loading skeletons */}
      {state.loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!state.loading && !state.error && state.items.length === 0 && (
        <div style={{
          padding: '32px 16px', textAlign: 'center',
          color: 'var(--de-text-dim)', fontSize: 13,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
          No embed items yet.{' '}
          {provider !== 'all' ? (
            <span>
              Try the <button type="button" onClick={() => setProvider('all')} style={{
                background: 'none', border: 'none', color: 'var(--de-accent)',
                cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit',
              }}>All</button> tab, or
            </span>
          ) : null}{' '}
          the feed is refreshed automatically every 6 hours by GitHub Actions.
        </div>
      )}

      {/* Feed grid */}
      {!state.loading && state.items.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {state.items.map((item) => (
            <EmbedCard key={`${item.provider}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
