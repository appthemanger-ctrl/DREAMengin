'use client';

/**
 * DreamWindowShell — Universal drag-to-transfer wrapper for Dream modules
 *
 * Wraps any Dream module in a draggable shell with:
 *   - Tap-hold (≥300ms) → enters drag mode (via useTapHoldMove).
 *   - Drag to screen edge → transfers the module to the target runtime.
 *   - Gold outline while over a compatible edge.
 *   - onTransfer callback for the host to handle the transfer event.
 *
 * Usage:
 *   <DreamWindowShell manifest={myManifest} onTransfer={handleTransfer}>
 *     <MyModuleContent />
 *   </DreamWindowShell>
 */

import React, { useRef } from 'react';
import { useTapHoldMove } from '@/hooks/useTapHoldMove';
import type { ModuleManifest, RuntimeId } from '@/lib/universalEditor';

export interface DreamWindowShellProps {
  /** Module manifest describing this window's type and compatible runtimes. */
  manifest: ModuleManifest;
  /** Called when the user drags to a compatible runtime edge. */
  onTransfer?: (manifest: ModuleManifest, targetRuntime: RuntimeId) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DreamWindowShell({
  manifest,
  onTransfer,
  children,
  className,
  style,
}: DreamWindowShellProps) {
  const ref = useRef<HTMLDivElement>(null);

  useTapHoldMove(ref, {
    manifest,
    onTransfer: onTransfer ?? (() => {}),
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'visible',
        touchAction: 'none',
        userSelect: 'none',
        ...style,
      }}
      data-dream-module={manifest.id}
      data-runtime={manifest.sourceRuntime}
    >
      {children}
    </div>
  );
}

export default DreamWindowShell;
