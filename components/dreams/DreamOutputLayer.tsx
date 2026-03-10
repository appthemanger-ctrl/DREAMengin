'use client';

import type { ReactNode } from 'react';
import { canRenderProjection } from '@/lib/dreams/profileProjection';

export type DreamOutputMode = 'home' | 'profile';
export type DreamVisibility = 'private' | 'followers' | 'public';

export interface DreamOutputLayerProps {
  mode: DreamOutputMode;
  visibility?: DreamVisibility;
  isExplicitlyShared?: boolean;
  children: ReactNode;
}

export default function DreamOutputLayer({
  mode,
  visibility = 'private',
  isExplicitlyShared = false,
  children,
}: DreamOutputLayerProps) {
  if (mode === 'profile') {
    const canRender = canRenderProjection(
      { widgetId: '', visibility, exposedFields: [] },
      isExplicitlyShared,
    );
    return canRender ? <>{children}</> : null;
  }

  return <>{children}</>;
}
