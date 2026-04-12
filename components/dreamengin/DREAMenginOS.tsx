'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { Scene as BabylonScene, AbstractEngine } from '@babylonjs/core';
import { createBabylonEngine } from '@/lib/babylon/createEngine';
import CanvasDropZone, { type AssetImportPayload } from '@/components/dreamengin/CanvasDropZone';
import {
  DREAMENGIN_OS_SUBSYSTEM_MANIFEST,
  type DreamenginOSSubsystemNode,
} from '@/lib/dreamengin/osSubsystemManifest';
import { bridge, type PeerState } from '@/lib/runtime/dualRuntimeBridge';
import { EnginDispatcher, type DispatcherStats } from '@/lib/runtime/EnginDispatcher';
import { onIdariEvent, type IdariEventDetail } from '@/lib/agents/agentBus';
import type { RuntimeRegion } from '@/lib/identity/canonical-names';
import {
  dreamOSBus,
  type DreamOSRuntimeContext,
  type DreamOSSharedArtifact,
} from '@/lib/runtime/dreamOSBus';
import { useSessionIntelligence } from '@/lib/intelligence/useSessionIntelligence';

export interface DREAMenginOSProps {
  audioSource?: AnalyserNode;
  onReady?: (scene: BabylonScene) => void;
  onSelectSubsystem?: (node: DreamenginOSSubsystemNode) => void;
  seamOffsetPx?: number;
  splitRatio?: number;
  seamVisible?: boolean;
  dominantRegion?: RuntimeRegion;
  subsystems?: {
    nexusOpen: boolean;
    outdreamOpen: boolean;
    drEamsOpen: boolean;
    importedAssets: number;
    lastImportCategory: string | null;
    route: string;
  };
}

type SystemStatus = 'OFFLINE' | 'BOOTING_CORE_V9' | 'SYNCING_HAVOK_V2' | 'DREAM_V9_ACTIVE';

interface NeuralBus {
  color: string;
  isEmergency: boolean;
  alpha: number;
  velocity: number;
}

const ORB_COLORS = [
  '#5de8ff',
  '#e8c040',
  '#8b5cf6',
  '#10b981',
  '#fb923c',
  '#ec4899',
  '#38bdf8',
] as const;

const EMPTY_STATS: DispatcherStats = {
  workerCount: 0,
  microsecondsPerTick: [],
  boundsViolations: 0,
};

function dispatcherStatsEqual(a: DispatcherStats, b: DispatcherStats): boolean {
  if (a.workerCount !== b.workerCount || a.boundsViolations !== b.boundsViolations) {
    return false;
  }
  if (a.microsecondsPerTick.length !== b.microsecondsPerTick.length) {
    return false;
  }
  return a.microsecondsPerTick.every((value, index) => value === b.microsecondsPerTick[index]);
}

