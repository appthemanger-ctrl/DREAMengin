'use client';

import React, { useState } from 'react';
import { useEditMode } from './EditModeProvider';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onConfigure?: () => void;
  onHide?: () => void;
  onRemove?: () => void;
  isPinned?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function WidgetCard({
  title,
  children,
  actions,
  onConfigure,
  onHide,
  onRemove,
  isPinned,
  className = '',
  style,
}: WidgetCardProps) {
  const { isEditing } = useEditMode();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`de-widget${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        outline: isEditing ? '2px solid rgba(200,152,26,0.4)' : 'none',
        ...style,
      }}
    >
      {/* Title strip */}
      <div className="de-widget-header">
        {isEditing && (
          <div className="de-drag-handle" aria-label="Drag to reorder" style={{ marginRight: 6 }}>
            ⠿
          </div>
        )}
        <span className="de-widget-title">{title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPinned && !isEditing && (
            <span title="Pinned" style={{ fontSize: 11, color: 'var(--de-gold)' }}>📌</span>
          )}
          {/* Widget menu button */}
          <button
            type="button"
            aria-label="Dream options"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--de-border)',
              background: 'var(--de-mist)',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--de-text-dim)',
            }}
          >
            ···
          </button>
        </div>
      </div>

      {/* Inline options popover */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 12,
            zIndex: 20,
            background: 'rgba(245,250,255,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(160,195,240,0.5)',
            borderRadius: 14,
            padding: 6,
            minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          {[
            { label: '⚙️  Configure', fn: onConfigure },
            { label: '👁  Hide from feed', fn: onHide },
            { label: '🗑  Remove Dream', fn: onRemove, danger: true },
          ].map(({ label, fn, danger }) => (
            <button
              key={label}
              type="button"
              onClick={() => { setMenuOpen(false); fn?.(); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: danger ? '#dc4444' : 'var(--de-text)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="de-widget-body">{children}</div>

      {/* Actions row */}
      {actions && <div className="de-widget-actions">{actions}</div>}
    </div>
  );
}
