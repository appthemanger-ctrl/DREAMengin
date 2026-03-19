// types/user-sim.ts
// User Sim AI — type definitions for the simulated-user testing agent.
//
// The agent models real-world user personas, perceives UI state on every step,
// applies a behaviour policy to pick the next action, and writes audit findings
// after each step and at the end of a journey.

import { z } from 'zod';

// ============================================================================
// PERSONA BRAIN
// ============================================================================

export const PersonaTypeSchema = z.enum([
  'impatient_first_time_user',
  'skeptical_buyer',
  'confused_older_user',
  'power_user',
  'distracted_multitasker',
  'accessibility_sensitive_user',
  'trust_seeking_user',
  'goal_driven_returning_user',
  'comparison_shopper',
  'frustrated_user_after_failure',
]);
export type PersonaType = z.infer<typeof PersonaTypeSchema>;

export const PersonaSchema = z.object({
  type: PersonaTypeSchema,
  /** Plain-English name shown in reports. */
  label: z.string(),
  /** What this persona is trying to accomplish in the journey. */
  goal: z.string(),
  /** 0-1: how likely the persona is to abandon on first friction point. */
  patience: z.number().min(0).max(1),
  /** 0-1: how much the persona reads labels / help text. */
  attention: z.number().min(0).max(1),
  /** 0-1: trust threshold — how much social proof / security signals they need. */
  trust_threshold: z.number().min(0).max(1),
  /** True when persona prioritises accessibility signals (contrast, targets, labels). */
  accessibility_priority: z.boolean(),
  /** True when persona is easily distracted and may not complete linear flows. */
  distracted: z.boolean(),
});
export type Persona = z.infer<typeof PersonaSchema>;

// ============================================================================
// PERCEPTION FRAME — what the agent sees on every step
// ============================================================================

export const ViewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Viewport = z.infer<typeof ViewportSchema>;

export const VisibleElementSchema = z.object({
  /** Element identifier — e.g. aria role or tag+text combo. */
  id: z.string(),
  tag: z.string(),
  label: z.string().optional(),
  /** Whether the element is a primary CTA. */
  is_cta: z.boolean().default(false),
  /** Whether the element has a visible focus ring / keyboard support. */
  focusable: z.boolean().default(true),
  /** Estimated tap-target size in CSS pixels — null when unknown. */
  tap_target_px: z.number().int().positive().nullable().default(null),
});
export type VisibleElement = z.infer<typeof VisibleElementSchema>;

export const PerceptionFrameSchema = z.object({
  step: z.number().int().min(0),
  page_title: z.string(),
  url: z.string(),
  viewport: ViewportSchema,
  /** Simplified text dump of visible elements. */
  visible_elements: z.array(VisibleElementSchema),
  /** Raw screenshot — base64 PNG or empty string when not available. */
  screenshot_b64: z.string().default(''),
  /** Short list of recent actions taken (most-recent last). */
  recent_actions: z.array(z.string()).max(10),
  /** Product / feature spec that the agent verifies against. */
  product_spec: z.record(z.string(), z.unknown()).optional(),
});
export type PerceptionFrame = z.infer<typeof PerceptionFrameSchema>;

// ============================================================================
// BEHAVIOUR SIGNALS — inputs to the policy engine
// ============================================================================

export const BehaviorSignalsSchema = z.object({
  /**
   * 0-1: how much friction the agent detected this step.
   * Computed from missing labels, small tap-targets, ambiguous CTAs, etc.
   */
  friction: z.number().min(0).max(1),
  /**
   * 0-1: how confusing the layout appears.
   * Elevated when multiple competing CTAs, unclear affordances, or inconsistent hierarchy.
   */
  confusion: z.number().min(0).max(1),
  /**
   * 0-1: clarity of the visual/content hierarchy.
   */
  layout_clarity: z.number().min(0).max(1),
  /**
   * 0-1: trust signals present (HTTPS indicator, privacy notice, social proof, brand logo).
   */
  trust_signals: z.number().min(0).max(1),
  /**
   * 0-1: mobile reachability score — are CTAs in thumb zone?
   */
  mobile_reachability: z.number().min(0).max(1),
  /**
   * True when the UI appears broken or misleading (broken images, infinite spinner, etc.)
   */
  ui_appears_broken: z.boolean(),
  /**
   * True when the UI appears misleading (dark patterns, confusing copy, etc.)
   */
  ui_appears_misleading: z.boolean(),
});
export type BehaviorSignals = z.infer<typeof BehaviorSignalsSchema>;

// ============================================================================
// AGENT ACTION
// ============================================================================

export const AgentActionTypeSchema = z.enum([
  'click',
  'type',
  'scroll',
  'wait',
  'navigate',
  'abandon',
  'submit',
  'inspect',
]);
export type AgentActionType = z.infer<typeof AgentActionTypeSchema>;

export const AgentActionSchema = z.object({
  type: AgentActionTypeSchema,
  target: z.string().optional(),
  value: z.string().optional(),
  rationale: z.string(),
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

// ============================================================================
// AUDIT FINDING
// ============================================================================

export const FindingSeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;

export const AuditFindingSchema = z.object({
  finding_id: z.string(),
  step: z.number().int().min(0),
  persona: PersonaTypeSchema,
  issue: z.string(),
  evidence: z.string(),
  violated_spec_rule: z.string(),
  severity: FindingSeveritySchema,
  /** 0-1 confidence that this is a genuine issue, not a false-positive. */
  confidence: z.number().min(0).max(1),
  top_class_fix: z.string(),
});
export type AuditFinding = z.infer<typeof AuditFindingSchema>;

// ============================================================================
// SIMULATION STEP
// ============================================================================

export const SimStepSchema = z.object({
  step: z.number().int().min(0),
  persona: PersonaTypeSchema,
  perception: PerceptionFrameSchema,
  signals: BehaviorSignalsSchema,
  action: AgentActionSchema,
  findings: z.array(AuditFindingSchema),
});
export type SimStep = z.infer<typeof SimStepSchema>;

// ============================================================================
// JOURNEY RESULT
// ============================================================================

export const JourneyOutcomeSchema = z.enum([
  'completed',
  'abandoned',
  'blocked',
  'error',
]);
export type JourneyOutcome = z.infer<typeof JourneyOutcomeSchema>;

export const SimJourneyResultSchema = z.object({
  journey_id: z.string(),
  persona: PersonaTypeSchema,
  goal: z.string(),
  outcome: JourneyOutcomeSchema,
  steps: z.array(SimStepSchema),
  all_findings: z.array(AuditFindingSchema),
  /** Summary stats. */
  stats: z.object({
    total_steps: z.number().int().min(0),
    total_findings: z.number().int().min(0),
    findings_by_severity: z.record(FindingSeveritySchema, z.number().int().min(0)),
    avg_friction: z.number().min(0).max(1),
    avg_confusion: z.number().min(0).max(1),
  }),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
});
export type SimJourneyResult = z.infer<typeof SimJourneyResultSchema>;