export default function DREAMenginOS({
  audioSource,
  onReady,
  onSelectSubsystem,
  seamOffsetPx,
  splitRatio = 0.5,
  seamVisible = true,
  dominantRegion,
  subsystems,
}: DREAMenginOSProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AbstractEngine | null>(null);
  const neuralRef = useRef<NeuralBus>({
    color: '#5de8ff',
    isEmergency: false,
    alpha: 0.8,
    velocity: 0,
  });
  const audioRef = useRef(audioSource);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('OFFLINE');
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [dispatcherStats, setDispatcherStats] = useState<DispatcherStats>(EMPTY_STATS);
  const [peerStates, setPeerStates] = useState<readonly PeerState[]>(bridge.getPeers());
  const [lastIdariEvent, setLastIdariEvent] = useState<IdariEventDetail | null>(null);
  const [lastImportedAsset, setLastImportedAsset] = useState<AssetImportPayload | null>(null);
  const [importCount, setImportCount] = useState(0);
  const [sharedArtifacts, setSharedArtifacts] = useState<readonly DreamOSSharedArtifact[]>([]);
  const [runtimeContexts, setRuntimeContexts] = useState<readonly DreamOSRuntimeContext[]>([]);

  // Session intelligence — auto-wired to dreamOSBus; no prop needed.
  const { predictions, isLearning, sessionDiff } = useSessionIntelligence();

  const onSelectSubsystemRef = useRef(onSelectSubsystem);
  onSelectSubsystemRef.current = onSelectSubsystem;

  useEffect(() => {
    audioRef.current = audioSource;
  }, [audioSource]);

  const manifest = useMemo(() => DREAMENGIN_OS_SUBSYSTEM_MANIFEST, []);
  const highlightedFamilies = useMemo(
    () => manifest.families.filter((family) => family.id !== 'connectors').slice(0, 6),
    [manifest],
  );
  const syncNeuralBus = useCallback(async () => {
    const dispatcher = EnginDispatcher.getInstance();
    const peers = bridge.getPeers();
    const snapshot = dreamOSBus.getSnapshot();
    const livePeers = peers.filter((peer) => peer.subscriberCount > 0 || peer.lastActivityAt).length;
    const emergency = lastIdariEvent?.status === 'error';

    neuralRef.current = {
      color: emergency ? '#ff7a7a' : livePeers > 0 ? '#5de8ff' : '#e8c040',
      isEmergency: emergency,
      alpha: emergency ? 1 : 0.72 + Math.min(0.2, snapshot.artifacts.length * 0.015),
      velocity: Math.min(1, livePeers * 0.14 + snapshot.runtimeContexts.length * 0.08),
    };

    setDispatcherStats(dispatcher.stats);
    setPeerStates(peers);
    setSharedArtifacts(snapshot.artifacts.slice(0, 4));
    setRuntimeContexts(snapshot.runtimeContexts);
  }, [lastIdariEvent]);

  const launchOS = useCallback(async (canvas: HTMLCanvasElement) => {
    setSystemStatus('BOOTING_CORE_V9');

    const { engine } = await createBabylonEngine(canvas, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const {
      ArcRotateCamera,
      Color3,
      Color4,
      PBRMaterial,
      DefaultRenderingPipeline,
      GlowLayer,
      HavokPlugin,
      HemisphericLight,
      MeshBuilder,
      PointerEventTypes,
      Scene,
      StandardMaterial,
      Vector3,
    } = await import('@babylonjs/core');

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.01, 0.01, 0.03, 1);

    const camera = new ArcRotateCamera(
      'dreamengin-os-camera',
      -Math.PI / 2,
      Math.PI / 2.35,
      16,
      new Vector3(0, 0, 0),
      scene,
    );
    camera.wheelDeltaPercentage = 0.01;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 22;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('dreamengin-os-light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.95;

    setSystemStatus('SYNCING_HAVOK_V2');
    try {
      const HavokPhysics = (await import('@babylonjs/havok')).default;
      const havokWasm = await HavokPhysics();
      const physics = new HavokPlugin(true, havokWasm);
      scene.enablePhysics(new Vector3(0, -9.81, 0), physics);
    } catch {
      console.warn('[DREAMenginOS] Havok physics unavailable — continuing without physics');
    }

    const pipeline = new DefaultRenderingPipeline('DREAM_PIPE', true, scene);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.15;
    pipeline.bloomWeight = 0.4;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 18;

    const glow = new GlowLayer('OS_GLOW', scene);

    highlightedFamilies.forEach((family, index) => {
      const angle = (index / highlightedFamilies.length) * Math.PI * 2;
      const radius = 5.5;
      const orb = MeshBuilder.CreateSphere(`dreamengin-family-${family.id}`, {
        diameter: 1.3 + Math.min(0.7, family.count * 0.04),
        segments: 24,
      }, scene);

      orb.position = new Vector3(
        Math.cos(angle) * radius,
        (index % 2 === 0 ? 1 : -1) * 1.1,
        Math.sin(angle) * radius,
      );

      const material = new StandardMaterial(`dreamengin-family-${family.id}-mat`, scene);
      const color = Color3.FromHexString(ORB_COLORS[index % ORB_COLORS.length]);
      void PBRMaterial;
      material.emissiveColor = color.scale(1.1);
      material.diffuseColor = color.scale(0.6);
      material.specularColor = color.scale(0.3);
      orb.material = material;
      orb.metadata = {
        subsystemNode: family.nodes[0] ?? null,
      };
    });

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
      const node = pointerInfo.pickInfo?.pickedMesh?.metadata?.subsystemNode as
        | DreamenginOSSubsystemNode
        | undefined;
      if (node) {
        onSelectSubsystemRef.current?.(node);
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      const neural = neuralRef.current;
      const analyser = audioRef.current;
      if (!analyser) return;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      const bass = freqData[2] / 255;
      setPulseIntensity(bass);
      glow.intensity = 0.3 + bass * 1.5;

      if (bass > 0.8) {
        for (const mesh of scene.meshes) {
          if (mesh.physicsBody) {
            mesh.physicsBody.applyImpulse(
              new Vector3(0, bass * 0.15, 0),
              mesh.getAbsolutePosition(),
            );
          }
        }
      }

      neural.velocity *= 0.95;
    });

    engine.runRenderLoop(() => scene.render());

    await syncNeuralBus();
    setSystemStatus('DREAM_V9_ACTIVE');
    onReady?.(scene);
  }, [highlightedFamilies, onReady, syncNeuralBus]);

  useEffect(() => {
    const dispatcher = EnginDispatcher.getInstance();
    dispatcher.init();
    void dispatcher.initWasm();
    setDispatcherStats(dispatcher.stats);

    const poll = window.setInterval(() => {
      setDispatcherStats((previous) => {
        const next = dispatcher.stats;
        return dispatcherStatsEqual(previous, next) ? previous : next;
      });
    }, 1000);

    const unsubscribePeers = bridge.subscribePeerActivity((peers) => {
      setPeerStates(peers);
    });
    const unsubscribeIdari = onIdariEvent((detail) => {
      setLastIdariEvent(detail);
    });
    const unsubscribeOSBus = dreamOSBus.subscribe((snapshot) => {
      setSharedArtifacts(snapshot.artifacts.slice(0, 4));
      setRuntimeContexts(snapshot.runtimeContexts);
    });

    return () => {
      window.clearInterval(poll);
      unsubscribePeers();
      unsubscribeIdari();
      unsubscribeOSBus();
    };
  }, []);

  useEffect(() => {
    if (typeof seamOffsetPx !== 'number') return;
    const dispatcher = EnginDispatcher.getInstance();
    dispatcher.setDreamDMBarY(seamOffsetPx);
  }, [seamOffsetPx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    void launchOS(canvas);

    const handleResize = () => engineRef.current?.resize();
    const statusInterval = window.setInterval(() => {
      void syncNeuralBus();
    }, 15000);
    window.addEventListener('resize', handleResize);
    return () => {
      window.clearInterval(statusInterval);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [launchOS]);

  const handleImport = useCallback((payload: AssetImportPayload) => {
    setLastImportedAsset(payload);
    setImportCount((count) => count + 1);
  }, []);

  const statusColor =
    systemStatus === 'DREAM_V9_ACTIVE'
      ? '#5de8ff'
      : systemStatus === 'OFFLINE'
        ? '#ff4444'
        : '#e8c040';
  const hudColor = neuralRef.current.color || statusColor;
  const hudMode = dominantRegion ? `${dominantRegion} focus` : 'dual runtime';

  const livePeerCount = peerStates.filter((peer) => peer.subscriberCount > 0 || peer.lastActivityAt).length;
  const primaryContexts = runtimeContexts.slice(0, 2);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CanvasDropZone className="h-full w-full" onImport={handleImport}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </CanvasDropZone>

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: 11,
          color: hudColor,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: hudColor,
            boxShadow: `0 0 ${4 + pulseIntensity * 10}px ${hudColor}`,
            opacity: 0.6 + pulseIntensity,
          }}
        />
        {systemStatus} · {hudMode}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: 'min(28rem, 88vw)',
          pointerEvents: 'none',
        }}
      >
        {[
          subsystems?.nexusOpen ? 'NEXUS' : null,
          subsystems?.outdreamOpen ? 'OUTDREAM' : null,
          subsystems?.drEamsOpen ? 'DR.EAMS' : null,
          subsystems?.importedAssets ? `IMPORTS:${subsystems.importedAssets}` : null,
          subsystems?.route ? `ROUTE:${subsystems.route}` : null,
        ]
          .filter(Boolean)
          .map((label) => (
            <span
              key={label}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(7,11,26,0.56)',
                padding: '6px 10px',
                color: '#d8ecff',
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </span>
          ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 300,
          padding: '12px 14px',
          borderRadius: 18,
          background: 'rgba(4, 10, 24, 0.72)',
          border: '1px solid rgba(93, 232, 255, 0.18)',
          backdropFilter: 'blur(14px)',
          color: '#d6eaff',
          boxShadow: '0 14px 38px rgba(0,0,0,0.28)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7dc4ff' }}>
              DREAMenginOS
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Live subsystem graph</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#8ab6d6' }}>
            <div>split {Math.round(splitRatio * 100)} / {Math.round((1 - splitRatio) * 100)}</div>
            <div>{dominantRegion ?? 'dual runtime'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {manifest.families.slice(0, 8).map((family) => (
            <button
              key={family.id}
              type="button"
              onClick={() => family.nodes[0] && onSelectSubsystemRef.current?.(family.nodes[0])}
              style={{
                borderRadius: 14,
                border: '1px solid rgba(93, 232, 255, 0.16)',
                background: 'rgba(10, 18, 38, 0.62)',
                color: '#dff7ff',
                padding: '10px 11px',
                textAlign: 'left',
                cursor: family.nodes[0] ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7dc4ff' }}>
                {family.label}
              </div>
              <div style={{ marginTop: 4, fontSize: 17, fontWeight: 700 }}>{family.count}</div>
            </button>
          ))}
        </div>
        {primaryContexts.length > 0 ? (
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {primaryContexts.map((context) => (
              <div
                key={context.region}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(93, 232, 255, 0.12)',
                  background: 'rgba(8, 16, 34, 0.7)',
                  padding: '8px 10px',
                  fontSize: 11,
                }}
              >
                <div style={{ color: '#7dc4ff', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  {context.region}
                </div>
                <div style={{ marginTop: 2, fontWeight: 700 }}>{context.subsystemId}</div>
                <div style={{ marginTop: 2, color: '#9edcc9' }}>
                  AI context · {context.aiContext} · {context.dominant ? 'dominant' : 'linked'}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          right: 12,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            minWidth: 260,
            maxWidth: 560,
            padding: '12px 14px',
            borderRadius: 18,
            background: 'rgba(4, 10, 24, 0.64)',
            border: '1px solid rgba(232, 192, 64, 0.18)',
            backdropFilter: 'blur(14px)',
            color: '#f5fbff',
          }}
        >
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#d6af52' }}>
            Connected runtimes
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {manifest.nodes
              .filter((node) => ['ai', 'engins', 'daydreams'].includes(node.family))
              .slice(0, 12)
              .map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelectSubsystemRef.current?.(node)}
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(232, 192, 64, 0.18)',
                    background: 'rgba(14, 24, 46, 0.82)',
                    color: '#fff6cf',
                    padding: '7px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {node.label}
                </button>
              ))}
          </div>
        </div>

        <div
          style={{
            minWidth: 260,
            padding: '12px 14px',
            borderRadius: 18,
            background: 'rgba(4, 10, 24, 0.64)',
            border: '1px solid rgba(93, 232, 255, 0.18)',
            backdropFilter: 'blur(14px)',
            color: '#d6eaff',
            fontSize: 11,
          }}
        >
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7dc4ff' }}>
            Runtime telemetry
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
            <div>Workers: {dispatcherStats.workerCount}</div>
            <div>Live peers: {livePeerCount}</div>
            <div>Bounds: {dispatcherStats.boundsViolations}</div>
            <div>Bar: {seamVisible ? 'visible' : 'hidden'}</div>
          </div>
          {lastImportedAsset ? (
            <div style={{ marginTop: 10, color: '#fff6cf' }}>
              Imported {lastImportedAsset.filename} · total {importCount}
            </div>
          ) : null}
          {lastIdariEvent ? (
            <div style={{ marginTop: 8, color: '#a8ffd6' }}>
              IDARi {lastIdariEvent.status ?? 'signal'} · {lastIdariEvent.message}
            </div>
          ) : null}
          {sharedArtifacts.length > 0 ? (
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              {sharedArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(93, 232, 255, 0.14)',
                    background: 'rgba(10, 18, 38, 0.62)',
                    padding: '7px 9px',
                  }}
                >
                  <div style={{ color: '#7dc4ff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {artifact.kind}
                  </div>
                  <div style={{ marginTop: 2, fontWeight: 700 }}>{artifact.title}</div>
                  <div style={{ marginTop: 2, color: '#fff6cf' }}>
                    {artifact.sourceSubsystem} ↔ {artifact.relatedSubsystems.join(' / ')}
                  </div>
                  {'event' in artifact.payload ? (
                    <div style={{ marginTop: 2, color: '#9edcc9' }}>
                      {String(artifact.payload.channel)} · {String(artifact.payload.event)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Dr. Eams — session intelligence panel ─────────────────────────── */}
      {predictions.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 220,
            maxWidth: 320,
            padding: '10px 14px',
            borderRadius: 18,
            background: 'rgba(4, 8, 22, 0.80)',
            border: '1px solid rgba(139, 92, 246, 0.36)',
            backdropFilter: 'blur(14px)',
            color: '#e9d9ff',
            fontSize: 11,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.16em', color: '#b294ff', fontWeight: 700 }}>
              Dr. Eams
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 9,
                color: isLearning ? '#a8ffd6' : '#e8c040',
                letterSpacing: '0.1em',
              }}
            >
              {isLearning ? 'LEARNED' : 'WARM DEFAULT'}
            </span>
          </div>

          {sessionDiff?.recommendation ? (
            <div style={{ marginBottom: 8, color: '#c4b5fd', fontSize: 10, lineHeight: 1.4 }}>
              {sessionDiff.recommendation}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 5 }}>
            {predictions.map((pred, index) => (
              <div
                key={pred.subsystemId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(139, 92, 246, 0.18)',
                  background: index === 0
                    ? 'rgba(139, 92, 246, 0.14)'
                    : 'rgba(10, 8, 28, 0.50)',
                  padding: '6px 9px',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 12 }}>{pred.label}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    color: '#a78bfa',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                >
                  {Math.round(pred.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
