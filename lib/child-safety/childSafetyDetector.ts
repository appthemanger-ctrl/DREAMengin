// lib/child-safety/childSafetyDetector.ts
// TheBoogieMan.Ai — Child Safety Detection Engine
//
// Zero-tolerance detection for:
//   (A) CSAM text signals — rule C22_CSAM
//   (B) Child predator grooming/solicitation patterns — rule C31_GROOMING
//   (C) Known-bad content hash matching — rule C22_CSAM
//
// Every detection:
//   1. Returns a ChildSafetyResult with rule_code, severity 0–1, confidence 0–1,
//      and the list of signals that triggered the result.
//   2. NEVER reveals the exact signal patterns to callers — results only say
//      which top-level category was triggered (req H63).
//   3. Is deterministic and side-effect-free — callers decide enforcement.
//
// Usage: import { scanContent } from '@/lib/child-safety/childSafetyDetector';

// ============================================================================
// TYPES
// ============================================================================

export type ChildSafetyRuleCode = 'C22_CSAM' | 'C31_GROOMING' | 'C32_MINOR_IMAGE' | 'C33_SOLICITING_IMAGES';

export interface ChildSafetySignal {
  /** Internal signal label — must not be returned to end users */
  _label: string;
  /** Relative weight contribution of this signal (0–1) */
  weight: number;
}

export interface ChildSafetyResult {
  /** Whether any child safety violation was detected */
  flagged: boolean;
  /** Applicable rule code from TheBoogieMan policy */
  rule_code: ChildSafetyRuleCode | null;
  /** Aggregate severity score 0–1 (0 = clean, 1 = certain violation) */
  severity: number;
  /** Detection confidence 0–1 */
  confidence: number;
  /** Human-readable category label (user-safe — no internal signal detail) */
  category: 'CSAM' | 'GROOMING' | 'MINOR_IMAGE' | 'SOLICITING_IMAGES' | 'CLEAN';
  /** Number of independent signals that contributed to this result */
  signal_count: number;
  /** Internal audit payload — for DB logging only, never returned to clients */
  _audit: {
    signals: string[];
    hash_match: boolean;
  };
}

export interface ScanInput {
  /** Plain-text content to analyse (post body, DM text, comment, bio, etc.) */
  text?: string;
  /** SHA-256 hex hashes of any attached media files */
  mediaHashes?: string[];
  /** Caller-supplied known-bad hash set (loaded from child_safety_hash_registry) */
  knownBadHashes?: Set<string>;
  /**
   * Pre-computed LLM image classification result for Layer 4.
   * Callers that want image classification must run classifyImage() first
   * (it is async) and pass the result in here so that scanContent() remains
   * synchronous and testable without network access.
   */
  imageClassification?: import('./imageClassifier').ImageClassificationResult;
  /**
   * Sender age in years. Used for minor-to-adult image blocking (rule C32_MINOR_IMAGE).
   * 13–17 = minor. 18+ = adult. Omit when age is unknown.
   */
  senderAge?: number;
  /**
   * Recipient age in years. Used for minor-to-adult image blocking (rule C32_MINOR_IMAGE).
   */
  recipientAge?: number;
  /**
   * Whether the message contains an image attachment.
   * When true AND senderAge < 18 AND recipientAge >= 18, C32_MINOR_IMAGE is triggered.
   */
  hasImageAttachment?: boolean;
}

// ============================================================================
// SIGNAL PATTERN SETS (internal — never exported)
// Pattern lists are minimal and clinical. They target unambiguous solicitation,
// grooming behaviour, and CSAM terminology only.
// ============================================================================

