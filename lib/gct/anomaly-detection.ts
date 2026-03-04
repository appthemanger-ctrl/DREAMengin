import { GCTEngine, Template, type GCTMatch } from './gct-engine';

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  bestMatch: GCTMatch | null;
  matches: GCTMatch[];
}

/**
 * If no normal pattern strongly correlates with recent data, mark as anomalous.
 */
export async function detectAnomalies(
  recentData: Float32Array,
  normalPatterns: Float32Array[],
  threshold = 0.7
): Promise<AnomalyDetectionResult> {
  if (normalPatterns.length === 0) {
    return { isAnomaly: true, bestMatch: null, matches: [] };
  }

  const engine = new GCTEngine({ preferGPU: true, numTemplates: normalPatterns.length });
  await engine.init();

  const templates: Template[] = normalPatterns.map((pattern, index) => ({
    id: `pattern-${index}`,
    data: pattern,
  }));

  const matches = await engine.search(recentData, templates, threshold);
  const sorted = matches.sort((a, b) => b.correlation - a.correlation);

  return {
    isAnomaly: sorted.length === 0,
    bestMatch: sorted[0] ?? null,
    matches: sorted,
  };
}
