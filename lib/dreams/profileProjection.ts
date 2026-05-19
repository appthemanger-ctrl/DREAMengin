import type { DreamProjection, DreamVisibility } from '@/lib/dreams/types';

export interface CreateDreamProjectionInput {
  widgetId: string;
  visibility?: DreamVisibility;
  exposedFields?: string[];
  updatedAt?: string;
}

export function createDreamProjection({
  widgetId,
  visibility = 'private',
  exposedFields = [],
  updatedAt = new Date().toISOString(),
}: CreateDreamProjectionInput): DreamProjection {
  return {
    widgetId,
    visibility,
    exposedFields: [...new Set(exposedFields)],
    updatedAt,
  };
}

export function canRenderProjection(projection: DreamProjection, explicitShare = false) {
  return projection.visibility !== 'private' && explicitShare;
}
