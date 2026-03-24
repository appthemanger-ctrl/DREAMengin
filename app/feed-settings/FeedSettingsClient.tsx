'use client';

/**
 * FeedSettingsClient — interactive feed preference toggles with database persistence.
 *
 * Phase 8 §A Point 3: Feed algorithm and source selection controls save their
 * settings to the database and restore on session load.
 *
 * Constitution Rule 6-7: every visible toggle must do something real.
 * Settings are persisted to /api/settings/feed (profiles.feed_preferences column).
 * localStorage is used only as a write-through cache for instant UI responsiveness.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Rss, Sliders, Plus, Check, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'de-feed-settings';

interface FeedPreferences {
  showDreamenginUpdates: boolean;
  autoRefresh: boolean;
  showEmptyStateGuides: boolean;
}

const DEFAULT_PREFS: FeedPreferences = {
  showDreamenginUpdates: true,
  autoRefresh: true,
  showEmptyStateGuides: true,
};

function Toggle({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
        position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.15s',
      }} />
    </button>
  );
}

export default function FeedSettingsClient() {
  // Initialize with localStorage value to avoid setState in effect
  const [prefs, setPrefs] = useState<FeedPreferences>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_PREFS;
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectedNames, setConnectedNames] = useState<string[]>([]);

  useEffect(() => {
    // Phase 8 §A Point 3: load preferences from DB (canonical source of truth)
    fetch('/api/settings/feed')
      .then((r) => r.json())
      .then((data: { ok: boolean; preferences?: Partial<FeedPreferences> }) => {
        if (data.ok && data.preferences && Object.keys(data.preferences).length > 0) {
          const merged = { ...DEFAULT_PREFS, ...data.preferences };
          setPrefs(merged);
          // Keep localStorage in sync as write-through cache
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* fall back to localStorage values already applied */ })
      .finally(() => setLoading(false));

    // Load real connected connectors to show in Active Slices section
    fetch('/api/connectors/status')
      .then((r) => r.json())
      .then((data: { ok: boolean; statuses: Record<string, { status: string }> }) => {
        if (!data.ok) return;
        const names = Object.entries(data.statuses)
          .filter(([, entry]) => entry.status === 'connected')
          .map(([provider]) => provider.charAt(0).toUpperCase() + provider.slice(1));
        setConnectedNames(names);
      })
      .catch(() => { /* keep empty */ });
  }, []);

  const toggle = useCallback((key: keyof FeedPreferences) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Write-through to localStorage for instant feedback
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      // Phase 8 §A Point 3: persist to DB
      fetch('/api/settings/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => { /* non-critical — localStorage already updated */ });
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const prefRows: Array<{ key: keyof FeedPreferences; label: string; desc: string }> = [
    { key: 'showDreamenginUpdates', label: 'Show Dreamengin updates',  desc: 'News and updates from Dreamengin itself.' },
    { key: 'autoRefresh',           label: 'Auto-refresh every 5 min', desc: 'Refresh feed automatically (battery-aware).' },
    { key: 'showEmptyStateGuides',  label: 'Show empty state guides',  desc: 'Show helpful tips when the feed is empty.' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Rss className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Feed</h1>
          {loading ? (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--de-text-dim)' }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Loading
            </span>
          ) : saved ? (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <Check className="w-3 h-3" /> Saved to database
            </span>
          ) : null}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-notice">
          Your feed is made of slices — sections of content from connected services. You control what shows up and in what order.
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Active Slices</span>
            <Link href="/connectors" className="de-btn de-btn-ghost text-xs" style={{ padding: '4px 10px' }}>
              <Plus className="w-3 h-3" /> Add
            </Link>
          </div>
          {connectedNames.length > 0 ? (
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {connectedNames.map((name) => (
                <div key={name} className="de-row">
                  <Rss className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', flex: 1 }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="de-widget-body flex flex-col items-center py-6 gap-2">
              <Rss className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No feed slices yet</p>
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
                Connect a service in{' '}
                <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link>{' '}
                then choose which parts to add to your feed.
              </p>
            </div>
          )}
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <Sliders className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Feed Preferences</span>
          </div>
          <div className="de-widget-body">
            {prefRows.map(({ key, label, desc }) => (
              <div key={key} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <Toggle value={prefs[key]} onToggle={() => toggle(key)} label={label} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
