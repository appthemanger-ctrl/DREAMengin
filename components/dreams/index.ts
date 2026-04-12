/**
 * components/dreams — Dream Windows (modular runtime containers)
 *
 * This is the canonical folder for all Dream Window layer components.
 * Import from `@dreams/*` using the path alias defined in tsconfig.json.
 *
 * Dream Windows are the universal modular runtime containers in DREAMengin.
 * Never call them "widgets" or "cards" — the canonical term is "Dream Window".
 *
 * Layer architecture (docs/ARCHITECTURE.md §4):
 *   DreamShell            — visual shell, naming, size, placement, style, menus
 *   DreamConnectorLayer   — auth state, provider identity, capability discovery
 *   DreamFeatureLayer     — active modules (appear only when connector supports them)
 *   DreamOutputLayer      — saved profile-safe output (shared to View Profile Surface)
 *   SuperDreamWidget      — composed Dream Window using all four layers
 *
 * Usage:
 *   import DreamShell from '@dreams/DreamShell';
 *   import SuperDreamWidget from '@dreams/SuperDreamWidget';
 *
 * Naming authority: lib/identity/canonical-names.ts
 * Structural manifest: lib/structure/index.ts
 */

export { default as DreamShell } from './DreamShell';
export { default as DreamConnectorLayer } from './DreamConnectorLayer';
export { default as DreamFeatureLayer } from './DreamFeatureLayer';
export { default as DreamOutputLayer } from './DreamOutputLayer';
export { default as SuperDreamWidget } from './SuperDreamWidget';
export { default as JourneyDreamWindow } from './JourneyDreamWindow';
export { default as DreamsSpacePanel } from './DreamsSpacePanel';
