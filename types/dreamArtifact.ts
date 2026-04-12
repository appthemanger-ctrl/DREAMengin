export type DreamArtifactType =
  | 'code'
  | 'music'
  | 'video'
  | 'image'
  | 'bot'
  | 'tool'
  | 'engin-mod'
  | 'webapp-skin'
  | 'mini-app'
  | 'full-app'
  | 'system-engin';

export type DreamArtifactSource = 'user-created' | 'imported' | 'system';

export type RuntimeRegionKey = 'dream' | 'surface';

export interface DreamArtifact {
  id: string;
  type: DreamArtifactType;
  name: string;
  description?: string;
  source: DreamArtifactSource;
  moduleUrl?: string;
  capabilities: string[];
  thumbnailUrl?: string;
  icon?: string;
  ownerId: string;
  isSystemModule: boolean;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface ActiveModuleInstance {
  instanceId: string;
  artifactId: string;
  runtimeRegion: RuntimeRegionKey;
  containerId: string;
  state: any;
  dreamWindowId?: string;
  moduleUrl?: string;
  title?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface DreamArtifactDragPayload {
  artifactId: string;
  accountId: string;
}

export interface DreamArtifactBusEventMap {
  'drag:start': {
    artifact: DreamArtifact;
    accountId: string;
    clientX?: number;
    clientY?: number;
  };
  'drag:end': {
    artifactId: string;
    accountId: string;
  };
  'capability:add': {
    artifactId: string;
    accountId: string;
    capabilities: string[];
  };
  'artifact:new': {
    artifact: DreamArtifact;
    accountId: string;
  };
  /**
   * Fired when content is dragged through the seam bar and handed off to the
   * opposite runtime. Payload carries the raw content, its MIME type, and the
   * source/target region identities.
   *
   * Subscribe via: dreamOSBus.on('seam:drop', handler)
   * Produce via:   seamClipboard.set({ content, mimeType, sourceRegion, targetRegion })
   */
  'seam:drop': {
    content: string;
    mimeType: 'text/plain' | 'application/json' | 'application/x-dream-artifact';
    sourceRegion: string;
    targetRegion: string;
    timestamp: number;
  };
  /** Fired when the seam clipboard is explicitly cleared. */
  'seam:clear': {
    timestamp: number;
  };
}
