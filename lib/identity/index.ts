/**
 * lib/identity — Canonical Naming Authority
 *
 * Single barrel export for the DREAMengin naming authority.
 * Import from `@identity` or `@identity/*` using the path alias in tsconfig.json.
 *
 * ALL code generators, AI tools, and contributors must import from here
 * before creating any file, route, component, or label — to validate that
 * names match the canonical DREAMengin product vocabulary.
 *
 * Key exports:
 *   PLATFORM_NAME             — 'DREAMengin' (never 'DreamEngin' or variants)
 *   CORE_SURFACES             — HomeDream, EditProfileDream, ViewProfile
 *   CORE_SURFACE_ROUTES       — /homedream, /edit-profiledream, /view-profile
 *   DAYDREAM_DOMAINS          — Music, Games, Lab, Code, Brand, Create
 *   DAYDREAM_ROUTES           — /daydream/music, /daydream/games, etc.
 *   ENGIN_SURFACES            — StarMakerEngin, GameEngin, LabEngin, CodeEngin, BrandingEngin, ContentEngin
 *   PLATFORM_MODULES          — DreamDM, DreamDM Bar, DreamMenu, DreamMarketplace, DreamShop, DreamAds
 *   AI_AGENTS                 — Dr. Eams, IDARi, TheBoogieMan.Ai
 *   DREAM_WINDOW              — 'Dream Window' (never 'widget' or 'card')
 *   REJECTED_OS_TERMS         — Terms to never use (app, page, widget, engine, etc.)
 *   validateName()            — Validates any proposed name against all naming rules
 *
 * Usage:
 *   import { PLATFORM_NAME, validateName, DAYDREAM_ROUTES } from '@identity';
 *   import { CORE_SURFACE_ROUTES } from '@identity/canonical-names';
 *
 * Full authority document: docs/NAMING_AUTHORITY.md
 * Structural manifest: lib/structure/index.ts
 */

export * from './canonical-names';
