'use client';

import React, { useState } from 'react';

interface ConfigField {
  key: string;
  label: string;
  type: 'toggle' | 'text' | 'select';
  value: string | boolean;
  options?: string[];
  description?: string;
}

interface ConfigureSheetProps {
  title: string;
  description?: string;
  fields?: ConfigField[];
  onSave?: (values: Record<string, string | boolean>) => void;
  onReset?: () => void;
  onClose: () => void;
}

export default function ConfigureSheet({
  title,
  description,
  fields = [],
  onSave,
  onReset,
  onClose,
}: ConfigureSheetProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  const set = (key: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="de-sheet"
        style={{ width: 'min(24rem, 94vw)', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 18, lineHeight: 1.5 }}>{description}</div>
        )}

        {fields.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>
            No configuration options for this widget.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {fields.map((field) => (
              <div key={field.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{field.label}</div>
                    {field.description && (
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>{field.description}</div>
                    )}
                  </div>
                  {field.type === 'toggle' && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(values[field.key])}
                      onClick={() => set(field.key, !values[field.key])}
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 13,
                        background: values[field.key] ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 3,
                        left: values[field.key] ? 21 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  )}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={String(values[field.key])}
                      onChange={(e) => set(field.key, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--de-border)',
                        background: 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        width: 120,
                        color: 'var(--de-text)',
                      }}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={String(values[field.key])}
                      onChange={(e) => set(field.key, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--de-border)',
                        background: 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        color: 'var(--de-text)',
                      }}
                    >
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="de-btn de-btn-primary" style={{ flex: 1 }} aria-label={`Save ${title} configuration`} onClick={() => { onSave?.(values); onClose(); }}>
            Save
          </button>
          <button type="button" className="de-btn de-btn-ghost" onClick={onClose}>Cancel</button>
          {onReset && (
            <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 11 }} onClick={onReset}>Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}
