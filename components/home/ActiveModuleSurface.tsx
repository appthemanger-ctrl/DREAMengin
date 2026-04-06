'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { saveArtifact, loadArtifacts } from '@/lib/artifactStore';
import {
  loadActiveModules,
  removeActiveModule,
  saveActiveModule,
  saveActiveModules,
} from '@/lib/activeModulesStore';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import { DREAM_WINDOW_STATES } from '@/lib/dream-window/DreamWindowLifecycle';
import { useDreamWindowActions } from '@/lib/dream-window/useDreamWindowActions';
import type {
  ActiveModuleInstance,
  DreamArtifact,
  DreamArtifactDragPayload,
} from '@/types/dreamArtifact';

interface ActiveModuleSurfaceProps {
  accountId?: string | null;
}

interface GhostPreviewState {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

const DEFAULT_WINDOW_SIZE = { width: 600, height: 400 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveModulePosition(
  surface: HTMLDivElement,
  clientX: number,
  clientY: number,
  size = DEFAULT_WINDOW_SIZE,
) {
  const rect = surface.getBoundingClientRect();
  return {
    x: clamp(clientX - rect.left - size.width / 2, 16, Math.max(16, rect.width - size.width - 16)),
    y: clamp(clientY - rect.top - size.height / 2, 120, Math.max(120, rect.height - size.height - 16)),
  };
}

function shouldUseModuleLoader(moduleUrl?: string) {
  if (!moduleUrl) return true;
  return !moduleUrl.startsWith('/');
}

export default function ActiveModuleSurface({ accountId }: ActiveModuleSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const dragArtifactRef = useRef<DreamArtifact | null>(null);
  const activeModulesRef = useRef<ActiveModuleInstance[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModuleInstance[]>([]);
  const [ghostPreview, setGhostPreview] = useState<GhostPreviewState | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { addWindow, removeWindow, updateWindow } = useDreamWindowActions();
  const artifactMap = useMemo(
    () => new Map(loadArtifacts(accountId).map((artifact) => [artifact.id, artifact])),
    [accountId, activeModules],
  );

  useEffect(() => {
    if (!accountId) {
      setActiveModules([]);
      return;
    }
    setActiveModules(loadActiveModules(accountId));
  }, [accountId]);

  useEffect(() => {
    activeModulesRef.current = activeModules;
  }, [activeModules]);

  useEffect(() => {
    if (!accountId) return;
    saveActiveModules(accountId, activeModules);
  }, [accountId, activeModules]);

  useEffect(() => {
    const unsubscribeStart = dreamOSBus.on('drag:start', ({ artifact, accountId: sourceAccountId }) => {
      if (accountId && sourceAccountId === accountId) {
        dragArtifactRef.current = artifact;
        setIsDragActive(true);
      }
    });
    const unsubscribeEnd = dreamOSBus.on('drag:end', () => {
      dragArtifactRef.current = null;
      setGhostPreview(null);
      setIsDragActive(false);
    });
    return () => {
      unsubscribeStart();
      unsubscribeEnd();
    };
  }, [accountId]);

  const persistModulePosition = useCallback(
    async (instance: ActiveModuleInstance) => {
      if (!instance.dreamWindowId) return;
      await updateWindow(instance.dreamWindowId, {
        position: instance.position,
        size: instance.size,
      });
    },
    [updateWindow],
  );

  const createModuleInstance = useCallback(
    async (artifact: DreamArtifact, clientX: number, clientY: number) => {
      if (!accountId || !surfaceRef.current) return;
      const position = resolveModulePosition(surfaceRef.current, clientX, clientY);
      const instanceId = `module-${crypto.randomUUID()}`;

      const dreamWindow = await addWindow({
        id: crypto.randomUUID(),
        type: artifact.type,
        owner_id: accountId,
        config: {
          label: artifact.name,
          moduleUrl: artifact.moduleUrl ?? '/module-loader.html',
          artifactId: artifact.id,
          capabilities: artifact.capabilities,
        },
        size: DEFAULT_WINDOW_SIZE,
        position,
        visibility: 'private',
        sourceBindings: [artifact.id],
        destinationRules: [],
        activeState: DREAM_WINDOW_STATES.MOUNTED,
      });

      const instance: ActiveModuleInstance = {
        instanceId,
        artifactId: artifact.id,
        runtimeRegion: 'surface',
        containerId: instanceId,
        state: { createdFrom: 'drag-drop' },
        dreamWindowId: dreamWindow?.id,
        moduleUrl: artifact.moduleUrl,
        title: artifact.name,
        position,
        size: DEFAULT_WINDOW_SIZE,
      };

      setActiveModules((current) => [...current, instance]);
      saveActiveModule(accountId, instance);

      dreamOSBus.emit('capability:add', {
        artifactId: artifact.id,
        accountId,
        capabilities: artifact.capabilities,
      });
      dreamOSBus.upsertArtifact({
        id: `active-module:${instanceId}`,
        kind: 'asset',
        title: artifact.name,
        sourceSubsystem: artifact.isSystemModule ? 'DreamSpace' : 'User Module',
        relatedSubsystems: ['HomeDream Surface'],
        payload: {
          artifactId: artifact.id,
          moduleUrl: artifact.moduleUrl ?? '/module-loader.html',
          runtimeRegion: 'surface',
        },
      });
    },
    [accountId, addWindow],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!surfaceRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    const artifact = dragArtifactRef.current;
    if (!artifact) return;
    const position = resolveModulePosition(surfaceRef.current, event.clientX, event.clientY);
    setGhostPreview({
      x: position.x,
      y: position.y,
      width: DEFAULT_WINDOW_SIZE.width,
      height: DEFAULT_WINDOW_SIZE.height,
      label: artifact.name,
    });
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      setGhostPreview(null);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setGhostPreview(null);
    setIsDragActive(false);
    if (!accountId) return;

    const raw = event.dataTransfer.getData('text/plain');
    let payload: DreamArtifactDragPayload | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as DreamArtifactDragPayload) : null;
    } catch {
      payload = null;
    }

    const artifactId = payload?.artifactId ?? dragArtifactRef.current?.id;
    const sourceAccountId = payload?.accountId ?? accountId;
    const artifact = loadArtifacts(sourceAccountId).find((entry) => entry.id === artifactId);
    if (!artifact) return;

    await createModuleInstance(artifact, event.clientX, event.clientY);
    dreamOSBus.emit('drag:end', { artifactId: artifact.id, accountId: sourceAccountId });
  }, [accountId, createModuleInstance]);

