'use client';

import type { ReactNode } from 'react';

export interface DreamConnectorLayerProps {
  connected: boolean;
  provider?: string | null;
  capabilities?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default function DreamConnectorLayer({
  connected,
  provider,
  capabilities = [],
  fallback = null,
  children,
}: DreamConnectorLayerProps) {
  if (!connected) {
    return <>{fallback}</>;
  }

  return (
    <div data-dream-provider={provider ?? 'custom'} data-dream-capabilities={capabilities.join(',')}>
      {children}
    </div>
  );
}
