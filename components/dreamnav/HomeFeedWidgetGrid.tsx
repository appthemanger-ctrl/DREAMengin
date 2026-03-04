'use client';

import React, { useState } from 'react';
import { EditModeProvider, useEditMode } from '@/components/widgets/EditModeProvider';
import EditModeBanner from '@/components/widgets/EditModeBanner';
import WidgetCard from '@/components/widgets/WidgetCard';
import WidgetLibrary from '@/components/widgets/WidgetLibrary';
import Link from 'next/link';

/* ── Main Feed Widget ── */
function MainFeedWidget() {
  return (
    <WidgetCard
      title="Home Feed"
      actions={
        <Link href="/feed-settings" className="de-btn de-btn-ghost" style={{ fontSize: 11 }}>
          Feed Settings
        </Link>
      }
    >
      <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Placeholder feed posts */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(160,195,240,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.2)' }} />
              <div>
                <div style={{ width: 80, height: 9, borderRadius: 4, background: 'rgba(160,195,240,0.3)' }} />
                <div style={{ width: 50, height: 7, borderRadius: 4, background: 'rgba(160,195,240,0.18)', marginTop: 4 }} />
              </div>
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(160,195,240,0.18)', marginBottom: 4 }} />
            <div style={{ width: '75%', height: 8, borderRadius: 4, background: 'rgba(160,195,240,0.12)' }} />
          </div>
        ))}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>Connect services in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link> to populate your feed</p>
        </div>
      </div>
    </WidgetCard>
  );
}

/* ── Supporting widgets ── */
function YouTubeWidget() {
  return (
    <WidgetCard title="YouTube">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
        <span style={{ fontSize: 24 }}>📺</span>
        <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center' }}>
          Connect YouTube in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link>
        </p>
      </div>
    </WidgetCard>
  );
}

function SpotifyWidget() {
  return (
    <WidgetCard title="Spotify">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
        <span style={{ fontSize: 24 }}>🎵</span>
        <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center' }}>
          Connect Spotify in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link>
        </p>
      </div>
    </WidgetCard>
  );
}

function WeatherWidget() {
  return (
    <WidgetCard title="Weather">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
        <span style={{ fontSize: 32 }}>🌤️</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)' }}>—°</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Location not set</div>
        </div>
      </div>
    </WidgetCard>
  );
}

function PortfolioWidget() {
  return (
    <WidgetCard title="Portfolio">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {['Views', 'Clicks', 'Followers', 'Reach'].map((m) => (
          <div key={m} className="de-metric de-surface">
            <span className="de-metric-value" style={{ fontSize: 20 }}>—</span>
            <span className="de-metric-label">{m}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

/* ── Inner component (has access to useEditMode) ── */
function HomeGrid() {
  const { isEditing, enterEdit, exitEdit } = useEditMode();
  const [showLibrary, setShowLibrary] = useState(false);
  const [widgets, setWidgets] = useState([
    'youtube', 'spotify', 'weather', 'portfolio',
  ]);

  const handleAddWidget = (widgetId: string, _destination: string) => {
    setWidgets((prev) => [...prev, widgetId]);
    setShowLibrary(false);
  };

  return (
    <div style={{ width: '100%', paddingBottom: 80 }}>
      <EditModeBanner />

      {/* Edit / Done bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
        {!isEditing ? (
          <button
            type="button"
            className="de-btn de-btn-ghost"
            style={{ fontSize: 11, padding: '6px 14px' }}
            onClick={enterEdit}
          >
            ✏️ Edit Layout
          </button>
        ) : (
          <>
            <button
              type="button"
              className="de-btn de-btn-primary"
              style={{ fontSize: 11, padding: '6px 14px' }}
              onClick={() => setShowLibrary(true)}
            >
              + Add Widget
            </button>
            <button
              type="button"
              className="de-btn de-btn-gold"
              style={{ fontSize: 11, padding: '6px 14px' }}
              onClick={exitEdit}
            >
              Done
            </button>
          </>
        )}
      </div>

      {/* Main feed widget */}
      <div style={{ marginBottom: 14 }}>
        <MainFeedWidget />
      </div>

      {/* Supporting widgets grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {widgets.includes('youtube')   && <YouTubeWidget />}
        {widgets.includes('spotify')   && <SpotifyWidget />}
        {widgets.includes('weather')   && <WeatherWidget />}
        {widgets.includes('portfolio') && <PortfolioWidget />}
      </div>

      {/* Widget library */}
      {showLibrary && (
        <WidgetLibrary
          onAdd={handleAddWidget}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

/* ── Exported component (provides context) ── */
export default function HomeFeedWidgetGrid({ onOpenDrEams: _onOpenDrEams }: { onOpenDrEams?: () => void }) {
  return (
    <EditModeProvider>
      <HomeGrid />
    </EditModeProvider>
  );
}
