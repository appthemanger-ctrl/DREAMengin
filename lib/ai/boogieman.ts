// lib/ai/boogieman.ts
// Deterministic policy engine for AI safety

import type { Intent } from './schemas';
import type { BoogieResult, BoogieOutput } from './schemas';

interface BoogieEvaluateInput {
  actorRole: 'user' | 'admin';
  rateRpm: number;
  intents: Intent[];
}

const ADMIN_ONLY_INTENTS = ['DIAG_SCHEMA_SNAPSHOT', 'DIAG_RLS_SNAPSHOT'];
const HIGH_RISK_INTENTS = ['DREAM_CONFIG_PATCH', 'DREAM_REORDER'];
const WRITE_INTENTS = ['POST_CREATE', 'DREAM_CONFIG_PATCH', 'DREAM_REORDER'];

/**
 * BoogieMan policy evaluation
 */
export function boogieEvaluate(input: BoogieEvaluateInput): BoogieOutput {
  const { actorRole, rateRpm, intents } = input;

  const perIntentResults: BoogieResult[] = [];
  let globalHardBlock = false;
  let cooldownSeconds = 0;

  // Rate limiting check
  if (rateRpm > 60) {
    globalHardBlock = true;
    cooldownSeconds = 60;
  }

  for (const intent of intents) {
    let decision: BoogieResult['decision'] = 'ALLOW';
    let riskScore = 0.1;
    let reasonCode = 'OK';

    // Rule 1: Unknown intent types → DENY
    if (!intent.type || intent.type.length === 0) {
      decision = 'DENY';
      riskScore = 1.0;
      reasonCode = 'UNKNOWN_INTENT_TYPE';
    }
    // Rule 2: Admin-only intents for non-admin → DENY
    else if (ADMIN_ONLY_INTENTS.includes(intent.type) && actorRole !== 'admin') {
      decision = 'DENY';
      riskScore = 1.0;
      reasonCode = 'ADMIN_REQUIRED';
    }
    // Rule 3: High-risk intents → CONFIRM
    else if (HIGH_RISK_INTENTS.includes(intent.type)) {
      decision = 'CONFIRM';
      riskScore = 0.7;
      reasonCode = 'HIGH_RISK';
    }
    // Rule 4: Write operations + high RPM → CONFIRM
    else if (WRITE_INTENTS.includes(intent.type) && rateRpm > 30) {
      decision = 'CONFIRM';
      riskScore = 0.6;
      reasonCode = 'HIGH_RPM_WRITE';
    }
    // Rule 5: Intent requires confirmation → CONFIRM
    else if (intent.requires_confirmation) {
      decision = 'CONFIRM';
      riskScore = 0.5;
      reasonCode = 'USER_CONFIRMATION_REQUIRED';
    }
    // Rule 6: Low confidence → DENY
    else if (intent.confidence < 0.5) {
      decision = 'DENY';
      riskScore = 0.8;
      reasonCode = 'LOW_CONFIDENCE';
    }

    perIntentResults.push({
      intent_id: intent.intent_id,
      decision,
      risk_score: riskScore,
      reason_code: reasonCode,
    });
  }

  return {
    global: {
      hard_block: globalHardBlock,
      cooldown_seconds: globalHardBlock ? cooldownSeconds : undefined,
    },
    per_intent: perIntentResults,
  };
}
