'use client';
/**
 * ConnectorWidgetPicker
 * ---------------------
 * Shown in edit-widget mode inside ProfileWidgetGrid.
 * S.I.C.C. — Stylized, Intuitive, Coherent, Cohesive.
 *
 * HARD RULE: connectors whose widget type is already in the grid
 * are permanently disabled and cannot be tapped.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Check, Plug, ArrowRight } from 'lucide-react';
import type { WidgetType } from '@/components/profile/ProfileWidgetGrid';

// ── Top-10 connector definitions ─────────────────────────────────────────────

export interface PickerConnector {
  id: string;
  name: string;
  /** Displayed in the icon bubble — emoji or short text */
  symbol: string;
  /** CSS color for the icon bubble text / ring */
  brandColor: string;
  /** CSS background for icon bubble */
  iconBg: string;
  /** 1-liner shown under the name */
  description: string;
  /** Profile widget type this maps to (enforces the hard rule) */
  widgetType: WidgetType;
}

export const TOP_10_CONNECTORS: PickerConnector[] = [
  {
    id: 'twitter',
    name: 'X / Twitter',
    symbol: '𝕏',
    brandColor: '#1DA1F2',
    iconBg: 'rgba(29,161,242,0.13)',
    description: 'Timeline & bookmarks',
    widgetType: 'twitter',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    symbol: '📸',
    brandColor: '#E1306C',
    iconBg: 'rgba(225,48,108,0.13)',
    description: 'Photos, stories & saved posts',
    widgetType: 'instagram',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    symbol: 'in',
    brandColor: '#0A66C2',
    iconBg: 'rgba(10,102,194,0.13)',
    description: 'Job alerts & network updates',
    widgetType: 'linkedin',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    symbol: '♫',
    brandColor: '#1DB954',
    iconBg: 'rgba(29,185,84,0.13)',
    description: 'Now playing & playlists',
    widgetType: 'spotify',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    symbol: '▶',
    brandColor: '#FF0000',
    iconBg: 'rgba(255,0,0,0.10)',
    description: 'Subscriptions & watch history',
    widgetType: 'youtube',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    symbol: '🎬',
    brandColor: '#69C9D0',
    iconBg: 'rgba(105,201,208,0.13)',
    description: 'Following feed & saved videos',
    widgetType: 'tiktok',
  },
  {
    id: 'github',
    name: 'GitHub',
    symbol: '⬡',
    brandColor: '#6e40c9',
    iconBg: 'rgba(110,64,201,0.12)',
    description: 'Repos, PRs & activity',
    widgetType: 'github',
  },
  {
    id: 'apple',
    name: 'Apple Music',
    symbol: '♩',
    brandColor: '#FA243C',
    iconBg: 'rgba(250,36,60,0.11)',
    description: 'Library & recent plays',
    widgetType: 'apple',
  },
  {
    id: 'weather',
    name: 'Weather',
    symbol: '☁',
    brandColor: '#4A9ED6',
    iconBg: 'rgba(74,158,214,0.13)',
    description: 'Live forecast & conditions',
    widgetType: 'weather',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    symbol: '👻',
    brandColor: '#c8981a',
    iconBg: 'rgba(255,252,0,0.15)',
    description: 'Stories & memories',
    widgetType: 'snapchat',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export interface ConnectorWidgetPickerProps {
  /** Widget types already present in the grid — these connectors are DISABLED */
  activeWidgetTypes: WidgetType[];
  /** Called when the user confirms adding a connector's widget */
  onAdd: (connector: PickerConnector) => void;
  /** Called to close the picker */
  onClose: () => void;
}

export default function ConnectorWidgetPicker({
  activeWidgetTypes,
  onAdd,
  onClose,
}: ConnectorWidgetPickerProps) {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<PickerConnector | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TOP_10_CONNECTORS;
    return TOP_10_CONNECTORS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }, [query]);

  function handleCardTap(connector: PickerConnector) {
    // HARD RULE: already in grid → do nothing
    if (activeWidgetTypes.includes(connector.widgetType)) return;
    setPending(connector);
  }

  function handleConfirm() {
    if (!pending) return;
    onAdd(pending);
    setPending(null);
    onClose();
  }

  return (
    <>
      {/* ── Frosted backdrop ── */}
      <div
        onClick={() => { if (pending) { setPending(null); } else { onClose(); } }}
        style={{
          position: 'fixed', inset: 0, zIndex: 210,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* ── Bottom sheet ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 211,
        background: 'linear-gradient(175deg, #f8fafd 0%, #f0f4fa 100%)',
        borderRadius: '26px 26px 0 0',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.22)',
        maxHeight: '86svh',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}>

        {/* ── Handle ── */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.15)' }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(200,152,26,0.30)',
            }}>
              <Plug size={15} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>
                Connect a Service
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                Tap to add as a Dream
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/connectors"
              style={{
                fontSize: 11, fontWeight: 700, color: '#c8981a',
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              All connectors <ArrowRight size={11} />
            </Link>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,0,0,0.07)', border: 'none',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} style={{ color: '#555' }} />
            </button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'rgba(255,255,255,0.90)',
            borderRadius: 14, padding: '10px 14px',
            border: '1px solid rgba(160,195,240,0.30)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <Search size={14} style={{ color: '#aaa', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search connectors…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: '#1a1a1a',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
                <X size={13} style={{ color: '#aaa' }} />
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 0' }}>

          {/* ── Confirmation phase ── */}
          {pending && (
            <div style={{
              background: 'rgba(255,255,255,0.96)',
              borderRadius: 22,
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(160,195,240,0.30)',
              marginBottom: 18,
              animation: 'cpk-pop 180ms cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {/* Brand icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: pending.iconBg,
                  border: `2px solid ${pending.brandColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: pending.symbol.length > 1 ? 22 : 30,
                  fontWeight: 900, color: pending.brandColor,
                  boxShadow: `0 4px 20px ${pending.brandColor}25`,
                }}>
                  {pending.symbol}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 5 }}>
                  Would you like to add
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 900,
                  color: pending.brandColor,
                  marginBottom: 6,
                }}>
                  {pending.name}
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>
                  {pending.description} — added as a widget to your profile grid.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setPending(null)}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    background: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#555', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 2, padding: '13px 0', borderRadius: 14,
                    background: `linear-gradient(135deg, ${pending.brandColor}, ${pending.brandColor}cc)`,
                    border: 'none', color: '#fff',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    boxShadow: `0 6px 20px ${pending.brandColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Check size={16} /> Add {pending.name}
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Link
                  href={`/connectors#${pending.id}`}
                  style={{ fontSize: 11, color: '#777', textDecoration: 'none' }}
                >
                  Manage connection in Connectors →
                </Link>
              </div>
            </div>
          )}

          {/* ── Grid of connector cards ── */}
          {!pending && (
            <>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
                  No connectors match "{query}"
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  paddingBottom: 12,
                }}>
                  {filtered.map((connector) => {
                    const isAdded = activeWidgetTypes.includes(connector.widgetType);
                    return (
                      <ConnectorCard
                        key={connector.id}
                        connector={connector}
                        isAdded={isAdded}
                        onTap={handleCardTap}
                      />
                    );
                  })}
                </div>
              )}

              {/* All connectors link */}
              <Link
                href="/connectors"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '14px 0',
                  fontSize: 13, fontWeight: 700, color: '#c8981a',
                  textDecoration: 'none',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  marginTop: 4,
                }}
              >
                <Plug size={14} />
                Browse all connectors
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cpk-pop {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}

