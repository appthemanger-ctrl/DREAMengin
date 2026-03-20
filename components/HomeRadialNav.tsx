/**
 * components/HomeRadialNav.tsx — DEPRECATED / REDIRECTED
 *
 * This component is no longer the canonical DreamMenu implementation.
 *
 * Canonical DreamMenu — Phase 6 item 10 (docs/dreamengin_phase6.md point 25):
 *   components/menus/DreamRadialMenu.tsx   ← Daydream navigation (left menu)
 *   components/menus/SystemRadialMenu.tsx  ← System navigation (right menu)
 *   components/menus/DualBottomMenu.tsx    ← Unified bottom menu wrapper (both)
 *
 * DreamNavControls.tsx (in components/dreamnav/) is the Gold Button tap handler.
 * Import DreamRadialMenu, SystemRadialMenu, or DualBottomMenu directly.
 *
 * Per docs/LAW.md §10: repurpose legacy pieces before inventing new top-level
 * systems. This file exists only as a redirect notice. It is not imported by
 * any active surface.
 *
 * Architecture justification:
 *   docs/ARCHITECTURE.md §3 — HomeDream Surface primary menu code:
 *     components/menus/DreamRadialMenu.tsx (canonical)
 *   docs/dreamengin_phase6.md point 25:
 *     "DreamMenu must have a single canonical implementation."
 */


// Re-export the canonical DreamMenu so any future accidental import of this
// file still resolves to the correct component.
// Depends on DreamRadialMenu having a default export — if that ever changes to
// named-only exports, update this line to match (e.g. export { DreamRadialMenu as default }).
export { default } from '@/components/menus/DreamRadialMenu';
