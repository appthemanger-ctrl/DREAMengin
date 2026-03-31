// lib/child-safety/messageContextChecker.ts
// TheBoogieMan.Ai — Minor-Adult Message Context Evaluator
//
// PURPOSE
// -------
// When a minor (age 13–17) and an adult (18+) exchange messages, this module
// evaluates the context of the conversation to determine whether it is a
// legitimate safe relationship or a potentially inappropriate interaction.
//
// Safe contexts (no action taken):
//   - Teacher / student
//   - Coach / athlete
//   - Family member / relative
//   - Youth group leader / member
//   - Tutor / student
//   - Parent-approved family friend
//
// Inappropriate contexts trigger escalation via the three-AI triad:
//   - Dr. Ian (IDARi) — sees it in messaging and post surfaces
//   - TheBoogieMan.Ai — evaluates policy violations at every interaction
//   - Dr. Eams — catches it through user-facing interaction
//
// Enforcement outcomes:
//   - If AI flags conversation: block further messages until reviewed.
//   - If confirmed inappropriate: adult permanently banned; minor warned.
//   - Minor repeated violations: account locked, requires parental consent.
//
// All three AIs must know child safety laws (PROTECT Act, COPPA, CDA §230 safe
// harbor conditions, CIPA, state-level age-appropriate design codes).
//
// CHILD SAFETY LAWS REFERENCE
// ----------------------------
// • PROTECT Act (18 U.S.C. §2256): Prohibits CSAM and virtual images of minors in
//   sexual conduct. Zero-tolerance; mandatory NCMEC reporting.
// • COPPA (15 U.S.C. §6501–6506): Children under 13 require verifiable parental
//   consent for data collection. DREAMengin minimum age is 13.
// • CIPA (Children's Internet Protection Act): Platforms serving minors must filter
//   obscene or harmful material.
// • CDA §230 safe harbor: Platforms lose protection when they have actual knowledge
//   of CSAM and fail to act.
// • Violence Against Women Act / STOP CSAM Act (2023): Platforms must adopt
//   reasonable measures to detect and remove CSAM.
// • State-level "Age-Appropriate Design" codes (e.g., California AB 2273): Platforms
//   must apply the highest privacy and safety settings by default for minors.
//
// Usage:
//   import { evaluateMessageContext } from '@/lib/child-safety/messageContextChecker';

// ============================================================================
// TYPES
// ============================================================================

/** The inferred relationship context between a minor and an adult participant. */
export type MessageContextType =
  | 'teacher_student'
  | 'coach_athlete'
  | 'family_member'
  | 'youth_group_leader'
  | 'tutor_student'
  | 'family_friend_approved'
  | 'professional_mentor'
  | 'unknown_safe'          // no red flags, context cannot be determined
  | 'unknown_suspicious'    // context cannot be determined AND suspicious signals present
  | 'inappropriate';        // clear indicators of inappropriate interaction

/** Verdict returned for a minor-adult conversation context check. */
export type MessageContextVerdict =
  | 'safe'        // recognized safe relationship — no action
  | 'monitor'     // unclear context — flag for passive monitoring
  | 'flag'        // suspicious signals — block and queue for triad review
  | 'block';      // certain inappropriate interaction — block immediately

export interface MessageContextInput {
  /** Age of the minor participant (13–17). */
  minorAge: number;
  /** Age of the adult participant (18+). */
  adultAge: number;
  /**
   * Recent message text from the conversation (most recent first).
   * Maximum 20 messages examined for context signals.
   */
  recentMessages: Array<{
    senderIsMinor: boolean;
    text: string;
  }>;
  /**
   * Optional declared relationship type provided at the time the conversation
   * was started (e.g., the adult stated "I am their teacher").
   */
  declaredRelationship?: string;
  /**
   * Number of previously flagged incidents for this adult in minor-adult
   * conversations. Used to apply stricter treatment for repeat actors.
   */
  adultPriorFlags?: number;
  /**
   * Whether the adult has sent any image solicitation messages in this
   * conversation. Triggers C33_SOLICITING_IMAGES if true.
   */
  adultSolicitedImages?: boolean;
}

