/**
 * lib/torridity/index.ts — §37 Torridity Physics
 *
 * Re-exports all constants and physics functions.
 */

export { n, deltaP, lambda, a0Perception } from './constants';

export {
  mu,
  contentMass,
  torridityRank,
  decayFactor,
  throttlingGate,
  rankFeed,
  type ContentItem,
  type RankedItem,
} from './physics';
