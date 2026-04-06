import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import type { RuntimeRegion } from '@/lib/identity/canonical-names';

export type DreamOSArtifactKind =
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

  private notify(): void {
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