export interface MessageContextResult {
  /** Enforcement verdict for this conversation. */
  verdict: MessageContextVerdict;
  /** Detected relationship context type. */
  contextType: MessageContextType;
  /** Human-readable reason (user-safe — no internal signal detail). */
  reason: string;
  /** Whether TheBoogieMan should immediately block further messages. */
  blockMessages: boolean;
  /** Whether to escalate to human review queue. */
  escalate: boolean;
  /** Whether the adult should be permanently banned (requires human confirmation). */
  adultPermanentBanRecommended: boolean;
  /** Whether the minor should receive a warning. */
  minorWarning: boolean;
  /** Whether to lock the minor's account pending parental consent unlock. */
  minorAccountLock: boolean;
  /** Internal audit payload — for DB logging only, never returned to clients. */
  _audit: {
    signals: string[];
    safe_context_signals: string[];
    suspicious_signal_count: number;
  };
}

// ============================================================================
// SAFE RELATIONSHIP CONTEXT SIGNALS
// These keyword patterns suggest a legitimate, safe adult-minor relationship.
// High weight = strong evidence of safe context.
// ============================================================================

const SAFE_CONTEXT_PATTERNS: { pattern: RegExp; weight: number; contextType: MessageContextType; label: string }[] = [
  // Teacher / student
  { pattern: /\b(teacher|instructor|professor|class|homework|assignment|grades?|test|exam|lecture|lesson|school|curriculum|syllabus)\b/i, weight: 0.9, contextType: 'teacher_student', label: 'teacher_context' },
  { pattern: /\b(due\s+date|submit|essay|project|student|classroom|study\s+group|school\s+work)\b/i, weight: 0.8, contextType: 'teacher_student', label: 'teacher_context_2' },
  // Coach / athlete
  { pattern: /\b(coach|practice|training|game|match|team|drill|sport|athlete|workout|schedule|tournament|tryout)\b/i, weight: 0.8, contextType: 'coach_athlete', label: 'coach_context' },
  // Family member
  { pattern: /\b(mom|dad|uncle|aunt|grandma|grandpa|cousin|sibling|brother|sister|parent|guardian|family)\b/i, weight: 0.9, contextType: 'family_member', label: 'family_context' },
  // Youth group leader
  { pattern: /\b(youth\s+group|scout|troop|club\s+meeting|volunteer|church\s+group|community\s+center|mentor\s+program)\b/i, weight: 0.85, contextType: 'youth_group_leader', label: 'youth_group_context' },
  // Tutor
  { pattern: /\b(tutor|tutoring|study\s+session|practice\s+problems?|math\s+help|reading\s+help|writing\s+help)\b/i, weight: 0.85, contextType: 'tutor_student', label: 'tutor_context' },
  // Professional mentor
  { pattern: /\b(mentor|internship|job\s+shadowing|career\s+advice|professional\s+development|work\s+experience)\b/i, weight: 0.7, contextType: 'professional_mentor', label: 'mentor_context' },
];

// ============================================================================
// SUSPICIOUS / INAPPROPRIATE SIGNALS
// These patterns, in combination with a minor-adult conversation, raise concern.
// High weight = strong concern signal.
// These overlap with GROOMING_PATTERNS in childSafetyDetector but are evaluated
// at the conversation level rather than per-message.
// ============================================================================

