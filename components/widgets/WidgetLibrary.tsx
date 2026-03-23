'use client';
/**
 * components/widgets/WidgetLibrary.tsx
 *
 * @deprecated Forwarding shim — canonical implementation is SuperDreamWidget at
 *   components/dreams/SuperDreamWidget.tsx (Phase 8 §B Point 18).
 *
 * The Dream Window catalog (add/browse/configure Dream Windows) is now
 * handled by SuperDreamWidget and the /api/dream-windows API.
 * New code should use SuperDreamWidget directly.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Phase 8 Section B: Point 18 — legacy widget naming absorbed.
 */

export { default } from '@/components/dreams/SuperDreamWidget';
export type { SuperDreamWidgetProps as WidgetLibraryProps } from '@/components/dreams/SuperDreamWidget';
