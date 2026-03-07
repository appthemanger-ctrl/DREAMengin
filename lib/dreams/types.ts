export type DreamLayer = 'shell' | 'connector' | 'feature' | 'output';
export type DreamSurface = 'homedream' | 'edit-profiledream' | 'view-profile';
export type DreamVisibility = 'private' | 'followers' | 'public';

export interface DreamCapabilityMap {
  provider: string | null;
  connected: boolean;
  capabilities: string[];
}

export interface DreamProjection {
  widgetId: string;
  visibility: DreamVisibility;
  exposedFields: string[];
  updatedAt?: string;
}
