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
}
