// types/journey.ts
// Journey Trail types — private data model for the user's creative course through DREAMengin.
// "Every thing becomes data and those data points track your course.
//  They are the very dots that connect looking backwards." — DREAMengin product vision
//
// CONSTITUTION Art. I Rule 1: all dots are private by default.
// Projection to View Profile Surface requires explicit per-dot user confirmation.

/** Every meaningful threshold-crossing event that becomes a dot on the trail. */
export type JourneyDotKind =
  // ── Surface / runtime movement ──────────────────────────────────────────
  | 'surface_first_entry'        // first-ever entry into a Daydream Surface (once per surface)
  | 'engin_first_activated'      // first activation of an Engin runtime
  | 'surface_milestone_visit'    // 10th, 50th, 100th visit to a surface

  // ── Dream Windows ────────────────────────────────────────────────────────
  | 'dream_window_first_mount'   // first Dream Window mounted on any surface
  | 'dream_window_bound'         // Dream Window bound to an external source

  // ── Content / creation ──────────────────────────────────────────────────
  | 'content_first_created'      // first piece of content created (per domain)
  | 'content_shared'             // user explicitly shared / projected content
  | 'creative_streak'            // N consecutive days of creative activity

  // ── Connector events ────────────────────────────────────────────────────
  | 'connector_linked'           // external service connected (Spotify, YouTube, GitHub…)
  | 'connector_first_sync'       // first data sync from a connected service

  // ── Profile / projection ────────────────────────────────────────────────
  | 'profile_first_projected'    // first time user projects to View Profile Surface
  | 'profile_section_added'      // new section added in Edit ProfileDream Surface

  // ── Social milestones ───────────────────────────────────────────────────
  | 'first_follower'             // first follower received
  | 'follower_milestone'         // 10, 25, 50, 100, 500, 1 000 followers
  | 'first_dm_sent'              // first DreamDM conversation initiated
  | 'first_dm_received'          // first DreamDM message received

  // ── Commerce ────────────────────────────────────────────────────────────
  | 'shop_item_first_listed'     // first item listed in DreamShop Surface
  | 'marketplace_item_first_listed' // first item listed in DreamMarketplace Surface
  | 'first_sale'                 // first successful sale
  | 'ad_slot_first_created'      // first DreamAds slot created

  // ── Workflow ─────────────────────────────────────────────────────────────
  | 'workflow_first_activation'  // first time a workflow transitions draft → active
  | 'workflow_first_export'      // first time a workflow transitions review → export
  | 'workflow_first_handoff'     // first cross-Engin handoff emitted from a workflow

  // ── System / runtime ────────────────────────────────────────────────────
  | 'runtime_first_entry'        // first-ever entry into DREAMengin (once, ever)
  | 'dreamspace_first_open';     // first time DreamSpace is opened from DreamDM Bar

/** A single persisted dot on the user's Journey Trail. */
export interface JourneyDot {
  id: string;
  user_id: string;
  kind: JourneyDotKind;
  /** Canonical surface label, e.g. 'Music Daydream Surface'. Empty string if not surface-specific. */
  surface: string;
  /** Human-readable sentence shown on the trail, e.g. 'You entered the Music Daydream Surface'. */
  label: string;
  /** 0.0–1.0 — drives dot size and visual weight in the visualization. */
  significance: number;
  /** Hex color from JOURNEY_DOMAIN_COLORS for the surface that produced this dot. */
  domain_color: string;
  /** Arbitrary extra data, e.g. { connector: 'spotify', milestone_n: 10 }. */
  metadata: Record<string, unknown>;
  // visibility is always private — enforced at DB layer via RLS, not by convention alone.
  created_at: string;
}

/** Input type for logging a new dot — user_id and id are resolved server-side. */
export type LogJourneyDotInput = Omit<JourneyDot, 'id' | 'user_id' | 'created_at'>;

/** Time-grouped structure for the visualization — newest group first. */
export interface JourneyTimeGroup {
  label: string;     // 'Today' | 'This Week' | 'This Month' | 'Earlier'
  dots: JourneyDot[];
}

/**
 * Domain color map — single source of truth for trail dot colors.
 * Keyed by canonical surface name (README §1).
 */
export const JOURNEY_DOMAIN_COLORS: Record<string, string> = {
  'HomeDream Surface':           '#c8981a',
  'Music Daydream Surface':      '#8b5cf6',
  'Games Daydream Surface':      '#22c55e',
  'Lab Daydream Surface':        '#f59e0b',
  'Code Daydream Surface':       '#0ea5e9',
  'Brand Daydream Surface':      '#ec4899',
  'Create Daydream Surface':     '#ef4444',
  'DreamDM Surface':             '#38bdf8',
  'DreamShop Surface':           '#c8981a',
  'DreamMarketplace Surface':    '#a78bfa',
};
