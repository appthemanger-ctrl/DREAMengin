import { PolicyCategory, type PolicyCategoryValue } from '@/lib/policy/boogiePolicy';

export type ActivityFeedTreatment = 'feed' | 'search_only' | 'blocked';

export interface BoogieActivitySignals {
  category?: PolicyCategoryValue | string | null;
  policyRef?: string | null;
  isProfessional?: boolean;
  safetyDisclaimer?: boolean;
  viewerIsMinor?: boolean;
}

const SEARCH_ONLY_CATEGORIES = new Set<string>([
  PolicyCategory.VIOLENCE,
  PolicyCategory.SELF_HARM,
]);

const BLOCKED_FOR_MINORS = new Set<string>([
  PolicyCategory.VIOLENCE,
  PolicyCategory.SELF_HARM,
  PolicyCategory.SEXUAL,
  PolicyCategory.MINORS,
]);

// Check-ins more than a 5km neighborhood-to-neighborhood jump from trusted
// context are treated as impossible until Boogie receives stronger evidence.
const IMPOSSIBLE_CHECK_IN_METERS = 5000;

// A 25% bot-view share is high enough to indicate coordinated view fraud while
// leaving room for noisy anonymous traffic before enforcement.
const BOT_VIEW_SPIKE_RATE = 0.25;

export function resolveActivityFeedTreatment(signals: BoogieActivitySignals: ActivityFeedTreatment {
  const category = signals.category ?? PolicyCategory.NONE;
  if (signals.viewerIsMinor && BLOCKED_FOR_MINORS.has(category)) return 'blocked';
  if (category === PolicyCategory.MINORS) return 'blocked';
  if (category === PolicyCategory.SELF_HARM) return 'blocked';
  if (SEARCH_ONLY_CATEGORIES.has(category)) return 'search_only';
  return 'feed';
}

export function shouldExcludeFromFeed(signals: BoogieActivitySignals: boolean {
  return resolveActivityFeedTreatment(signals) !== 'feed';
}

export function detectActivityFraudSignals(params: {
  duplicateContent?: boolean;
  fakeCheckInDistanceMeters?: number | null;
  botViewRate?: number;
  repeatedEvidenceHash?: boolean;
}): string[] {
  const out: string[] = [];
  if (params.duplicateContent) out.push('duplicate_content');
  if ((params.fakeCheckInDistanceMeters ?? 0) > IMPOSSIBLE_CHECK_IN_METERS) {
    out.push('impossible_check_in');
  }
  if ((params.botViewRate ?? 0) > BOT_VIEW_SPIKE_RATE) out.push('bot_view_spike');
  if (params.repeatedEvidenceHash) out.push('reused_evidence');
  return out;
}
