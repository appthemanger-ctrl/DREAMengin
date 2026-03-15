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
 *
 * Daydreams are the priority content of the Dreams Space.
 * The 6 Daydream surfaces are surfaced first as live routes from
 * this second runtime, as described in the README runtime model.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import UniversalWidget from '@/components/widgets/UniversalWidget';
import { useDreamsRuntime } from '@/lib/dreams/useDreamsRuntime';

type ServiceType = 'youtube' | 'github' | 'spotify' | null;
/** Top-level view for the Dreams Space panel: Daydreams (priority) or connector Feeds. */
type DreamsSpaceView = 'daydreams' | 'feeds';

/** The 6 canonical Daydream surfaces — priority routes from DreamSpace. */
const DAYDREAMS = [
  { id: 'music',  label: 'Music',  icon: '🎵', route: '/daydream/music',  engin: 'StarMakerEngin' },
  { id: 'games',  label: 'Games',  icon: '🎮', route: '/daydream/games',  engin: 'GameEngin'      },
  { id: 'lab',    label: 'Lab',    icon: '🔬', route: '/daydream/lab',    engin: 'LabEngin'        },
  { id: 'code',   label: 'Code',   icon: '💻', route: '/daydream/code',   engin: 'CodeEngin'       },
  { id: 'brand',  label: 'Brand',  icon: '🎨', route: '/daydream/brand',  engin: 'BrandingEngin'   },
  { id: 'create', label: 'Create', icon: '✏️', route: '/daydream/create', engin: 'ContentEngin'    },
] as const;

const SERVICE_TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: null,      label: 'All',     icon: '✨' },
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'github',  label: 'GitHub',  icon: '🐙' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
];

export default function DreamsSpacePanel() {
  const router = useRouter();
  const runtime = useDreamsRuntime();
  const { state, goToFeed, setService } = runtime;

  // Daydreams are the priority tab — shown by default per the README runtime model.
  const [view, setView] = useState<DreamsSpaceView>('daydreams');

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
          second runtime
        </span>
      </div>

      {/* Primary tab bar — Daydreams first (priority), Feeds second */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 10px 6px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(200,152,26,0.12)',
      }}>
        {(['daydreams', 'feeds'] as DreamsSpaceView[]).map((v) => {
          const isActive = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #d4a843' : '2px solid transparent',
                color: isActive ? '#d4a843' : 'var(--de-text-dim)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              {v === 'daydreams' ? '✦ Daydreams' : '✨ Feeds'}
            </button>
          );
        })}
      </div>

      {view === 'daydreams' ? (
        /* ── Daydreams — priority routes from the second runtime ── */
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          alignContent: 'start',
        }}>
          {DAYDREAMS.map((dd) => (
            <button
              key={dd.id}
              type="button"
              onClick={() => router.push(dd.route)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '14px 8px',
                borderRadius: 12,
                border: '1px solid rgba(200,152,26,0.22)',
                background: 'rgba(200,152,26,0.07)',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,152,26,0.15)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,152,26,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,152,26,0.07)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,152,26,0.22)';
              }}
              aria-label={`Open ${dd.label} Daydream`}
            >
              <span style={{ fontSize: 22 }}>{dd.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                {dd.label}
              </span>
              <span style={{ fontSize: 9, color: 'var(--de-text-dim)', letterSpacing: '0.04em' }}>
                {dd.engin}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* ── Feeds — connector content ── */
        <>
          {/* Service tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: '6px 10px 8px',
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
        </>
      )}
    </div>
  );
}
