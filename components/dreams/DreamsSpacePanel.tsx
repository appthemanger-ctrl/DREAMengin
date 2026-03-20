'use client';

/**
 * components/dreams/DreamsSpacePanel.tsx
 *
 * Dreams Space — the DreamSpace world panel.
 *
 * Rendered whenever a runtime region's world is set to 'DreamSpace'.
 * Either the Surface Space or the DreamSpace region can load this world,
 * allowing two independent DreamSpace sessions simultaneously (e.g. two
 * Daydreams or Engins open at the same time in separate runtime regions).
 *
 * Each mounted instance maintains its own independent navigation state
 * (active service, detail URL, etc.) — opening content in one region does
 * not affect the other.
 *
 * Permanent iOS-style app windows are the priority content of the Dreams Space.
 * The 6 Daydream surfaces plus Engin apps (Shop, Marketplace, Ads, Links) are
 * pinned as permanent windows, organized like an iOS home screen, and remain
 * in place until the user changes them.
 *
 * Architecture note (docs/AXIOMS.md §3 — every visible action must do
 * something real): app icons now navigate to the real canonical routes via
 * router.push() instead of embedding them in dead-end iframes.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UniversalWidget from '@/components/widgets/UniversalWidget';
import { useDreamsRuntime } from '@/lib/dreams/useDreamsRuntime';

/** Called to open a URL inside the runtime region (no full-page navigation). */
type OpenUrlFn = (url: string, title?: string) => void;

type ServiceType = 'youtube' | 'github' | 'spotify' | null;
/** Top-level view for the Dreams Space panel: Apps home screen (priority) or connector Feeds. */
type DreamsSpaceView = 'apps' | 'feeds';

/** The 6 canonical Daydream surfaces — permanent windows from DreamSpace. */
const DAYDREAMS = [
  { id: 'music',  label: 'Music',  icon: '🎵', route: '/daydream/music',  color: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { id: 'games',  label: 'Games',  icon: '🎮', route: '/daydream/games',  color: 'linear-gradient(135deg,#059669,#10b981)' },
  { id: 'lab',    label: 'Lab',    icon: '🔬', route: '/daydream/lab',    color: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
  { id: 'code',   label: 'Code',   icon: '💻', route: '/daydream/code',   color: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  { id: 'brand',  label: 'Brand',  icon: '🎨', route: '/daydream/brand',  color: 'linear-gradient(135deg,#b45309,#f59e0b)' },
  { id: 'create', label: 'Create', icon: '✏️', route: '/daydream/create', color: 'linear-gradient(135deg,#be185d,#ec4899)' },
] as const;

/**
 * Permanent Engin app windows — Shop, Marketplace, Ads, and Links (Connectors).
 * These are always pinned in the DreamSpace alongside the Daydream windows.
 */
const ENGIN_APPS = [
  { id: 'shop',        label: 'Shop',    icon: '🛍️', route: '/shop',        color: 'linear-gradient(135deg,#065f46,#059669)' },
  { id: 'marketplace', label: 'Market',  icon: '🏪', route: '/marketplace', color: 'linear-gradient(135deg,#581c87,#9333ea)' },
  { id: 'ads',         label: 'Ads',     icon: '📢', route: '/ads',         color: 'linear-gradient(135deg,#1e3a8a,#2563eb)' },
  { id: 'connectors',  label: 'Links',   icon: '🔗', route: '/connectors',  color: 'linear-gradient(135deg,#0e7490,#06b6d4)' },
] as const;

const SERVICE_TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: null,      label: 'All',     icon: '✨' },
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'github',  label: 'GitHub',  icon: '🐙' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
];

// iOS-style app icon layout constants
const ICON_SIZE = 54;
const ICON_RADIUS = 14;
const ICON_FONT = 26;
const LABEL_FONT = 11;

/**
 * iOS-style squircle app icon.
 * Clicking navigates to the canonical surface route — no iframe dead-ends.
 */
function AppIcon({ icon, label, color, onClick }: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const press   = () => setPressed(true);
  const release = () => setPressed(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      onTouchStart={press}
      onTouchEnd={release}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press()}
      onKeyUp={(e)   => (e.key === 'Enter' || e.key === ' ') && release()}
      aria-label={`Open ${label}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 2px',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Squircle icon — iOS-style rounded square with gradient background */}
      <div style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
        fontSize: ICON_FONT,
        lineHeight: 1,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      {/* App label */}
      <span style={{
        fontSize: LABEL_FONT,
        fontWeight: 600,
        color: 'var(--de-heading)',
        letterSpacing: '0.01em',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: 62,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  );
}

export default function DreamsSpacePanel({ onOpenInRegion }: { onOpenInRegion?: (path: string) => void }) {
export default function DreamsSpacePanel({ onOpenUrl }: { onOpenUrl?: OpenUrlFn }) {
  const runtime = useDreamsRuntime();
  const { state, setService } = runtime;
  const router = useRouter();

  // If a contained-navigation callback is provided use it; otherwise fall back to full navigation.
  const navigate = (route: string) => {
    if (onOpenInRegion) {
      onOpenInRegion(route);
  /** Navigate to a route: use in-region iframe when available, else full navigation. */
  const navigate = (route: string, title?: string) => {
    if (onOpenUrl) {
      onOpenUrl(route, title);
    } else {
      router.push(route);
    }
  };

  // Apps home screen is the priority tab — permanent windows shown by default.
  const [view, setView] = useState<DreamsSpaceView>('apps');

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
          dual runtime
        </span>
      </div>

      {/* Primary tab bar — Apps home screen first (priority), Feeds second */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 10px 6px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(200,152,26,0.12)',
      }}>
        {(['apps', 'feeds'] as DreamsSpaceView[]).map((v) => {
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
              {v === 'apps' ? '⊞ Apps' : '✨ Feeds'}
            </button>
          );
        })}
      </div>

      {view === 'apps' ? (
        /* ── Permanent iOS-style app home screen ─────────────────────────────── */
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 16px' }}>

          {/* Section: Daydreams */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--de-text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 4px 8px',
            }}>
              Daydreams
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px 4px',
              justifyItems: 'center',
            }}>
              {DAYDREAMS.map((dd) => (
                <AppIcon
                  key={dd.id}
                  icon={dd.icon}
                  label={dd.label}
                  color={dd.color}
                  onClick={() => navigate(dd.route)}
                  onClick={() => navigate(dd.route, dd.label)}
                />
              ))}
            </div>
          </div>

          {/* Section: Engin — Shop, Marketplace, Ads, Links */}
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--de-text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 4px 8px',
            }}>
              Engin
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px 4px',
              justifyItems: 'center',
            }}>
              {ENGIN_APPS.map((app) => (
                <AppIcon
                  key={app.id}
                  icon={app.icon}
                  label={app.label}
                  color={app.color}
                  onClick={() => navigate(app.route)}
                  onClick={() => navigate(app.route, app.label)}
                />
              ))}
            </div>
          </div>

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

