'use client';

/**
 * FeedSettingsPanel — inline feed preferences, extracted from FeedSettingsClient.
 * Same logic, no page chrome (no min-h-screen, no header with back Links).
 */

import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import {
  ALL_TOPICS,
  DEFAULT_TOPIC_IDS,
  FEED_TOPICS_KEY,
  loadActiveTopicIds,
} from '@/lib/feed/feedTopics';

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
    <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
        position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0,
        transition: 'background 0.15s',
      }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.15s',
      }} />
    </button>
  );
}

export default function FeedSettingsPanel() {
  const [prefs, setPrefs] = useState<FeedPreferences>(DEFAULT_PREFS);
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set(DEFAULT_TOPIC_IDS));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
    setActiveTopics(new Set(loadActiveTopicIds()));
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

  const toggleTopic = useCallback((id: string) => {
    setActiveTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try { localStorage.setItem(FEED_TOPICS_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set(ALL_TOPICS.map((t) => t.id));
    setActiveTopics(all);
    try { localStorage.setItem(FEED_TOPICS_KEY, JSON.stringify(Array.from(all))); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const resetDefaults = useCallback(() => {
    const def = new Set(DEFAULT_TOPIC_IDS);
    setActiveTopics(def);
    try { localStorage.setItem(FEED_TOPICS_KEY, JSON.stringify(DEFAULT_TOPIC_IDS)); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const prefRows: Array<{ key: keyof FeedPreferences; label: string; desc: string }> = [
    { key: 'showDreamenginUpdates', label: 'Show Dreamengin updates',  desc: 'News and updates from Dreamengin itself.' },
    { key: 'autoRefresh',           label: 'Auto-refresh every 5 min', desc: 'Refresh feed automatically (battery-aware).' },
    { key: 'showEmptyStateGuides',  label: 'Show empty state guides',  desc: 'Show helpful tips when the feed is empty.' },
  ];

  const allSelected = activeTopics.size >= ALL_TOPICS.length;

  return (
    <div style={{ padding: '12px 0 100px' }}>
      {saved && (
        <div style={{
          margin: '0 16px 12px', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(42,138,184,0.08)', border: '1px solid rgba(42,138,184,0.2)',
          color: 'var(--de-accent)', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Check size={14} /> Saved
        </div>
      )}

      {/* ── Feed Topics ─────────────────────────────────────────────────── */}
      <div className="de-widget" style={{ margin: '0 16px 16px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="de-widget-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="de-widget-title">Feed Topics</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={selectAll} disabled={allSelected}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-accent)', background: 'none', border: 'none', cursor: allSelected ? 'default' : 'pointer', opacity: allSelected ? 0.4 : 1, padding: '2px 6px' }}>
              All
            </button>
            <button type="button" onClick={resetDefaults}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              Reset
            </button>
          </div>
        </div>
        <div className="de-widget-body" style={{ padding: '8px 12px 12px' }}>
          {allSelected && (
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10, padding: '6px 8px', borderRadius: 8, background: 'rgba(42,138,184,0.06)', border: '1px solid rgba(42,138,184,0.15)' }}>
              All 30 topics active — mixed feed, new video every 10 s
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TOPICS.map((topic) => {
              const active = activeTopics.has(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  aria-pressed={active}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: active ? '1px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.3)',
                    background: active ? 'rgba(42,138,184,0.12)' : 'transparent',
                    color: active ? 'var(--de-accent)' : 'var(--de-text-dim)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── General Preferences ─────────────────────────────────────────── */}
      <div className="de-widget" style={{ margin: '0 16px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="de-widget-header"><span className="de-widget-title">Feed Preferences</span></div>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          {prefRows.map(({ key, label, desc }, idx) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 8px',
              borderBottom: idx < prefRows.length - 1 ? '1px solid rgba(160,195,240,0.15)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>{desc}</div>
              </div>
              <Toggle value={prefs[key]} onToggle={() => toggle(key)} label={label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
