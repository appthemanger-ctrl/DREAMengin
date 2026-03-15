'use client';

/**
 * FeedSettingsClient — interactive feed preference toggles with localStorage persistence.
 *
 * Constitution Rule 6-7: every visible toggle must do something real.
 * Settings are persisted to localStorage so they survive page reloads.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Rss, Sliders, Plus, Check } from 'lucide-react';

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
  const [prefs, setPrefs] = useState<FeedPreferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback((key: keyof FeedPreferences) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
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
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
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
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Rss className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No feed slices yet</p>
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Connect a service in{' '}
              <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link>{' '}
              then choose which parts to add to your feed.
            </p>
          </div>
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
