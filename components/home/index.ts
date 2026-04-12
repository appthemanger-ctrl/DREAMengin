/**
 * components/home — HomeDream Surface Components (barrel export)
 *
 * Canonical locations are in dreamdmbar/homedream/. These re-exports
 * exist for backward-compatible imports. New code should use @home/* or
 * @/dreamdmbar/homedream/*.
 *
 * Structural manifest: lib/structure/index.ts
 */
export { default as HomeSystem } from '@/dreamdmbar/homedream/HomeSystem';
export { default as HomeDream } from '@/dreamdmbar/homedream/HomeDream';
export { default as WorkspaceDashboard } from '@/dreamdmbar/homedream/WorkspaceDashboard';
export { default as GlobalDreamBar } from './GlobalDreamBar';
export { default as DreamWindowRail } from './DreamWindowRail';
export { default as DreamWidget } from './DreamWidget';
export { default as DreamWidgetGrid } from './DreamWidgetGrid';
export { default as ActiveModuleSurface } from './ActiveModuleSurface';
export { default as DaydreamPulseStrip } from './DaydreamPulseStrip';
export { default as DreamBeatCanvas } from './DreamBeatCanvas';
