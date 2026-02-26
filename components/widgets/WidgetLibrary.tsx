'use client';

import React, { useState } from 'react';

interface WidgetDef {
  id: string;
  name: string;
  description: string;
  category: 'Feed' | 'Media' | 'Social' | 'Utilities' | 'Work' | 'Shop';
  icon: string;
}

const WIDGET_CATALOG: WidgetDef[] = [
  { id: 'feed-main',   name: 'Main Feed',       description: 'Your primary content stream.',               category: 'Feed',      icon: '📰' },
  { id: 'feed-topic',  name: 'Topic Slice',      description: 'A slice of news or content by topic.',       category: 'Feed',      icon: '🏷️' },
  { id: 'play-media',  name: 'Play Media',       description: 'Music and video player with queue.',          category: 'Media',     icon: '▶️' },
  { id: 'media-thumb', name: 'Media Gallery',    description: 'Photo and video thumbnails from your vault.', category: 'Media',     icon: '🖼️' },
  { id: 'ig-friend',   name: 'IG: Friend Feed',  description: 'Posts from a specific Instagram friend.',    category: 'Social',    icon: '📸' },
  { id: 'yt-channel',  name: 'YouTube Channel',  description: 'Latest videos from a channel.',              category: 'Social',    icon: '📺' },
  { id: 'spotify',     name: 'Spotify Now',      description: 'What you\'re listening to on Spotify.',      category: 'Social',    icon: '🎵' },
  { id: 'weather',     name: 'Weather',          description: 'Current conditions and forecast.',            category: 'Utilities', icon: '🌤️' },
  { id: 'calendar',    name: 'Calendar',         description: 'Upcoming events and schedule.',              category: 'Work',      icon: '📅' },
  { id: 'tasks',       name: 'Tasks',            description: 'Quick task list for today.',                 category: 'Work',      icon: '✅' },
  { id: 'analytics',   name: 'Analytics',        description: 'Key metrics at a glance.',                   category: 'Work',      icon: '📊' },
  { id: 'shop-feed',   name: 'Shop Feed',        description: 'Featured items from the marketplace.',       category: 'Shop',      icon: '🛍️' },
];

const CATEGORIES = ['All', 'Feed', 'Media', 'Social', 'Utilities', 'Work', 'Shop'] as const;

interface WidgetLibraryProps {
  onAdd?: (widgetId: string, destination: string) => void;
  onClose?: () => void;
}

export default function WidgetLibrary({ onAdd, onClose }: WidgetLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('All');
  const [adding, setAdding] = useState<string | null>(null);
  const [destination, setDestination] = useState('Home');

  const filtered = WIDGET_CATALOG.filter(
    (w) => activeCategory === 'All' || w.category === activeCategory
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="de-sheet"
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px 16px 32px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)' }}>Add Widget</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>Choose a widget to add to your space</div>
          </div>
          <button type="button" className="de-btn de-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onClose}>Close</button>
        </div>

        {/* Category tabs */}
        <div className="de-tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`de-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recently added section (stub) */}
        {activeCategory === 'All' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--de-text-dim)', marginBottom: 8 }}>Recently Added</div>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(160,195,240,0.1)', border: '1px dashed rgba(160,195,240,0.3)', fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center' }}>
              No widgets added recently
            </div>
          </div>
        )}

        {/* Widget grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map((widget) => (
            <div
              key={widget.id}
              className="de-surface"
              style={{ padding: 14, cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{widget.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>{widget.name}</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.4 }}>{widget.description}</div>
              <button
                type="button"
                className="de-btn de-btn-primary"
                style={{ width: '100%', padding: '7px 12px', fontSize: 11 }}
                onClick={() => setAdding(widget.id)}
              >
                Add Widget
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Destination chooser sheet */}
      {adding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setAdding(null)}
        >
          <div
            className="de-sheet"
            style={{ width: 'min(22rem, 92vw)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>
              Where should this go?
            </div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 16 }}>
              Choose where this widget will appear.
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {['Home', 'Profile', 'Public Profile'].map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => setDestination(dest)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${destination === dest ? 'var(--de-accent)' : 'var(--de-border)'}`,
                    background: destination === dest ? 'rgba(42,138,184,0.08)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 600,
                    color: destination === dest ? 'var(--de-accent)' : 'var(--de-text)',
                  }}
                >
                  {dest === 'Public Profile' ? '🌐 ' : dest === 'Profile' ? '👤 ' : '🏠 '}{dest}
                  {dest === 'Public Profile' && (
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: 'var(--de-text-dim)', marginTop: 2 }}>
                      Visible to anyone visiting your profile URL
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="de-btn de-btn-primary"
                style={{ flex: 1 }}
                onClick={() => { onAdd?.(adding, destination); setAdding(null); }}
              >
                Add Now
              </button>
              <button
                type="button"
                className="de-btn de-btn-ghost"
                onClick={() => setAdding(null)}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
