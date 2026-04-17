/**
 * lib/torridity/constants.ts — §37 Torridity Physics Constants
 *
 * Constants derived from MOND (Modified Newtonian Dynamics) adapted as
 * a content-relevance feed-gravity model for DREAMengin.
 */

/** MOND interpolation exponent. */
export const n = 2.1;

/** Throttle fraction: ΔP = n - 2.  Low-mass content cap at 10 % of feed. */
export const deltaP = n - 2; // 0.1

/** Geometric growth factor (Σ λ^k, k=0..9 = 300). */
export const lambda = 1.71;

/** Scaled MOND acceleration constant for human-perception UI gravity. */
export const a0Perception = 0.05;
