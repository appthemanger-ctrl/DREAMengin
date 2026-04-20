/**
 * lib/dreamr/dreamrAlgorithm.ts — re-export shim.
 *
 * The canonical DreamR algorithm now lives at
 *   `dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm.ts`
 * (the staging mirror), where the feed routes and the test suite already
 * import it from. This file used to be a literal duplicate; keeping two
 * copies of a scoring algorithm in sync by hand is exactly the kind of
 * silent-drift hazard we don't want, so it now just re-exports.
 */

export * from '@/dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm';