// ── Connector card ────────────────────────────────────────────────────────────

function ConnectorCard({
  connector, isAdded, onTap,
}: {
  connector: PickerConnector;
  isAdded: boolean;
  onTap: (c: PickerConnector) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => !isAdded && onTap(connector)}
      disabled={isAdded}
      onPointerDown={() => !isAdded && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: isAdded
          ? 'rgba(255,255,255,0.55)'
          : 'rgba(255,255,255,0.92)',
        borderRadius: 18,
        padding: '14px 14px 12px',
        border: isAdded
          ? '1.5px solid rgba(0,0,0,0.06)'
          : `1.5px solid ${connector.brandColor}28`,
        boxShadow: isAdded
          ? 'none'
          : `0 3px 14px ${connector.brandColor}18, 0 1px 4px rgba(0,0,0,0.06)`,
        cursor: isAdded ? 'default' : 'pointer',
        opacity: isAdded ? 0.52 : 1,
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s, opacity 0.15s, box-shadow 0.15s',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Added checkmark badge */}
      {isAdded && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 20, height: 20, borderRadius: '50%',
          background: '#22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={11} style={{ color: '#fff' }} />
        </div>
      )}

      {/* Brand icon bubble */}
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: connector.iconBg,
        border: `1.5px solid ${connector.brandColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: connector.symbol.length > 2 ? 16 : 20,
        fontWeight: 900, color: connector.brandColor,
        marginBottom: 9,
        boxShadow: isAdded ? 'none' : `0 2px 8px ${connector.brandColor}22`,
      }}>
        {connector.symbol}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 13, fontWeight: 800,
        color: isAdded ? '#aaa' : '#1a1a1a',
        lineHeight: 1.2, marginBottom: 3,
      }}>
        {connector.name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 10, color: isAdded ? '#bbb' : '#888',
        lineHeight: 1.35,
      }}>
        {connector.description}
      </div>

      {/* Status pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        marginTop: 8, padding: '3px 8px',
        borderRadius: 99,
        background: isAdded
          ? 'rgba(34,197,94,0.10)'
          : `${connector.brandColor}14`,
        fontSize: 9, fontWeight: 700,
        color: isAdded ? '#22c55e' : connector.brandColor,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {isAdded ? <><Check size={9} /> Added</> : '+ Add widget'}
      </div>
    </button>
  );
}
