'use client';

import type { ReactNode } from 'react';

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
    const canRender = visibility !== 'private' && isExplicitlyShared;
    return canRender ? <>{children}</> : null;
  }

  return <>{children}</>;
}
