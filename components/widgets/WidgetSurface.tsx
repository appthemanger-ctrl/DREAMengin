'use client';
/**
 * components/widgets/WidgetSurface.tsx
 *
 * @deprecated Forwarding shim — canonical implementation is SuperDreamWidget at
 *   components/dreams/SuperDreamWidget.tsx (Phase 8 §B Point 18).
 *
 * Dream Window surface rendering is now handled by SuperDreamWidget
 * and the /api/dream-windows API with full lifecycle persistence.
 * New code should use SuperDreamWidget directly.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Phase 8 Section B: Point 18 — legacy widget naming absorbed.
 */

export { default } from '@/components/dreams/SuperDreamWidget';
export type { SuperDreamWidgetProps as WidgetSurfaceProps } from '@/components/dreams/SuperDreamWidget';
