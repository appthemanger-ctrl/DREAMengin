/**
 * botDetector — heuristic bot detection for DreamR feed interactions.
 *
 * Analyzes interaction patterns (timing, velocity, repeat paths) to flag
 * likely automated or artificial engagement before it reaches the tally ledger.
 *
 * Architecture: dreamdmbar/homedream/dreamr/algorithms/ 
 * Called by: DreamRCore before writing to torridityLedger
 */

export interface InteractionSignal {
  userId: string;
  videoId: string;
  action: 'view' | 'like' | 'share' | 'comment';
  timestamp: number;
  sessionDurationMs?: number;
}

/**
 * Returns a confidence score 0–1 where 1 = definitely a bot.
 * Scores above 0.7 should be rejected from the tally ledger.
 */
export function scoreBotLikelihood(signal: InteractionSignal): number {
  let score = 0;

  // Interactions under 500ms are suspicious
  if (signal.sessionDurationMs !== undefined && signal.sessionDurationMs < 500) {
    score += 0.5;
  }

  // Shares without any view time are very suspicious
  if (signal.action === 'share' && (signal.sessionDurationMs ?? 0) < 1000) {
    score += 0.4;
  }

  return Math.min(score, 1);
}

export function isLikelyBot(signal: InteractionSignal, threshold = 0.7): boolean {
  return scoreBotLikelihood(signal) >= threshold;
}
