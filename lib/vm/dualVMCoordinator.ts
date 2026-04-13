/**
 * lib/vm/dualVMCoordinator.ts — Dual WASM+GPU VM Coordinator
 *
 * Orchestrates two WASM+GPU VMs (left and right) for the DREAMengin dual
 * runtime architecture. Provides load balancing, failover, and inter-VM
 * communication via the dualRuntimeBridge.
 */

import { WasmGpuVM } from './wasmGpuVM';
import { bridge, type DualRuntimeChannel } from '@/lib/runtime/dualRuntimeBridge';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';
import type { VMConfig, VMMessageQueueDescriptor, VMEventChannel } from './types';

export type VMRegion = 'left' | 'right';

export interface DualVMConfig {
  left: Partial<VMConfig>;
  right: Partial<VMConfig>;
  enableInterVMCommunication: boolean;
  enableLoadBalancing: boolean;
  primaryRegion: VMRegion;
}

export interface VMWorkload {
  id: string;
  region: VMRegion;
  wasmBinary: BufferSource;
  channel: DualRuntimeChannel;
  priority: number;
}

/**
 * Coordinates two WASM+GPU VMs in a dual-runtime configuration.
 */
export class DualVMCoordinator {
  private leftVM: WasmGpuVM | null = null;
  private rightVM: WasmGpuVM | null = null;
  private messageQueue: VMMessageQueueDescriptor | null = null;
  private eventChannels = new Map<string, VMEventChannel>();
  private activeWorkloads = new Map<string, VMRegion>();

  constructor(private readonly config: DualVMConfig) {}

  /**
   * Initialize both VMs and wire them to the dual runtime bridge.
   */
  async initialize(): Promise<void> {
    // Create left VM
    this.leftVM = await WasmGpuVM.create({
      ...this.config.left,
      id: 'vm-left',
    });

    // Create right VM
    this.rightVM = await WasmGpuVM.create({
      ...this.config.right,
      id: 'vm-right',
    });

    // Set up inter-VM communication
    if (this.config.enableInterVMCommunication) {
      this.messageQueue = this.createMessageQueue();
    }

    // Wire to bridge
    this.wireToBridge();

    // Publish to OS bus
    dreamOSBus.upsertArtifact({
      id: 'dual-vm-coordinator',
      kind: 'event',
      title: 'Dual VM Coordinator Initialized',
      sourceSubsystem: 'DualVMCoordinator',
      relatedSubsystems: ['CodeEngin', 'LabEngin', 'GameEngin'],
      payload: {
        leftVMId: 'vm-left',
        rightVMId: 'vm-right',
        interVMEnabled: this.config.enableInterVMCommunication,
      },
    });
  }

  /**
   * Submit a workload to a specific VM region.
   */
  async submitWorkload(workload: VMWorkload): Promise<void> {
    const vm = this.getVM(workload.region);
    if (!vm) {
      throw new Error(`VM not initialized: ${workload.region}`);
    }

    // Load WASM module
    await vm.loadWasm(workload.wasmBinary);

    // Track workload
    this.activeWorkloads.set(workload.id, workload.region);

    // Emit event
    bridge.emit(workload.channel, 'vm:workload-submitted', {
      workloadId: workload.id,
      region: workload.region,
      timestamp: Date.now(),
    });

    // Publish to OS bus
    dreamOSBus.upsertArtifact({
      id: `workload:${workload.id}`,
      kind: 'code-run',
      title: `VM Workload: ${workload.id}`,
      sourceSubsystem: 'DualVMCoordinator',
      relatedSubsystems: [this.channelToSubsystem(workload.channel)],
      payload: {
        workloadId: workload.id,
        region: workload.region,
        channel: workload.channel,
        priority: workload.priority,
      },
    });
  }

  /**
   * Get statistics from both VMs.
   */
  getStats() {
    return {
      left: this.leftVM?.getStats() ?? null,
      right: this.rightVM?.getStats() ?? null,
      activeWorkloads: Array.from(this.activeWorkloads.entries()).map(
        ([id, region]) => ({ id, region }),
      ),
    };
  }

