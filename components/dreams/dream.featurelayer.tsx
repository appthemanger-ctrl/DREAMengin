'use client';

import type { ReactNode } from 'react';

export interface DreamFeatureLayerProps {
  capabilities?: string[];
  requires?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default function DreamFeatureLayer({
  capabilities = [],
  requires = [],
  fallback = null,
  children,
}: DreamFeatureLayerProps) {
  const allowed = requires.every((capability) => capabilities.includes(capability));
  return <>{allowed ? children : fallback}</>;
}
