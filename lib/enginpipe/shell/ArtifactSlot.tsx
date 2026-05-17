'use client';

/**
 * lib/enginpipe/shell/ArtifactSlot.tsx
 *
 * Hot-swap runtime shell primitive (§11 of the catalog).
 *
 * The ArtifactSlot owns lightweight, per-artifact context (id, optional
 * scoped event bus) and renders a swappable child. The outer Shell
 * (Next.js root layout, GPU/auth providers) keeps running across
 * artifact swaps; only the slot's children are torn down and rebuilt.
 *
 * This component is intentionally framework-thin: no GPU, no Supabase,
 * no Engin-specific assumptions. Every Engin's runtime mounts inside
 * one of these so future cross-cutting features (telemetry tagging,
 * snapshot lifecycle, performance probes) have a single attachment
 * point.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { createEventBus, type EventBus } from '../../eventBus';

export interface ArtifactSlotContextValue {
  /** Stable identifier for the currently-mounted artifact. */
  artifactId: string;
  /**
   * Per-artifact event bus. Created when the slot mounts, destroyed
   * when it unmounts or when the artifactId changes. Engin runtimes
   * can use this for intra-artifact messaging without polluting the
   * global app bus.
   */
  bus: EventBus;
}

const ArtifactSlotContext = createContext<ArtifactSlotContextValue | null>(null);

export interface ArtifactSlotProps {
  artifactId: string;
  /**
   * Optional caller-supplied bus. When omitted, a fresh bus is created
   * for the lifetime of this slot mount.
   */
  bus?: EventBus;
  /** Optional className applied to the slot's wrapper element. */
  className?: string;
  children: ReactNode;
}

/**
 * Mount an artifact's runtime inside this slot to gain shared context.
 *
 * @example
 *   <ArtifactSlot artifactId="game:mad-maxi">
 *     <MadMaxiRuntime />
 *   </ArtifactSlot>
 */
export function ArtifactSlot({
  artifactId,
  bus,
  className,
  children,
}: ArtifactSlotProps) {
  const ownedBus = useMemo(
    () => bus ?? createEventBus(),
    // Recreate when the artifact changes or when the caller swaps the bus.
    [bus, artifactId],
  );

  // Ensure we tear down the bus we created. If the caller passed one
  // in we leave its lifecycle to them.
  useEffect(() => {
    if (bus) return;
    return () => {
      if (!ownedBus.destroyed) ownedBus.destroy();
    };
  }, [bus, ownedBus]);

  const value = useMemo<ArtifactSlotContextValue>(
    () => ({ artifactId, bus: ownedBus }),
    [artifactId, ownedBus],
  );

  return (
    <ArtifactSlotContext.Provider value={value}>
      <div data-engin-artifact-id={artifactId} className={className}>
        {children}
      </div>
    </ArtifactSlotContext.Provider>
  );
}

/**
 * Hook used inside an artifact's component tree to read the slot's
 * shared context. Throws if called outside an `<ArtifactSlot>`.
 */
export function useArtifactSlot(: ArtifactSlotContextValue {
  const ctx = useContext(ArtifactSlotContext);
  if (!ctx) {
    throw new Error(
      '[enginpipe] useArtifactSlot() called outside of <ArtifactSlot>.',
    );
  }
  return ctx;
}

/**
 * Same as {@link useArtifactSlot} but returns `null` instead of
 * throwing. Useful for components that may be reused both inside and
 * outside an artifact slot.
 */
export function useOptionalArtifactSlot(: ArtifactSlotContextValue | null {
  return useContext(ArtifactSlotContext);
}
