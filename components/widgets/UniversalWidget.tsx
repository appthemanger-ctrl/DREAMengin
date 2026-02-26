'use client';

import React, { useState } from 'react';
import WidgetCard from './WidgetCard';

type ServiceType = 'instagram' | 'youtube' | 'spotify' | 'news' | 'weather' | 'github' | null;

interface UniversalWidgetProps {
  service?: ServiceType;
  title?: string;
  sliceName?: string;
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

export default function UniversalWidget({ service = null, title, sliceName }: UniversalWidgetProps) {
  const [showAddWidgets, setShowAddWidgets] = useState(false);
  const config = service ? SERVICE_CONFIGS[service] : null;
  const displayTitle = title || config?.label || 'Universal Widget';

  return (
    <WidgetCard title={displayTitle}>
      {!service ? (
        // Not connected state
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
        // Connected state
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
            <span style={{ fontSize: 28 }}>{config?.icon}</span>
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center' }}>{config?.placeholder}</p>
          </div>

          {/* Add Widgets suggestion */}
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