/** Phrases strongly indicative of child-directed sexual solicitation / grooming */
const GROOMING_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  // Age probing directed at minors
  { pattern: /\bare\s+you\s+(under|below)\s+(1[0-7]|18)\b/i,         weight: 0.85, label: 'age_probe_under18' },
  { pattern: /\bhow\s+old\s+are\s+you\b/i,                           weight: 0.40, label: 'age_probe_generic' },
  { pattern: /\bare\s+you\s+a\s+(minor|teen|child|kid|juvenile)\b/i, weight: 0.80, label: 'minor_status_probe' },
  { pattern: /\byou\s+look\s+(young|so\s+young|very\s+young)\b/i,    weight: 0.65, label: 'age_comment_young' },
  // Secrecy coercion
  { pattern: /\bdon'?t\s+tell\s+(your\s+)?(parents?|moms?|dads?|guardians?|anyone)\b/i, weight: 0.90, label: 'secrecy_coercion' },
  { pattern: /\b(keep|this\s+is)\s+(our\s+)?(little\s+)?secret\b/i, weight: 0.90, label: 'secrecy_coercion_2' },
  { pattern: /\bjust\s+between\s+(you\s+and\s+me|us)\b/i,            weight: 0.55, label: 'secrecy_just_us' },
  // Platform migration (moving off-platform to avoid detection)
  { pattern: /\b(add|follow|dm|message)\s+me\s+on\s+(snap(chat)?|kik|telegram|discord|whatsapp|signal)\b/i, weight: 0.70, label: 'platform_migration' },
  { pattern: /\blet'?s\s+(move|talk|chat)\s+(to|on)\s+(snap|kik|telegram|discord|another\s+app)\b/i,      weight: 0.75, label: 'platform_migration_2' },
  // Gift/bribe grooming
  { pattern: /\bi'?ll\s+(buy|send|give|pay)\s+you\b/i,            weight: 0.60, label: 'bribe_grooming' },
  { pattern: /\b(gift\s+card|cash|money|amazon|venmo|cashapp)\b.{0,40}\b(minor|teen|young|kid)\b/i, weight: 0.80, label: 'bribe_minor' },
  // In-person meeting solicitation
  { pattern: /\b(meet|come\s+over|come\s+to\s+my|visit\s+me)\b.{0,60}\b(alone|by\s+yourself|without\s+your|don'?t\s+bring)\b/i, weight: 0.85, label: 'meeting_solicitation' },
  { pattern: /\bwant\s+to\s+meet\s+up\b.{0,60}\b(alone|just\s+us|private)\b/i, weight: 0.85, label: 'meeting_alone' },
  // Maturity flattery (classic grooming opener)
  { pattern: /\byou['']?re\s+so\s+mature\s+for\s+your\s+age\b/i,    weight: 0.80, label: 'maturity_flattery' },
  { pattern: /\byou\s+(act|seem|look)\s+(older|mature|grown\s+up)\b/i, weight: 0.55, label: 'age_flattery' },
  // Sexual solicitation directed at stated/apparent minors
  { pattern: /\bsend\s+(me\s+)?(a\s+)?(pic|photo|picture|nude|nudes|naked)\b/i, weight: 0.85, label: 'nude_solicitation' },
  { pattern: /\bshow\s+me\s+(your\s+)?(body|yourself|it)\b/i,        weight: 0.75, label: 'body_solicitation' },
];

/** Text patterns strongly indicative of CSAM content or distribution */
const CSAM_TEXT_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  // Explicit terms for child sexual abuse material (unambiguous)
  { pattern: /\bcsam\b/i,                                             weight: 0.95, label: 'csam_explicit' },
  { pattern: /\bchild\s+(porn|pornography|sex|sexual|nude|nudes)\b/i, weight: 0.95, label: 'csam_explicit_2' },
  { pattern: /\bkiddie\s+porn\b/i,                                    weight: 0.98, label: 'csam_kp' },
  { pattern: /\b(cp\b).{0,20}\b(trade|sell|buy|share|looking for|have)\b/i, weight: 0.90, label: 'csam_cp_trade' },
  { pattern: /\bminor.{0,20}(sex|nude|naked|explicit|sexual)\b/i,    weight: 0.90, label: 'csam_minor_explicit' },
  { pattern: /\b(underage|u\/?18).{0,20}(sex|nude|explicit|content)\b/i, weight: 0.90, label: 'csam_underage' },
  // Distribution / trading signals combined with child references
  { pattern: /\b(trade|sell|buy|swap)\b.{0,40}\b(minor|child|kid|teen|young)\b.{0,40}\b(pic|photo|video|clip|content)\b/i, weight: 0.95, label: 'csam_trade' },
];

// ============================================================================
// HASH-BASED CSAM DETECTION
// Compares SHA-256 hashes of uploaded media against the known-bad hash registry.
// Actual CSAM hashes are never stored in code — they are loaded from the DB
// (child_safety_hash_registry) and passed in via knownBadHashes.
// ============================================================================

function checkHashes(hashes: string[], knownBadHashes: Set<string>): boolean {
  for (const h of hashes) {
    if (knownBadHashes.has(h.toLowerCase())) return true;
  }
  return false;
}

// ============================================================================
// TEXT SCANNING HELPERS
// ============================================================================

function scanForPatterns(
  text: string,
  patterns: { pattern: RegExp; weight: number; label: string }[],
): { totalWeight: number; matchedLabels: string[] } {
  let totalWeight = 0;
  const matchedLabels: string[] = [];

  for (const { pattern, weight, label } of patterns) {
    if (pattern.test(text)) {
      totalWeight += weight;
      matchedLabels.push(label);
    }
  }

  return { totalWeight, matchedLabels };
}

/** Normalise raw accumulated weight to a 0–1 severity score. */
function normaliseWeight(raw: number, maxExpected: number): number {
  return Math.min(1.0, raw / maxExpected);
}

/** Estimate confidence based on number of independent signals matched. */
function estimateConfidence(signalCount: number): number {
  if (signalCount === 0) return 0;
  if (signalCount === 1) return 0.70;
  if (signalCount === 2) return 0.85;
  return Math.min(0.98, 0.85 + (signalCount - 2) * 0.04);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * scanContent — deterministic child safety scan.
 *
 * Runs all detection layers (text + hash + optional LLM image) and returns
 * a single ChildSafetyResult. CSAM takes precedence over GROOMING when both
 * are detected. Side-effect-free — callers decide enforcement.
 *
 * Layer 0: Minor-to-adult image block (highest priority — always blocked, no exceptions)
 * Layer 1: Hash-based CSAM (second highest priority)
 * Layer 2: CSAM text signals
 * Layer 3: Grooming / predator behaviour signals
 * Layer 4: LLM image classification (pre-computed by caller, passed via imageClassification)
 */
export function scanContent(input: ScanInput): ChildSafetyResult {
  const text = (input.text ?? '').normalize('NFKC');
  const mediaHashes = input.mediaHashes ?? [];
  const knownBadHashes = input.knownBadHashes ?? new Set<string>();

  // ── Layer 0: Minor-to-adult image block (rule C32_MINOR_IMAGE) ──────────
  // Any image sent from a minor (age 13–17) to an adult (age 18+) is ALWAYS
  // blocked. No exceptions. This check runs before all other layers.
  if (
    input.hasImageAttachment === true &&
    typeof input.senderAge === 'number' &&
    typeof input.recipientAge === 'number' &&
    input.senderAge >= 13 &&
    input.senderAge < 18 &&
    input.recipientAge >= 18
  ) {
    return {
      flagged: true,
      rule_code: 'C32_MINOR_IMAGE',
      severity: 1.0,
      confidence: 1.0,
      category: 'MINOR_IMAGE',
      signal_count: 1,
      _audit: { signals: ['minor_to_adult_image'], hash_match: false },
    };
  }

  // ── Layer 1: Hash-based CSAM check (highest priority) ───────────────────
  const hashMatch = mediaHashes.length > 0 && checkHashes(mediaHashes, knownBadHashes);
  if (hashMatch) {
    return {
      flagged: true,
      rule_code: 'C22_CSAM',
      severity: 1.0,
      confidence: 1.0,
      category: 'CSAM',
      signal_count: 1,
      _audit: { signals: ['hash_registry_match'], hash_match: true },
    };
  }

  // ── Layer 2: CSAM text signals ──────────────────────────────────────────
  const csamResult = scanForPatterns(text, CSAM_TEXT_PATTERNS);
  if (csamResult.matchedLabels.length > 0) {
    const severity = normaliseWeight(csamResult.totalWeight, 2.0);
    const confidence = estimateConfidence(csamResult.matchedLabels.length);
    return {
      flagged: true,
      rule_code: 'C22_CSAM',
      severity,
      confidence,
      category: 'CSAM',
      signal_count: csamResult.matchedLabels.length,
      _audit: { signals: csamResult.matchedLabels, hash_match: false },
    };
  }

  // ── Layer 3: Grooming / predator behaviour signals ──────────────────────
  const groomResult = scanForPatterns(text, GROOMING_PATTERNS);
  if (groomResult.matchedLabels.length > 0) {
    const severity = normaliseWeight(groomResult.totalWeight, 3.0);
    const confidence = estimateConfidence(groomResult.matchedLabels.length);
    return {
      flagged: true,
      rule_code: 'C31_GROOMING',
      severity,
      confidence,
      category: 'GROOMING',
      signal_count: groomResult.matchedLabels.length,
      _audit: { signals: groomResult.matchedLabels, hash_match: false },
    };
  }

  // ── Layer 4: LLM image classification (pre-computed by caller) ───────────
  const imgResult = input.imageClassification;
  if (imgResult && !imgResult.skipped && imgResult.flagged) {
    return {
      flagged: true,
      rule_code: 'C22_CSAM',
      severity: imgResult.severity,
      confidence: imgResult.confidence,
      category: 'CSAM',
      signal_count: 1,
      _audit: { signals: [`llm_image:${imgResult.risk}`], hash_match: false },
    };
  }

  // ── Clean ────────────────────────────────────────────────────────────────
  return {
    flagged: false,
    rule_code: null,
    severity: 0,
    confidence: 0,
    category: 'CLEAN',
    signal_count: 0,
    _audit: { signals: [], hash_match: false },
  };
}

/**
 * isZeroTolerance — returns true when the result warrants immediate account
 * suspension and NCMEC reporting without any further escalation ladder.
 * Both CSAM and confirmed grooming are zero-tolerance.
 * Minor-to-adult image blocking and image solicitation are also zero-tolerance.
 */
export function isZeroTolerance(result: ChildSafetyResult): boolean {
  if (!result.flagged) return false;
  if (result.rule_code === 'C22_CSAM') return true;
  if (result.rule_code === 'C32_MINOR_IMAGE') return true;
  if (result.rule_code === 'C33_SOLICITING_IMAGES') return true;
  // Grooming is zero-tolerance when confidence ≥ 0.85 or hash match
  if (result.rule_code === 'C31_GROOMING' && (result.confidence >= 0.85 || result._audit.hash_match)) {
    return true;
  }
  return false;
}

/**
 * isMinorToAdultImageBlock — returns true when a C32_MINOR_IMAGE rule was triggered.
 * Callers use this to show the specific message: "This image was sent from a minor and has been blocked."
 */
export function isMinorToAdultImageBlock(result: ChildSafetyResult): boolean {
  return result.flagged && result.rule_code === 'C32_MINOR_IMAGE';
}
