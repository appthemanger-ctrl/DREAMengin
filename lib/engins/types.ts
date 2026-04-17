/**
 * lib/engins/types.ts — Engin Layer Type Contracts
 *
 * Defines the interface contract for what an "Engin" IS in the DREAMengin
 * platform architecture.
 *
 * ARCHITECTURE:
 *   Engin  = the code / logic / computation layer — power under the hood
 *   Daydream = the visual shell — what users see and interact with
 *   Together: one DaydreamEngin unit (e.g. BrandDaydreamEngin)
 *
 * Engin components (engins/*.tsx) render the engin's visual control panels,
 * which are surfaced as part of the unified DaydreamEngin experience.
 * They are not standalone apps — the Daydream IS the entry point.
 */

/** Minimal props every Engin component receives from the shell */
export interface EnginProps {
  /** Called when the user wishes to return to the Daydream surface */
  onBack: () => void;
}

/** Describes the identity of a DaydreamEngin pairing */
export interface DaydreamEnginIdentity {
  /** Canonical id: 'brand' | 'music' | 'games' | 'lab' | 'code' | 'create' | 'forge' */
  id: string;
  /** Human-readable display name: 'Brand DaydreamEngin' */
  displayName: string;
  /** The code-layer class name: 'BrandingEngin' */
  enginName: string;
  /** Accent hex colour for visual theming */
  accentColor: string;
  /** Emoji icon representing this domain */
  emoji: string;
}

/** The two views available in every DaydreamEngin surface */
export type DaydreamEnginTab = 'dream' | 'engin';

/** Forge activity record emitted when an Engin capability is invoked */
export interface EnginForgeRecord {
  enginId: string;
  action: string;
  timestamp: number;
}
