'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings2, Music, Image, Box, Code2, Play, X } from 'lucide-react';
import { useAccount } from '@/hooks/useAccount';
import {
  listSystemArtifacts,
  listVisibleArtifacts,
  restoreArtifact,
} from '@/lib/artifactStore';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import type { DreamArtifact } from '@/types/dreamArtifact';
import { getAllAssets, storeAsset, type AssetEntry, type AssetKind } from '@/lib/ledger';
import { createLedger } from '@/lib/ledger';

/** Module-level shared ledger for DreamSpace asset grid. */
const _dreamSpaceLedger = createLedger();

// ─── Asset icon helpers ───────────────────────────────────────────────────────

function AssetIcon({ kind, size = 18 }: { kind: AssetKind; size?: number }) {
  const color = kind === 'audio' ? '#00d0f0' : kind === 'image' ? '#a855f7' : kind === '3d' ? '#22c55e' : '#f59e0b';
  const style: React.CSSProperties = { color, flexShrink: 0 };
  switch (kind) {
    case 'audio':   return <Music  size={size} style={style} aria-hidden />;
    case 'image':   return <Image  size={size} style={style} aria-hidden />;
    case '3d':      return <Box    size={size} style={style} aria-hidden />;
    case 'code':    return <Code2  size={size} style={style} aria-hidden />;
  }
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function AssetPreviewModal({ asset, onClose }: { asset: AssetEntry; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal
      aria-label={`Preview: ${asset.name || asset.id}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#0d1120', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AssetIcon kind={asset.assetKind} size={20} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#e2e5ee', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.name || asset.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7585' }}
          >
            <X size={18} />
          </button>
        </div>
        {/* Audio player */}
        {asset.assetKind === 'audio' && asset.url && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={asset.url} style={{ width: '100%', borderRadius: 8 }} />
        )}
        {/* Image viewer */}
        {asset.assetKind === 'image' && asset.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.name || 'Asset'} style={{ width: '100%', borderRadius: 10, maxHeight: 320, objectFit: 'contain' }} />
        )}
        {/* Code viewer */}
        {asset.assetKind === 'code' && (
          <pre style={{
            background: '#060a14', borderRadius: 8, padding: 12, overflowX: 'auto',
            fontSize: 11, color: '#a5d8ff', maxHeight: 280,
          }}>
            {asset.url || '(no content)'}
          </pre>
        )}
        {/* 3D placeholder */}
        {asset.assetKind === '3d' && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6e7585', fontSize: 13 }}>
            <Box size={32} style={{ margin: '0 auto 8px', color: '#22c55e' }} />
            <div>3D model preview — open in an Engin to explore</div>
          </div>
        )}
        {/* Metadata */}
        <div style={{ marginTop: 12, fontSize: 10, color: '#6e7585' }}>
          ID: {asset.id} · Kind: {asset.assetKind} · Owner: {asset.owner || 'anonymous'}
        </div>
      </div>
    </div>
  );
}

interface DreamSpaceProps {
  initialAccountId?: string | null;
}

export default function DreamSpace({ initialAccountId }: DreamSpaceProps) {
  const { accountId } = useAccount(initialAccountId);
  const [artifacts, setArtifacts] = useState<DreamArtifact[]>([]);
  // ── Ledger asset grid state ──
  const [ledgerAssets, setLedgerAssets] = useState<AssetEntry[]>([]);
  const [previewAsset, setPreviewAsset] = useState<AssetEntry | null>(null);
  /** tap-hold timer for drag-to-runtime */
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSystemModules, setShowSystemModules] = useState(false);

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

  // ── Ledger asset grid effects ─────────────────────────────────────────────
  // Seed a few demo assets on first render if the ledger is empty
  useEffect(() => {
    if (_dreamSpaceLedger.entries.size === 0) {
      storeAsset(_dreamSpaceLedger, 'audio', '', { mimeType: 'audio/wav', note: 'demo' }, accountId ?? '', 'Demo Beat');
      storeAsset(_dreamSpaceLedger, 'image', '', { mimeType: 'image/png', note: 'demo' }, accountId ?? '', 'Cover Art');
      storeAsset(_dreamSpaceLedger, '3d',    '', { format: 'glb',  note: 'demo' }, accountId ?? '', '3D Scene');
      storeAsset(_dreamSpaceLedger, 'code',  'console.log("hello DREAMengin");', { lang: 'js' }, accountId ?? '', 'Script');
    }
    setLedgerAssets(getAllAssets(_dreamSpaceLedger));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh ledger grid when OS bus emits an artifact:new event
  useEffect(() => {
    const unsub = dreamOSBus.on('artifact:new', () => {
      setLedgerAssets(getAllAssets(_dreamSpaceLedger));
    });
    return unsub;
  }, []);

  // Tap-hold drag: dispatch a custom event to notify the host runtime after 300 ms hold
  const handleAssetPointerDown = useCallback((asset: AssetEntry) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dreamspace:asset-hold', {
        detail: { assetId: asset.id, assetKind: asset.assetKind, from: 'dreamspace' },
      }));
    }, 300);
  }, []);

  const handleAssetPointerUp = useCallback(() => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }, []);


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
    <>
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

    {/* ── Ledger Asset Grid (Visualized File System) ──────────────────────── */}
    {ledgerAssets.length > 0 && (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16,
          padding: '12px 12px 10px',
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(10,20,48,0.65), rgba(5,10,24,0.60))',
          border: '1px solid rgba(0,208,240,0.14)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>
          Asset Ledger
        </div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
          Tap to preview · Hold to drag to any runtime
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
          }}
        >
          {ledgerAssets.map((asset) => (
            <div
              key={asset.id}
              role="button"
              tabIndex={0}
              aria-label={`${asset.name || asset.id} (${asset.assetKind})`}
              onClick={() => setPreviewAsset(asset)}
              onPointerDown={() => handleAssetPointerDown(asset)}
              onPointerUp={handleAssetPointerUp}
              onPointerCancel={handleAssetPointerUp}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPreviewAsset(asset); }}
              style={{
                borderRadius: 16,
                padding: '10px 12px 9px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border: '1px solid rgba(0,208,240,0.16)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                minHeight: 88,
                userSelect: 'none',
                transition: 'border-color 0.15s ease, transform 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <AssetIcon kind={asset.assetKind} size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {asset.name || asset.id}
                </span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.3 }}>
                {asset.assetKind.toUpperCase()}
                {asset.manifest.mimeType ? ` · ${String(asset.manifest.mimeType).split('/')[1]?.toUpperCase() ?? ''}` : ''}
              </span>
              <button
                type="button"
                aria-label={`Open ${asset.name || asset.id}`}
                onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(0,208,240,0.10)', border: '1px solid rgba(0,208,240,0.22)',
                  borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
                  fontSize: 9, fontWeight: 700, color: '#00d0f0', marginTop: 'auto',
                }}
              >
                <Play size={9} /> Preview
              </button>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Preview modal */}
    {previewAsset && (
      <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
    )}
    </>
  );
}
