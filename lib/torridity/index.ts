/**
 * lib/torridity/index.ts — §37 Torridity Physics
 *
 * Re-exports all constants and physics functions.
 */

export { a0Perception, deltaP, lambda, n } from './constants';

export {
    contentMass, decayFactor, mu, rankFeed, throttlingGate, torridityRank, type ContentItem,
    type RankedItem
} from './physics';
