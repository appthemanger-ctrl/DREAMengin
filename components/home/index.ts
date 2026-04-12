/**
 * components/home — HomeDream Surface Components
 *
 * This folder contains all UI components for the HomeDream Surface —
 * the root private operating surface and entry point after auth.
 * Import from `@home/*` using the path alias defined in tsconfig.json.
 *
 * HomeDream Surface is the private source state — nothing here is public
 * by default. Public output is projected via visibility_mappings only.
 *
 * Components:
 *   HomeSystem           — persistent dual-runtime layout (top + bottom regions)
 *   HomeDream            — primary HomeDream Surface shell
 *   WorkspaceDashboard   — operating surface workspace
 *   GlobalDreamBar       — global Dream Window action bar
 *   DreamWindowRail      — Dream Window rail for mounting/binding windows
 *   DreamWidget          — individual Dream Window instance renderer
 *   DreamWidgetGrid      — Dream Window grid layout
 *   ActiveModuleSurface  — active module surface overlay
 *   DaydreamPulseStrip   — Daydream activity strip
 *   DreamBeatCanvas      — beat/activity canvas
 *
 * Usage:
 *   import { HomeSystem } from '@home/HomeSystem';
 *   import HomeDream from '@home/HomeDream';
 *
 * Naming authority: lib/identity/canonical-names.ts
 * Structural manifest: lib/structure/index.ts
 */

export { default as HomeSystem } from './HomeSystem';
export { default as HomeDream } from './HomeDream';
export { default as WorkspaceDashboard } from './WorkspaceDashboard';
export { default as GlobalDreamBar } from './GlobalDreamBar';
export { default as DreamWindowRail } from './DreamWindowRail';
export { default as DreamWidget } from './DreamWidget';
export { default as DreamWidgetGrid } from './DreamWidgetGrid';
export { default as ActiveModuleSurface } from './ActiveModuleSurface';
export { default as DaydreamPulseStrip } from './DaydreamPulseStrip';
export { default as DreamBeatCanvas } from './DreamBeatCanvas';
