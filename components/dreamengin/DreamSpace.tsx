'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useAccount } from '@/hooks/useAccount';
import {
  listSystemArtifacts,
  listVisibleArtifacts,
  restoreArtifact,
} from '@/lib/artifactStore';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import type { DreamArtifact } from '@/types/dreamArtifact';
import { useOS } from '@/lib/dreamenginOS/OSContext';
import { getAllByKind } from '@/lib/ledger';
import type { AssetEntry, AssetType } from '@/lib/ledger';

// ─── Asset icon helpers ───────────────────────────────────────────────────────

function assetIcon(type: AssetType): string {
  switch (type) {
    case 'audio': return '🎵';
    case 'image': return '🖼️';
    case '3d':    return '🧊';
    case 'code':  return '💻';
    default:      return '📄';
  }
}

interface DreamSpaceProps {
  initialAccountId?: string | null;
}

export default function DreamSpace({ initialAccountId }: DreamSpaceProps) {
  const { accountId } = useAccount(initialAccountId);
  const [artifacts, setArtifacts] = useState<DreamArtifact[]>([]);
  const [showSystemModules, setShowSystemModules] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetEntry | null>(null);

  // ── Ledger asset grid ─────────────────────────────────────────────────────
  const os = useOS();
  const [assetTick, setAssetTick] = useState(0);
  useEffect(() => {
    // Re-read ledger whenever a new asset is stored
    const unsub = os.bus.on('ledger:asset:new', () => setAssetTick((n) => n + 1));
    return () => os.bus.off('ledger:asset:new', () => setAssetTick((n) => n + 1));
  }, [os.bus]);
  const ledgerAssets = useMemo(
    () => getAllByKind(os.ledger, 'asset'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [os.ledger, assetTick]
  );

  const refreshArtifacts = useCallback(() => {
    setArtifacts(listVisibleArtifacts(accountId));
  }, [accountId]);

  useEffect(() => {
    refreshArtifacts();
  }, [refreshArtifacts]);

  useEffect(() => {
    const unsubscribeArtifact = dreamOSBus.on('artifact:new', ({ accountId: nextAccountId }) => {
      if (!accountId || nextAccountId === accountId) refreshArtifacts();
    });
    return unsubscribeArtifact;
  }, [accountId, refreshArtifacts]);

  const systemArtifacts = useMemo(
    () => listSystemArtifacts(accountId).filter((artifact) => artifact.metadata?.hidden === true),
    [accountId],
  );

  const onDragStart = (event: React.DragEvent, artifact: DreamArtifact) => {
    if (!accountId) return;
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ artifactId: artifact.id, accountId }),
    );
    event.dataTransfer.effectAllowed = 'copy';
    dreamOSBus.emit('drag:start', {
      artifact,
      accountId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const onDragEnd = (artifactId: string) => {
    if (!accountId) return;
    dreamOSBus.emit('drag:end', { artifactId, accountId });
  };

  const handleRestore = (artifactId: string) => {
    if (!accountId) return;
    restoreArtifact(accountId, artifactId);
    refreshArtifacts();
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
        padding: '12px 12px 10px',
        borderRadius: 22,
        background: 'linear-gradient(135deg, rgba(18,33,60,0.62), rgba(5,14,30,0.58))',
        border: '1px solid rgba(160,195,240,0.16)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
      }}
    >
      {/* ── Shared Asset Ledger Grid ───────────────────────────────────────── */}
      {ledgerAssets.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>
            Shared Assets
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 8,
            }}
          >
            {ledgerAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                aria-label={`Open ${asset.manifest.title ?? asset.type} asset`}
                onClick={() => setPreviewAsset(asset)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(160,195,240,0.18)',
                  borderRadius: 14,
                  padding: '10px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{assetIcon(asset.type)}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--de-heading)',
                    fontWeight: 600,
                    textAlign: 'center',
                    maxWidth: 72,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {asset.manifest.title ?? asset.type}
                </span>
                <span style={{ fontSize: 9, color: '#f4d37b', fontWeight: 700, textTransform: 'uppercase' }}>
                  {asset.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Asset Preview Modal ────────────────────────────────────────────── */}
      {previewAsset && (
        <div
          role="dialog"
          aria-label={`Preview: ${previewAsset.manifest.title ?? previewAsset.type}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(2,5,14,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setPreviewAsset(null)}
        >
          <div
            style={{
              background: 'rgba(18,33,60,0.97)',
              border: '1px solid rgba(160,195,240,0.22)',
              borderRadius: 24,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.40)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{assetIcon(previewAsset.type)}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>
                  {previewAsset.manifest.title ?? previewAsset.type}
                </div>
                <div style={{ fontSize: 11, color: '#f4d37b', fontWeight: 700, textTransform: 'uppercase' }}>
                  {previewAsset.type}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreviewAsset(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(180,185,200,0.12)',
                  border: 'none',
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--de-text-dim)',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
            {previewAsset.type === 'audio' && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio controls src={previewAsset.url} style={{ width: '100%', borderRadius: 8 }} />
            )}
            {previewAsset.type === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewAsset.url}
                alt={previewAsset.manifest.title ?? 'Asset'}
                style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'contain' }}
              />
            )}
            {(previewAsset.type === 'code' || previewAsset.type === '3d') && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 11,
                  color: 'var(--de-text-dim)',
                  wordBreak: 'break-all',
                }}
              >
                {previewAsset.url}
              </div>
            )}
            {previewAsset.manifest.description && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                {previewAsset.manifest.description}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>
            DreamSpace Artifact Tray
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
            Drag a module across the seam and drop it into HomeDream.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSystemModules((value) => !value)}
          aria-label="Open system modules"
          style={{
            marginLeft: 'auto',
            width: 36,
            height: 36,
            borderRadius: 12,
            border: '1px solid rgba(200,152,26,0.28)',
            background: 'rgba(200,152,26,0.14)',
            color: '#f4d37b',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Settings2 size={16} />
        </button>
      </div>

      <div
        className="dream-space-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
          gap: 10,
        }}
      >
        {artifacts.map((artifact) => (
          <div
            key={artifact.id}
            draggable
            onDragStart={(event) => onDragStart(event, artifact)}
            onDragEnd={() => onDragEnd(artifact.id)}
            className="artifact-card"
            style={{
              borderRadius: 18,
              padding: '12px 12px 10px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))',
              border: '1px solid rgba(160,195,240,0.18)',
              cursor: 'grab',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 96,
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{artifact.icon ?? '⬡'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                {artifact.name}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.35 }}>
              {artifact.description ?? artifact.capabilities.join(' · ')}
            </span>
            <span style={{ fontSize: 10, color: '#f4d37b', fontWeight: 700 }}>
              {artifact.capabilities.join(' • ')}
            </span>
          </div>
        ))}
      </div>

      {showSystemModules && (
        <div
          style={{
            borderRadius: 18,
            border: '1px solid rgba(200,152,26,0.18)',
            background: 'rgba(6,12,24,0.72)',
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>
            System Modules
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {systemArtifacts.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                All system modules are already visible in DreamSpace.
              </div>
            ) : (
              systemArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{artifact.icon ?? '⬡'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                      {artifact.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                      {artifact.capabilities.join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(artifact.id)}
                    style={{
                      marginLeft: 'auto',
                      borderRadius: 999,
                      border: '1px solid rgba(200,152,26,0.28)',
                      background: 'rgba(200,152,26,0.14)',
                      color: '#f4d37b',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