const SUSPICIOUS_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  // Requests to communicate off-platform
  { pattern: /\b(telegram|signal|kik|snap(chat)?|discord|whatsapp|another\s+app|text\s+me|call\s+me)\b/i, weight: 0.7, label: 'off_platform_request' },
  // Secrecy
  { pattern: /\b(don'?t\s+tell|keep\s+this\s+secret|just\s+between\s+us|our\s+little\s+secret|no\s+one\s+needs\s+to\s+know)\b/i, weight: 0.9, label: 'secrecy_coercion' },
  // Gift / bribe
  { pattern: /\b(i'?ll\s+(buy|send|give|pay|get)\s+you|gift\s+card|amazon|cash|venmo|cashapp)\b/i, weight: 0.7, label: 'bribe' },
  // Meeting alone
  { pattern: /\b(meet\s+(up|me)|come\s+over|come\s+to\s+my|by\s+yourself|alone|just\s+(the\s+two\s+of\s+)?us)\b/i, weight: 0.75, label: 'meeting_alone' },
  // Age / maturity comments
  { pattern: /\byou('?re|are)\s+so\s+mature\b/i, weight: 0.8, label: 'maturity_flattery' },
  { pattern: /\bfor\s+your\s+age\b/i, weight: 0.6, label: 'age_reference' },
  // Romantic / sexual overtures
  { pattern: /\b(i\s+love\s+you|you'?re\s+(so\s+)?beautiful|you'?re\s+(so\s+)?hot|you'?re\s+(so\s+)?cute)\b/i, weight: 0.65, label: 'romantic_language' },
  { pattern: /\b(relationship|dating|be\s+my\s+(girl|boy)(friend)?)\b/i, weight: 0.7, label: 'romantic_solicitation' },
  // Image requests (covered by C33_SOLICITING_IMAGES but also flagged here in context)
  { pattern: /\b(send\s+(me\s+)?(a\s+)?(pic|photo|picture|selfie|nude|nudes)|show\s+me\s+(yourself|your\s+body))\b/i, weight: 0.95, label: 'image_solicitation' },
];

// ============================================================================
// DECLARED SAFE RELATIONSHIP KEYWORDS
// ============================================================================

const DECLARED_SAFE_RELATIONSHIPS = [
  'teacher', 'instructor', 'coach', 'parent', 'guardian', 'aunt', 'uncle',
  'grandparent', 'relative', 'family', 'tutor', 'mentor', 'youth leader',
  'scout leader', 'club leader', 'counselor',
];

// ============================================================================
// SCORING HELPERS
// ============================================================================

function scanMessages(
  messages: Array<{ senderIsMinor: boolean; text: string }>,
  patterns: { pattern: RegExp; weight: number; label: string }[],
): { totalWeight: number; matchedLabels: string[] } {
  // Combine all message texts for context evaluation
  const combined = messages
    .slice(0, 20)
    .map((m) => m.text)
    .join(' ')
    .normalize('NFKC');

  let totalWeight = 0;
  const matchedLabels: string[] = [];

  for (const { pattern, weight, label } of patterns) {
    if (pattern.test(combined)) {
      totalWeight += weight;
      matchedLabels.push(label);
    }
  }

  return { totalWeight, matchedLabels };
}

function scanMessagesForContext(
  messages: Array<{ senderIsMinor: boolean; text: string }>,
): { contextType: MessageContextType; safeSignals: string[]; totalSafeWeight: number } {
  const combined = messages
    .slice(0, 20)
    .map((m) => m.text)
    .join(' ')
    .normalize('NFKC');

  let topWeight = 0;
  let topContextType: MessageContextType = 'unknown_safe';
  const safeSignals: string[] = [];

  for (const { pattern, weight, contextType, label } of SAFE_CONTEXT_PATTERNS) {
    if (pattern.test(combined)) {
      safeSignals.push(label);
      if (weight > topWeight) {
        topWeight = weight;
        topContextType = contextType;
      }
    }
  }

  return { contextType: topContextType, safeSignals, totalSafeWeight: topWeight };
}

function isDeclaredSafeRelationship(declared?: string): boolean {
  if (!declared) return false;
  const lower = declared.toLowerCase();
  return DECLARED_SAFE_RELATIONSHIPS.some((kw) => lower.includes(kw));
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * evaluateMessageContext — context-aware minor-adult message safety evaluator.
 *
 * Examines a minor-adult conversation for signals of safe vs. inappropriate
 * interaction. Used by all three AI triad members as part of their child
 * safety protocol. Returns a verdict that drives enforcement.
 *
 * All three AI members (Dr. Eams, IDARi, TheBoogieMan.Ai) call this during
 * any interaction where a known minor (13–17) and adult (18+) are communicating.
 *
 * @param input - Conversation metadata and recent messages.
 * @returns MessageContextResult with verdict and enforcement guidance.
 */
export function evaluateMessageContext(input: MessageContextInput): MessageContextResult {
  const {
    minorAge,
    adultAge,
    recentMessages,
    declaredRelationship,
    adultPriorFlags = 0,
    adultSolicitedImages = false,
  } = input;

  // Validate age boundaries
  const isActualMinor = minorAge >= 13 && minorAge < 18;
  const isActualAdult = adultAge >= 18;

  // If not actually a minor-adult pair, return safe (no action needed)
  if (!isActualMinor || !isActualAdult) {
    return {
      verdict: 'safe',
      contextType: 'unknown_safe',
      reason: 'Not a minor-adult conversation.',
      blockMessages: false,
      escalate: false,
      adultPermanentBanRecommended: false,
      minorWarning: false,
      minorAccountLock: false,
      _audit: { signals: [], safe_context_signals: [], suspicious_signal_count: 0 },
    };
  }

  const auditSignals: string[] = [];

  // ── Immediate: adult solicited images from minor ─────────────────────────
  if (adultSolicitedImages) {
    auditSignals.push('adult_solicited_images');
    return {
      verdict: 'block',
      contextType: 'inappropriate',
      reason: 'An adult soliciting images from a minor is a zero-tolerance violation.',
      blockMessages: true,
      escalate: true,
      adultPermanentBanRecommended: true,
      minorWarning: true,
      minorAccountLock: false,
      _audit: { signals: auditSignals, safe_context_signals: [], suspicious_signal_count: 1 },
    };
  }

  // ── Scan for suspicious patterns in messages ──────────────────────────────
  const suspiciousResult = scanMessages(recentMessages, SUSPICIOUS_PATTERNS);
  const { contextType, safeSignals, totalSafeWeight } = scanMessagesForContext(recentMessages);

  // Include suspicious signal labels in audit
  auditSignals.push(...suspiciousResult.matchedLabels);

  const hasSuspicious = suspiciousResult.matchedLabels.length > 0;
  const suspiciousWeight = suspiciousResult.totalWeight;
  const hasSafeContext = safeSignals.length > 0 || isDeclaredSafeRelationship(declaredRelationship);

  // If adult has prior flags, apply stricter evaluation
  const priorFlagMultiplier = 1 + (adultPriorFlags * 0.5);
  const adjustedSuspiciousWeight = suspiciousWeight * priorFlagMultiplier;

  // ── Decision logic ────────────────────────────────────────────────────────

  // Case 1: Strong suspicious signals + no safe context → block and escalate
  if (adjustedSuspiciousWeight >= 1.5 && !hasSafeContext) {
    return {
      verdict: 'block',
      contextType: 'inappropriate',
      reason: 'Multiple inappropriate signals detected in a minor-adult conversation with no recognizable safe context.',
      blockMessages: true,
      escalate: true,
      adultPermanentBanRecommended: adjustedSuspiciousWeight >= 2.5,
      minorWarning: true,
      minorAccountLock: adultPriorFlags >= 3,
      _audit: { signals: auditSignals, safe_context_signals: safeSignals, suspicious_signal_count: suspiciousResult.matchedLabels.length },
    };
  }

  // Case 2: Moderate suspicious signals + no safe context → flag for review
  if (adjustedSuspiciousWeight >= 0.7 && !hasSafeContext) {
    return {
      verdict: 'flag',
      contextType: hasSuspicious ? 'unknown_suspicious' : 'unknown_safe',
      reason: 'Suspicious signals detected in a minor-adult conversation. Queued for triad review.',
      blockMessages: true,
      escalate: true,
      adultPermanentBanRecommended: false,
      minorWarning: false,
      minorAccountLock: false,
      _audit: { signals: auditSignals, safe_context_signals: safeSignals, suspicious_signal_count: suspiciousResult.matchedLabels.length },
    };
  }

  // Case 3: Suspicious signals present BUT strong safe context → monitor only
  if (hasSuspicious && hasSafeContext && totalSafeWeight >= 0.8) {
    return {
      verdict: 'monitor',
      contextType,
      reason: 'Minor suspicious signals noted, but conversation appears to be in a recognized safe context. Monitoring.',
      blockMessages: false,
      escalate: false,
      adultPermanentBanRecommended: false,
      minorWarning: false,
      minorAccountLock: false,
      _audit: { signals: auditSignals, safe_context_signals: safeSignals, suspicious_signal_count: suspiciousResult.matchedLabels.length },
    };
  }

  // Case 4: Safe context recognized, no significant suspicious signals → safe
  if (hasSafeContext && !hasSuspicious) {
    return {
      verdict: 'safe',
      contextType,
      reason: 'Conversation is in a recognized safe context (e.g., teacher-student, coach-athlete, family).',
      blockMessages: false,
      escalate: false,
      adultPermanentBanRecommended: false,
      minorWarning: false,
      minorAccountLock: false,
      _audit: { signals: [], safe_context_signals: safeSignals, suspicious_signal_count: 0 },
    };
  }

  // Case 5: No context signals at all — default to monitoring
  return {
    verdict: 'monitor',
    contextType: 'unknown_safe',
    reason: 'Minor-adult conversation with no context signals detected. Passively monitoring.',
    blockMessages: false,
    escalate: false,
    adultPermanentBanRecommended: false,
    minorWarning: false,
    minorAccountLock: false,
    _audit: { signals: auditSignals, safe_context_signals: safeSignals, suspicious_signal_count: suspiciousResult.matchedLabels.length },
  };
}

/**
 * CHILD SAFETY LAW SUMMARY (for all three AI triad members)
 *
 * All DREAMengin AI agents (Dr. Eams, IDARi, TheBoogieMan.Ai) must be aware
 * of and enforce the following laws when handling content involving minors:
 *
 * 1. PROTECT Act (18 U.S.C. §2256, §2258A):
 *    - Any visual depiction of a minor in sexually explicit conduct is CSAM.
 *    - Mandatory reporting to NCMEC CyberTipline.
 *    - Zero tolerance. No context makes CSAM acceptable.
 *
 * 2. COPPA (15 U.S.C. §6501–6506):
 *    - Children under 13 require verifiable parental consent.
 *    - DREAMengin minimum age is 13. Anyone under 13 is rejected at signup.
 *
 * 3. CIPA (Children's Internet Protection Act):
 *    - Must filter/block harmful material when minors are accessing the platform.
 *    - All image attachments from minors to adults are blocked regardless of content.
 *
 * 4. CDA §230 / STOP CSAM Act (2023):
 *    - Platforms lose safe harbor when they have actual knowledge of CSAM and fail to act.
 *    - The platform must adopt reasonable technical measures to detect and remove CSAM.
 *
 * 5. Age-Appropriate Design Codes (e.g., California AB 2273, UK Children's Code):
 *    - Highest privacy settings must be applied by default for minors.
 *    - Profiling and targeted advertising are prohibited for minors.
 *    - Nudges or persuasive design that harms minors are prohibited.
 */
export const CHILD_SAFETY_LAW_SUMMARY = `
CHILD SAFETY LAWS — All DREAMengin AI Triad Members Must Enforce These Rules

1. PROTECT Act (18 U.S.C. §2256): CSAM is zero-tolerance. Mandatory NCMEC reporting.
2. COPPA: Minimum age 13. No data collection from under-13s without parental consent.
3. CIPA: Block harmful material for minors. All images from minors to adults are blocked.
4. CDA §230 / STOP CSAM Act: Platform loses safe harbor for known CSAM. Act immediately.
5. Age-Appropriate Design Codes: Apply maximum privacy and safety defaults for all minor accounts.

MINOR-ADULT MESSAGING RULES:
- Minors (13–17) and adults (18+) may message each other, EXCEPT:
  * Any image from a minor to an adult is ALWAYS blocked (rule C32_MINOR_IMAGE). No exceptions.
  * Adults soliciting images from minors are permanently banned (rule C33_SOLICITING_IMAGES).
- TheBoogieMan.Ai continuously monitors conversations for grooming, harassment, and inappropriate content.
- If safe context is detected (teacher-student, coach, family, etc.), no action is taken.
- If inappropriate content is detected: messages are blocked, adult is flagged for permanent ban, minor receives a warning.
- Minor repeat violations: account is locked and requires parental consent to unlock.

IMAGE RULES (strict):
- Any image sent by a minor to an adult is ALWAYS blocked. No exceptions.
- The adult sees: "This image was sent from a minor and has been blocked."
- All images are scanned for CSAM. If the AI is uncertain, the image is blocked.
- Adults who solicit images from minors are permanently banned.
- Images of real people must have verified consent and age verification.

CONTEXT EVALUATION:
- All three AI members evaluate context of minor-adult conversations.
- Safe contexts (teacher, coach, family, youth leader) are recognized and allowed with monitoring.
- Suspicious or ambiguous contexts trigger triad review.
- Certain inappropriate interactions trigger immediate block and permanent ban recommendation.
` as const;
