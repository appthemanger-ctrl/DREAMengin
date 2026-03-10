'use client';
// components/widgets/WidgetLibrary.tsx
// Single source of truth for widget catalog — uses widgetRegistry (req 41-42)
// "Add" list and "+" placeholder list are the same component/data (req 42)
// Suggested section driven by installFlow (req 8, 35)

import React, { useEffect, useState } from 'react';
import {
  WIDGET_REGISTRY,
  getWidgetTypeDef,
  resolveConnectorState,
} from '@/lib/widgets/widgetRegistry';
import {
  getSuggestedWidgets,
  dismissSuggestedWidget,
  type SuggestedWidget,
} from '@/lib/connectors/installFlow';

const CATEGORIES = ['All', 'Feed', 'Media', 'Social', 'Utilities', 'Work', 'Shop'] as const;

interface WidgetLibraryProps {
  onAdd?: (widgetId: string, destination: string) => void;
  onClose?: () => void;
  /** Connected connector IDs (used to show Connect / Reconnect CTAs — req 46-48) */
  connectedIds?: Set<string>;
  /** Expired connector IDs (req 48) */
  expiredIds?: Set<string>;
}

export default function WidgetLibrary({
  onAdd,
  onClose,
  connectedIds = new Set(),
  expiredIds = new Set(),
}: WidgetLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('All');
  const [adding, setAdding] = useState<string | null>(null);
  const [destination, setDestination] = useState('HomeDream');
  // Suggested widgets from installFlow store (req 8, 35)
  const [suggested, setSuggested] = useState<SuggestedWidget[]>([]);

  useEffect(() => {
    setSuggested(getSuggestedWidgets());
  }, []);

  function handleDismissSuggestion(widgetId: string) {
    dismissSuggestedWidget(widgetId);
    setSuggested(getSuggestedWidgets());
  }

  // Single source of truth: WIDGET_REGISTRY (req 41-42)
  const filtered = WIDGET_REGISTRY.filter(
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
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)' }}>Add Dream</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>Choose a Dream to add to your space</div>
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

        {/* Suggested section — ignored prompts from installFlow (req 8-9, 35) */}
        {activeCategory === 'All' && suggested.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--de-text-dim)', marginBottom: 8 }}>
              Suggested
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggested.map((s) => {
                const def = getWidgetTypeDef(s.widgetId);
                if (!def) return null;
                return (
                  <div key={s.widgetId} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 14,
                    background: 'rgba(42,138,184,0.06)',
                    border: '1px solid rgba(42,138,184,0.15)',
                  }}>
                    <span style={{ fontSize: 20 }}>{def.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{def.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>via {s.connectorName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdding(def.id)}
                      style={{
                        padding: '5px 10px', borderRadius: 8,
                        background: 'var(--de-accent)', border: 'none',
                        color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                    {/* Permanent dismiss (req 9) */}
                    <button
                      type="button"
                      aria-label={`Dismiss ${def.title} suggestion`}
                      onClick={() => handleDismissSuggestion(def.id)}
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(160,195,240,0.2)',
                        border: '1px solid rgba(160,195,240,0.4)',
                        color: 'var(--de-text-dim)', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Widget grid — single source of truth: WIDGET_REGISTRY (req 41-42) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map((widget) => {
            const connState = resolveConnectorState(widget.id, connectedIds, expiredIds);
            return (
              <div
                key={widget.id}
                className="de-surface"
                style={{ padding: 14, cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{widget.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>{widget.title}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.4 }}>{widget.description}</div>
                {/* Connector CTA (req 46-48) */}
                {connState === 'not_connected' && widget.connectorDependency === 'required' ? (
                  <button
                    type="button"
                    className="de-btn"
                    style={{ width: '100%', padding: '7px 12px', fontSize: 11, background: 'rgba(160,195,240,0.2)', border: '1px solid rgba(160,195,240,0.4)', color: 'var(--de-text)' }}
                    onClick={() => {/* navigate to /connectors */}}
                  >
                    Connect
                  </button>
                ) : connState === 'expired' ? (
                  <button
                    type="button"
                    className="de-btn"
                    style={{ width: '100%', padding: '7px 12px', fontSize: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#c8981a' }}
                    onClick={() => {/* navigate to /connectors */}}
                  >
                    Reconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="de-btn de-btn-primary"
                    style={{ width: '100%', padding: '7px 12px', fontSize: 11 }}
                    onClick={() => setAdding(widget.id)}
                  >
                    Add Dream
                  </button>
                )}
              </div>
            );
          })}
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
              Choose where this Dream will appear.
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {['HomeDream', 'EditProfileDream', 'ViewProfile'].map((dest) => (
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
                  {dest === 'ViewProfile' ? '🌐 ' : dest === 'EditProfileDream' ? '👤 ' : '🏠 '}{dest}
                  {dest === 'ViewProfile' && (
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: 'var(--de-text-dim)', marginTop: 2 }}>
                      Visible to anyone visiting your ViewProfile URL
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
