import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import { AI_AGENTS, type RuntimeRegion } from '@/lib/identity/canonical-names';
import {
  bridge,
  type BridgeEmission,
  type DualRuntimeChannel,
} from '@/lib/runtime/dualRuntimeBridge';

export type DreamOSArtifactKind =
  | 'event'
  | 'code-run'
  | 'code-output'
  | 'lab-run'
  | 'lab-result'
  | 'build'
  | 'asset'
  | 'prompt'
  | 'draft';

export interface DreamOSSharedArtifact {
  id: string;
  kind: DreamOSArtifactKind;
  title: string;
  sourceSubsystem: string;
  sourceRegion?: RuntimeRegion;
  relatedSubsystems: readonly string[];
  payload: Record<string, unknown>;
  updatedAt: number;
}

export interface DreamOSRuntimeContext {
  region: RuntimeRegion;
  world: RuntimeWorld;
  splitRatio: number;
  dominant: boolean;
  aiContext:
    | 'general'
    | 'code'
    | 'lab'
    | 'game'
    | 'content'
    | 'brand'
    | 'music';
  subsystemId: string;
  updatedAt: number;
}

export interface DreamOSSnapshot {
  artifacts: readonly DreamOSSharedArtifact[];
  runtimeContexts: readonly DreamOSRuntimeContext[];
}

type SnapshotListener = (snapshot: DreamOSSnapshot) => void;

const MAX_ARTIFACTS = 48;

function channelToSubsystem(channel: DualRuntimeChannel): string {
  switch (channel) {
    case 'music':
      return 'StarMakerEngin';
    case 'games':
      return 'GameEngin';
    case 'lab':
      return 'LabEngin';
    case 'code':
      return 'CodeEngin';
    case 'brand':
      return 'BrandingEngin';
    case 'create':
      return 'ContentEngin';
    default:
      return channel;
  }
}

function relatedSubsystemsForChannel(channel: DualRuntimeChannel): readonly string[] {
  switch (channel) {
    case 'music':
      return ['GameEngin', 'ContentEngin', 'BrandingEngin', AI_AGENTS.DR_EAMS];
    case 'games':
      return ['ContentEngin', 'BrandingEngin', 'CodeEngin', AI_AGENTS.DR_EAMS];
    case 'lab':
      return ['CodeEngin', 'ContentEngin', AI_AGENTS.DR_EAMS];
    case 'code':
      return ['LabEngin', 'GameEngin', 'ContentEngin', AI_AGENTS.DR_EAMS];
    case 'brand':
      return ['ContentEngin', 'GameEngin', AI_AGENTS.DR_EAMS];
    case 'create':
      return ['BrandingEngin', 'GameEngin', 'StarMakerEngin', AI_AGENTS.DR_EAMS];
    default:
      return [AI_AGENTS.DR_EAMS];
  }
}

function formatEventTitle(event: string): string {
  return event
    .split(':')
    .map((segment) => segment.replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' · ');
}

function worldToSubsystemId(world: RuntimeWorld): string {
  if (typeof world === 'string') {
    if (world === 'DreamSpace') return 'dreamspace';
    if (world === 'HomeDream Surface') return 'home';
    if (world === 'View Profile Surface') return 'profile';
    return world.toLowerCase().replace(/\s+/g, '-');
  }
  if (world.type === 'engin') return world.name;
  if (world.type === 'dream') return `dream:${world.id}`;
  if (world.type === 'panel') return `panel:${world.name}`;
  if (world.type === 'custom') return `custom:${world.path}`;
  return 'unknown';
}

export function deriveAIRuntimeContext(world: RuntimeWorld): DreamOSRuntimeContext['aiContext'] {
  const subsystemId = worldToSubsystemId(world).toLowerCase();
  if (subsystemId.includes('code')) return 'code';
  if (subsystemId.includes('lab')) return 'lab';
  if (subsystemId.includes('game')) return 'game';
  if (subsystemId.includes('content') || subsystemId.includes('create')) return 'content';
  if (subsystemId.includes('brand')) return 'brand';
  if (subsystemId.includes('music') || subsystemId.includes('starmaker')) return 'music';
  return 'general';
}

class DreamOSBusImpl {
  private readonly artifacts = new Map<string, DreamOSSharedArtifact>();
  private readonly runtimeContexts = new Map<RuntimeRegion, DreamOSRuntimeContext>();
  private readonly listeners = new Set<SnapshotListener>();

  constructor() {
    bridge.subscribeEventActivity((emission) => {
      this.recordBridgeEmission(emission);
    });
  }

  upsertArtifact(input: Omit<DreamOSSharedArtifact, 'updatedAt'> & { updatedAt?: number }): void {
    this.artifacts.set(input.id, {
      ...input,
      updatedAt: input.updatedAt ?? Date.now(),
    });
    this.notify();
  }

  publishRuntimeContext(input: Omit<DreamOSRuntimeContext, 'updatedAt' | 'aiContext' | 'subsystemId'>): void {
    this.runtimeContexts.set(input.region, {
      ...input,
      aiContext: deriveAIRuntimeContext(input.world),
      subsystemId: worldToSubsystemId(input.world),
      updatedAt: Date.now(),
    });
    this.notify();
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): DreamOSSnapshot {
    return {
      artifacts: Array.from(this.artifacts.values()).sort((a, b) => b.updatedAt - a.updatedAt),
      runtimeContexts: Array.from(this.runtimeContexts.values()).sort((a, b) => a.region.localeCompare(b.region)),
    };
  }

  clearAll(): void {
    this.artifacts.clear();
    this.runtimeContexts.clear();
    this.notify();
  }

  recordBridgeEmission(emission: BridgeEmission): void {
    this.upsertArtifact({
      id: `bridge:${emission.channel}:${String(emission.event)}:${emission.emittedAt}`,
      kind: 'event',
      title: formatEventTitle(String(emission.event)),
      sourceSubsystem: channelToSubsystem(emission.channel),
      relatedSubsystems: relatedSubsystemsForChannel(emission.channel),
      payload: {
        channel: emission.channel,
        event: emission.event,
        emittedAt: emission.emittedAt,
        ...(emission.payload as Record<string, unknown>),
      },
      updatedAt: emission.emittedAt,
    });
  }

  private notify(): void {
    while (this.artifacts.size > MAX_ARTIFACTS) {
      let oldest: string | null = null;
      let oldestTimestamp = Number.POSITIVE_INFINITY;
      for (const [artifactId, artifact] of this.artifacts.entries()) {
        if (artifact.updatedAt < oldestTimestamp) {
          oldest = artifactId;
          oldestTimestamp = artifact.updatedAt;
        }
      }
      if (!oldest) break;
      this.artifacts.delete(oldest);
    }
    const snapshot = this.getSnapshot();
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('[DreamOSBus] listener error', error);
      }
    }
  }
}

export const dreamOSBus = new DreamOSBusImpl();
