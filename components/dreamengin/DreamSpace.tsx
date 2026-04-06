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

interface DreamSpaceProps {
  initialAccountId?: string | null;
}

export default function DreamSpace({ initialAccountId }: DreamSpaceProps) {
  const { accountId } = useAccount(initialAccountId);
  const [artifacts, setArtifacts] = useState<DreamArtifact[]>([]);
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