  const handleCloseModule = useCallback(
    async (instance: ActiveModuleInstance) => {
      if (!accountId) return;
      setActiveModules((current) => current.filter((entry) => entry.instanceId !== instance.instanceId));
      removeActiveModule(accountId, instance.instanceId);
      if (instance.dreamWindowId) {
        await removeWindow(instance.dreamWindowId);
      }
    },
    [accountId, removeWindow],
  );

  const startWindowDrag = useCallback((instanceId: string, originX: number, originY: number) => {
    const onMove = (event: PointerEvent) => {
      setActiveModules((current) =>
        current.map((entry) => {
          if (entry.instanceId !== instanceId || !entry.position || !entry.size || !surfaceRef.current) {
            return entry;
          }
          const rect = surfaceRef.current.getBoundingClientRect();
          const next = {
            ...entry,
            position: {
              x: clamp(event.clientX - rect.left - originX, 16, Math.max(16, rect.width - entry.size.width - 16)),
              y: clamp(event.clientY - rect.top - originY, 120, Math.max(120, rect.height - entry.size.height - 16)),
            },
          };
          return next;
        }),
      );
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!accountId) return;
      const updated = activeModulesRef.current.find((entry) => entry.instanceId === instanceId);
      if (updated) {
        saveActiveModule(accountId, updated);
        void persistModulePosition(updated);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [accountId, persistModulePosition]);

  useEffect(() => {
    if (!accountId) return;
    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; artifact?: DreamArtifact };
      if (data?.type !== 'new-artifact' || !data.artifact) return;
      saveArtifact(accountId, {
        ...data.artifact,
        ownerId: data.artifact.ownerId ?? accountId,
        createdAt: data.artifact.createdAt ?? Date.now(),
      });
      dreamOSBus.emit('artifact:new', { artifact: data.artifact, accountId });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [accountId]);

  useEffect(() => {
    activeModules.forEach((instance) => {
      const iframe = iframeRefs.current[instance.instanceId];
      if (!iframe?.contentWindow || !shouldUseModuleLoader(instance.moduleUrl)) return;
      iframe.contentWindow.postMessage(
        {
          type: 'init',
          state: instance.state,
          moduleUrl: instance.moduleUrl,
        },
        '*',
      );
    });
  }, [activeModules]);

  if (!accountId) return null;

  return (
    <>
      <div
        ref={surfaceRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => void handleDrop(event)}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: isDragActive ? 'auto' : 'none',
          zIndex: 15,
        }}
      >
        {ghostPreview && (
          <div
            style={{
              position: 'absolute',
              left: ghostPreview.x,
              top: ghostPreview.y,
              width: ghostPreview.width,
              height: ghostPreview.height,
              borderRadius: 22,
              border: '2px dashed rgba(200,152,26,0.55)',
              background: 'rgba(200,152,26,0.08)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#c8981a' }}>
              Ghost Preview · {ghostPreview.label}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 16,
        }}
      >
        {activeModules.map((instance) => {
          const artifact = artifactMap.get(instance.artifactId);
          const size = instance.size ?? DEFAULT_WINDOW_SIZE;
          const position = instance.position ?? { x: 24, y: 140 };
          const iframeSrc = shouldUseModuleLoader(instance.moduleUrl)
            ? '/module-loader.html'
            : instance.moduleUrl ?? '/module-loader.html';

          return (
            <div
              key={instance.instanceId}
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                borderRadius: 24,
                border: '1px solid rgba(200,152,26,0.26)',
                background: 'rgba(8,14,28,0.82)',
                boxShadow: '0 28px 48px rgba(0,0,0,0.28)',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              <div
                onPointerDown={(event) => {
                  const rect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                  startWindowDrag(
                    instance.instanceId,
                    event.clientX - rect.left,
                    event.clientY - rect.top,
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, rgba(200,152,26,0.18), rgba(91,168,212,0.16))',
                  cursor: 'grab',
                }}
              >
                <span style={{ fontSize: 16 }}>{artifact?.icon ?? '⬡'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                    {instance.title ?? artifact?.name ?? 'Live Module'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                    {artifact?.capabilities.join(' · ') ?? 'live module'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCloseModule(instance)}
                  aria-label={`Close ${instance.title ?? 'module'}`}
                  style={{
                    marginLeft: 'auto',
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: 'none',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <iframe
                ref={(node) => {
                  iframeRefs.current[instance.instanceId] = node;
                }}
                src={iframeSrc}
                title={instance.title ?? artifact?.name ?? instance.instanceId}
                data-artifact-id={instance.artifactId}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                style={{ width: '100%', height: 'calc(100% - 48px)', border: 'none', background: '#07111f' }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
