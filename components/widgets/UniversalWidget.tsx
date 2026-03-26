'use client';

import React, { useEffect, useMemo, useState } from 'react';
import WidgetCard from './WidgetCard';

type ServiceType = 'instagram' | 'youtube' | 'spotify' | 'news' | 'weather' | 'github' | null;

interface UniversalWidgetProps {
  service?: ServiceType;
  title?: string;
  sliceName?: string;
}

interface ConnectorFeedItem {
  external_id: string;
  author_name: string;
  content_text: string;
  permalink: string;
  published_at: string;
  media?: Array<{
    url: string;
    type: string;
    thumbnail_url?: string;
    alt?: string;
  }>;
}

const SERVICE_CONFIGS: Record<NonNullable<ServiceType>, {
  icon: string;
  label: string;
  placeholder: string;
  color: string;
}> = {
  instagram: { icon: '📸', label: 'Instagram',   placeholder: 'Connect Instagram to see your feed',   color: '#e1306c' },
  youtube:   { icon: '📺', label: 'YouTube',     placeholder: 'Connect YouTube to see subscriptions', color: '#ff0000' },
  spotify:   { icon: '🎵', label: 'Spotify',     placeholder: 'Connect Spotify to see what\'s playing', color: '#1db954' },
  news:      { icon: '📰', label: 'News',         placeholder: 'Add a news topic to this slice',       color: '#0ea5e9' },
  weather:   { icon: '🌤️', label: 'Weather',     placeholder: 'Set your location to see weather',     color: '#60a5fa' },
  github:    { icon: '🐙', label: 'GitHub',       placeholder: 'Connect GitHub to see your activity',  color: '#333'    },
};

function timeLabel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function UniversalWidget({ service = null, title, sliceName }: UniversalWidgetProps) {
  const [showAddWidgets, setShowAddWidgets] = useState(false);
  const [items, setItems] = useState<ConnectorFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const config = service ? SERVICE_CONFIGS[service] : null;
  const displayTitle = title || config?.label || 'Universal Widget';

  const supportsLiveFeed = useMemo(
    () => service === 'youtube' || service === 'github',
    [service],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!service || !supportsLiveFeed) return;
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/connectors/${service}/items?limit=6`, { cache: 'no-store' });
        const data = await res.json() as { ok: boolean; items?: ConnectorFeedItem[]; error?: string };
        if (cancelled) return;
        if (data.ok) {
          setItems(data.items ?? []);
        } else {
          setItems([]);
          setLoadError(data.error ?? 'Unable to load live items.');
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoadError('Unable to load live items.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [service, supportsLiveFeed]);

  return (
    <WidgetCard title={displayTitle}>
      {!service ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
          <span style={{ fontSize: 28, opacity: 0.3 }}>∞</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>Universal Widget</p>
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
            Connect a service to fill this widget with live content.
          </p>
          <button
            type="button"
            className="de-btn de-btn-ghost"
            style={{ fontSize: 11, marginTop: 4 }}
            onClick={() => setShowAddWidgets(true)}
          >
            + Connect Service
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sliceName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(160,195,240,0.1)', border: '1px solid rgba(160,195,240,0.2)' }}>
              <span style={{ fontSize: 16 }}>{config?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{sliceName}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>via {config?.label}</div>
              </div>
            </div>
          )}

          {supportsLiveFeed && items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => {
                const thumb = item.media?.[0]?.thumbnail_url;
                return (
                  <a
                    key={item.external_id}
                    href={item.permalink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      gap: 10,
                      textDecoration: 'none',
                      padding: '8px 6px',
                      borderRadius: 12,
                      background: 'rgba(160,195,240,0.08)',
                      border: '1px solid rgba(160,195,240,0.16)',
                    }}
                  >
                    <div style={{
                      width: 84,
                      height: 52,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: 'rgba(160,195,240,0.12)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={item.media?.[0]?.alt ?? item.content_text}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{config?.icon}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>
                          {item.author_name}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                          {timeLabel(item.published_at)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'var(--de-heading)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.content_text}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
              <span style={{ fontSize: 28 }}>{config?.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center' }}>
                {loading ? 'Loading live content…' : config?.placeholder}
              </p>
              {loadError && (
                <p style={{ fontSize: 10, color: '#dc4444', textAlign: 'center' }}>
                  {loadError}
                </p>
              )}
            </div>
          )}

          {showAddWidgets && (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(42,138,184,0.08)', border: '1px solid rgba(42,138,184,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>Add Widgets for {config?.label}</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                Would you like to add relevant widgets for {config?.label}?
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="de-btn de-btn-primary" style={{ fontSize: 10, padding: '5px 10px' }}>Add Suggested</button>
                <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 10, padding: '5px 10px' }} onClick={() => setShowAddWidgets(false)}>Not Now</button>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
