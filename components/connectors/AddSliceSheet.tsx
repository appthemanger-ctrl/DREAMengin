'use client';
// components/connectors/AddSliceSheet.tsx
// "Add as Feed Slice" flow (req 51-60)
//
// Steps: service → slice type → preview → add (req 55)
// Max 5 slice types shown (req 56)
// Preview shows exactly what will appear (req 57)
// Removing a slice does NOT disconnect the connector (req 60)

import React, { useState } from 'react';
import type { ConnectorDef, SliceTypeDef } from '@/lib/connectors/connectorRegistry';
import { track } from '@/lib/telemetry';

export interface FeedSlice {
  id: string;
  connectorId: string;
  sliceTypeId: string;
  label: string;
  order: number;
}

type Step = 'pick' | 'preview';

export interface AddSliceSheetProps {
  connector: ConnectorDef;
  existingSlices: FeedSlice[];
  onAdd: (slice: Omit<FeedSlice, 'order'>) => void;
  onClose: () => void;
}

export default function AddSliceSheet({
  connector,
  existingSlices,
  onAdd,
  onClose,
}: AddSliceSheetProps) {
  const [step, setStep] = useState<Step>('pick');
  const [selected, setSelected] = useState<SliceTypeDef | null>(null);

  // Limit to 5 slice types (req 56)
  const available = connector.sliceTypes.slice(0, 5);

  function handlePick(st: SliceTypeDef) {
    setSelected(st);
    setStep('preview');
  }

  function handleAdd() {
    if (!selected) return;
    const slice: Omit<FeedSlice, 'order'> = {
      id: `${connector.id}-${selected.id}-${Date.now()}`,
      connectorId: connector.id,
      sliceTypeId: selected.id,
      label: selected.label,
    };
    track('add_slice', { connectorId: connector.id, sliceTypeId: selected.id });
    onAdd(slice);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 85,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="de-sheet"
        style={{ width: '100%', maxWidth: 540, padding: '20px 16px 36px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('pick')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--de-accent)' }}
                aria-label="Back"
              >
                ←
              </button>
            )}
            <span style={{ fontSize: 18 }}>{connector.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)' }}>
                {step === 'pick' ? `Add ${connector.name} Slice` : 'Preview'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>
                {step === 'pick' ? 'Choose a slice type for your feed.' : 'This is exactly what will appear.'}
              </div>
            </div>
          </div>
          <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={onClose}>
            Close
          </button>
        </div>

        {/* Pick step */}
        {step === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {available.map((st) => {
              const alreadyAdded = existingSlices.some(
                (s) => s.connectorId === connector.id && s.sliceTypeId === st.id,
              );
              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => handlePick(st)}
                  style={{
                    padding: '12px 16px', borderRadius: 14,
                    border: '1.5px solid rgba(160,195,240,0.4)',
                    background: alreadyAdded ? 'rgba(160,195,240,0.1)' : 'rgba(255,255,255,0.6)',
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    textAlign: 'left', opacity: alreadyAdded ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {st.label} {alreadyAdded && '✓'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
                    {st.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Preview step (req 57 — shows exactly what will appear) */}
        {step === 'preview' && selected && (
          <div>
            {/* Preview card (req 57) */}
            <div style={{
              padding: 16, borderRadius: 16,
              border: '1.5px solid rgba(42,138,184,0.3)',
              background: 'rgba(42,138,184,0.06)',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{connector.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                    {connector.name} — {selected.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Feed slice</div>
                </div>
              </div>
              {/* Skeleton preview rows to show the shape of content */}
              {[80, 100, 65].map((w, i) => (
                <div key={i} style={{
                  height: 10, borderRadius: 5, marginBottom: 6,
                  background: 'rgba(42,138,184,0.15)', width: `${w}%`,
                }} />
              ))}
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
                {selected.description}
              </div>
            </div>

            <button
              type="button"
              className="de-btn de-btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={handleAdd}
            >
              Add to Feed
            </button>
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 8 }}>
              Removing this slice later will not disconnect {connector.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