  /**
   * Send a message from one VM to another via the message queue.
   */
  sendInterVMMessage(from: VMRegion, to: VMRegion, message: Uint8Array): boolean {
    if (!this.messageQueue) return false;

    const { buffer, producerIndex, consumerIndex, capacity, messageSize } = this.messageQueue;

    if (message.byteLength > messageSize) {
      console.warn('[DualVMCoordinator] Message too large');
      return false;
    }

    // Atomic producer index increment
    const currentProducer = Atomics.load(producerIndex, 0);
    const currentConsumer = Atomics.load(consumerIndex, 0);

    if (currentProducer - currentConsumer >= capacity) {
      console.warn('[DualVMCoordinator] Message queue full');
      return false;
    }

    const slot = currentProducer % capacity;
    const offset = slot * messageSize;

    // Write message to ring buffer
    const view = new Uint8Array(buffer, offset, messageSize);
    view.fill(0); // Clear slot
    view.set(message);

    // Atomic increment producer index
    Atomics.add(producerIndex, 0, 1);

    // Notify consumer
    Atomics.notify(consumerIndex, 0, 1);

    bridge.emit('compute', 'vm:inter-vm-message', {
      from,
      to,
      size: message.byteLength,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Create an event channel for VM-to-VM signaling.
   */
  createEventChannel(name: string): VMEventChannel {
    const buffer = new SharedArrayBuffer(4);
    const view = new Int32Array(buffer);

    const channel: VMEventChannel = {
      flagAddress: 0,
      buffer,
      view,
    };

    this.eventChannels.set(name, channel);
    return channel;
  }

  /**
   * Signal an event channel (write flag).
   */
  signalEventChannel(name: string, value: number): boolean {
    const channel = this.eventChannels.get(name);
    if (!channel) return false;

    Atomics.store(channel.view, 0, value);
    Atomics.notify(channel.view, 0, Number.MAX_SAFE_INTEGER);
    return true;
  }

  /**
   * Wait on an event channel (WASM guest would call this via syscall).
   */
  waitEventChannel(name: string, expected: number, timeoutMs: number): number {
    const channel = this.eventChannels.get(name);
    if (!channel) return 2; // timeout

    const result = Atomics.wait(channel.view, 0, expected, timeoutMs);
    return result === 'ok' ? 0 : result === 'not-equal' ? 1 : 2;
  }

  /**
   * Destroy both VMs and clean up resources.
   */
  destroy(): void {
    this.leftVM?.destroy();
    this.rightVM?.destroy();
    this.leftVM = null;
    this.rightVM = null;
    this.activeWorkloads.clear();
    this.eventChannels.clear();

    dreamOSBus.removeArtifact('dual-vm-coordinator');
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private getVM(region: VMRegion): WasmGpuVM | null {
    return region === 'left' ? this.leftVM : this.rightVM;
  }

  private wireToBridge(): void {
    // Subscribe to bridge events and route to appropriate VM
    bridge.subscribe('compute', 'vm:dispatch-workload', (payload: {
      workloadId: string;
      region: VMRegion;
      wasmBinary: ArrayBuffer;
      channel: DualRuntimeChannel;
      priority: number;
    }) => {
      this.submitWorkload({
        id: payload.workloadId,
        region: payload.region,
        wasmBinary: payload.wasmBinary,
        channel: payload.channel,
        priority: payload.priority,
      }).catch((error) => {
        console.error('[DualVMCoordinator] Workload submission failed:', error);
        bridge.emit(payload.channel, 'vm:error', {
          workloadId: payload.workloadId,
          error: String(error),
        });
      });
    });

    // Emit periodic stats
    setInterval(() => {
      const stats = this.getStats();
      bridge.emit('compute', 'vm:stats-update', stats);
    }, 5000);
  }

  private createMessageQueue(): VMMessageQueueDescriptor {
    const capacity = 256;
    const messageSize = 1024; // bytes
    const bufferSize = capacity * messageSize + 8; // +8 for indices

    const buffer = new SharedArrayBuffer(bufferSize);
    const producerIndex = new Int32Array(buffer, 0, 1);
    const consumerIndex = new Int32Array(buffer, 4, 1);

    Atomics.store(producerIndex, 0, 0);
    Atomics.store(consumerIndex, 0, 0);

    return {
      buffer,
      producerIndex,
      consumerIndex,
      capacity,
      messageSize,
    };
  }

  private channelToSubsystem(channel: DualRuntimeChannel): string {
    switch (channel) {
      case 'code': return 'CodeEngin';
      case 'game': return 'GameEngin';
      case 'games': return 'GameEngin';
      case 'lab': return 'LabEngin';
      case 'music': return 'StarMakerEngin';
      case 'brand': return 'BrandingEngin';
      case 'content': return 'ContentEngin';
      case 'create': return 'ContentEngin';
      default: return 'DualVMCoordinator';
    }
  }
}

/**
 * Global singleton coordinator instance.
 * Initialize via `initializeDualVMCoordinator()`.
 */
let globalCoordinator: DualVMCoordinator | null = null;

export async function initializeDualVMCoordinator(
  config: Partial<DualVMConfig> = {},
): Promise<DualVMCoordinator> {
  if (globalCoordinator) {
    return globalCoordinator;
  }

  const fullConfig: DualVMConfig = {
    left: {},
    right: {},
    enableInterVMCommunication: true,
    enableLoadBalancing: true,
    primaryRegion: 'left',
    ...config,
  };

  globalCoordinator = new DualVMCoordinator(fullConfig);
  await globalCoordinator.initialize();

  return globalCoordinator;
}

export function getDualVMCoordinator(): DualVMCoordinator | null {
  return globalCoordinator;
}

export function destroyDualVMCoordinator(): void {
  if (globalCoordinator) {
    globalCoordinator.destroy();
    globalCoordinator = null;
  }
}
