'use client';

/**
 * components/dreams/DreamsSpacePanel.tsx
 *
 * Dreams Space — a separate runtime panel attached to the DreamDM bar.
 *
 * Revealed when the DreamDM bar is dragged upward.
 * Hidden when the bar is dragged back down.
 *
 * This space is entirely separate from the main home runtime:
 * - opening content here does not navigate the home view
 * - the dreams space maintains its own navigation state
 * - uses UniversalWidget to render live provider content
 */

import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import UniversalWidget from '@/components/widgets/UniversalWidget';
import { useDreamsRuntime } from '@/lib/dreams/useDreamsRuntime';

type ServiceType = 'youtube' | 'github' | 'spotify' | null;

const SERVICE_TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: null,      label: 'All',     icon: '✨' },
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'github',  label: 'GitHub',  icon: '🐙' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
];

export default function DreamsSpacePanel() {
  const runtime = useDreamsRuntime();
  const { state, goToFeed, setService } = runtime;

  // Detail view — open an item in its own context inside the Dreams Space
  if (state.view === 'detail' && state.detailUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid rgba(200,152,26,0.2)',
          background: 'rgba(20,10,40,0.6)',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={goToFeed}
            aria-label="Back to Dreams Feed"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center', padding: 4,
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {state.detailTitle ?? 'Dreams Space'}
          </span>
          <a
            href={state.detailUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in new tab"
            style={{ color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Iframe view — content opens inside Dreams Space, not home */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <iframe
            src={state.detailUrl}
            title={state.detailTitle ?? 'Dreams Space content'}
            style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    );
  }

  // Feed view — main dreams space content
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px 6px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)', letterSpacing: '-0.02em' }}>
          Dreams Space
        </span>
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginLeft: 'auto', fontStyle: 'italic' }}>
          separate from home
        </span>
      </div>

      {/* Service tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 10px 8px',
        overflowX: 'auto', flexShrink: 0,
      }}>
        {SERVICE_TABS.map((tab) => {
          const isActive = state.activeService === tab.id;
          return (
            <button
              key={tab.id ?? 'all'}
              type="button"
              onClick={() => setService(tab.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                border: isActive
                  ? '1px solid rgba(200,152,26,0.6)'
                  : '1px solid rgba(160,195,240,0.2)',
                background: isActive
                  ? 'rgba(200,152,26,0.15)'
                  : 'rgba(160,195,240,0.06)',
                color: isActive ? '#d4a843' : 'var(--de-text-dim)',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Widget content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {state.activeService === null ? (
          // All services
          <>
            <UniversalWidget service="youtube" sliceName="Subscriptions" />
            <UniversalWidget service="github" sliceName="Activity" />
          </>
        ) : (
          // Single service
          <UniversalWidget
            service={state.activeService as ServiceType}
            sliceName={
              state.activeService === 'youtube' ? 'Subscriptions' :
              state.activeService === 'github'  ? 'Activity' :
              state.activeService === 'spotify' ? 'Now Playing' :
              undefined
            }
          />
        )}
      </div>
    </div>
  );
}
