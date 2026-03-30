/**
 * components/engines/index.ts
 *
 * Top-level barrel export for all six DREAMengin engine apps.
 *
 * Each engine lives in its own folder with:
 *   - <Name>EnginApp — full-screen app shell (wraps the existing Engin component)
 *   - panels/ — standalone panel components for the engine's sub-routes
 *   - index.ts — barrel exports
 *
 * Shared infrastructure lives in shared/:
 *   - EnginAppShell  — full-screen immersive wrapper
 *   - EnginNavBar    — horizontal sub-route nav
 *   - EnginProvider  — React context for engine-wide state
 */

// Shared
export * from './shared';

// Engine apps
export * from './games';
export * from './music';
export * from './code';
export * from './lab';
export * from './brand';
export * from './create';
