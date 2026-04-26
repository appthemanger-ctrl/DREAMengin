/**
 * dream.EnginRuleSet.ts
 *
 * EnginRuleSet — the config object that describes a single Engin runtime.
 *
 * Every Engin (StarMakerEngin, CodeEngin, GameEngin, LabEngin, BrandingEngin,
 * ContentEngin, PortfolioEngin) is declared as one EnginRuleSet. The shared
 * `makeEnginApp` factory consumes this config and produces a fully-wired
 * engine app component, eliminating all per-engine boilerplate.
 *
 * To add a new Engin:
 *   1. Write the core engin component in `engins/`
 *   2. Create an EnginRuleSet config in its `engines/<id>/` folder
 *   3. Pass it to `makeEnginApp` — done.
 *
 * Architecture: docs/ARCHITECTURE.md §0 — DreamR-first / stable core + swappable rule-sets.
 * Naming: docs/NAMING_AUTHORITY.md §4 — Runtimes MUST end in "Engin".
 */

import type { ComponentType } from 'react';
import type { EngineId } from './dream.EnginProvider';
import type { NavItem } from './dream.bar.EnginNavBar';

/**
 * Describes a single Engin runtime.
 *
 * The `EnginComponent` is the domain-specific engin component (e.g. StarMakerEngin).
 * It receives a single `onBack` callback that the shell fires when the user exits.
 */
export interface EnginRuleSet {
  /** Canonical engine ID — must match EngineId. */
  id: EngineId;
  /** Display name shown in the shell header (e.g. "StarMakerEngin"). */
  name: string;
  /** Emoji identity shown next to the engine name. */
  emoji: string;
  /** CSS hex accent color used for the stripe, active nav links, and glow. */
  accentColor: string;
  /** Route to return to when the user exits the engine shell. */
  backHref: string;
  /** Label on the back chevron (e.g. "Music Daydream"). */
  backLabel: string;
  /** Sub-route navigation items shown in the header nav bar. */
  nav: NavItem[];
  /**
   * The domain-specific engin component.
   * Must accept `onBack: () => void` as its only required prop.
   */
  EnginComponent: ComponentType<{ onBack: () => void }>;
}
