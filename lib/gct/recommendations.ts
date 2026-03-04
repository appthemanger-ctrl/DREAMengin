import { GCTEngine, Template } from './gct-engine';

export interface ItemProfile {
  id: string;
  vector: Float32Array;
}

/**
 * Returns ranked item IDs based on vector correlation to user history.
 */
export async function recommendItems(
  userHistory: Float32Array,
  itemProfiles: ItemProfile[],
  threshold = 0.8
): Promise<string[]> {
  if (itemProfiles.length === 0) return [];

  const engine = new GCTEngine({ preferGPU: true, numTemplates: itemProfiles.length });
  await engine.init();

  const templates: Template[] = itemProfiles.map((item) => ({
    id: item.id,
    data: item.vector,
  }));

  const matches = await engine.search(userHistory, templates, threshold);
  return matches
    .sort((a, b) => b.correlation - a.correlation)
    .map((match) => match.templateId);
}
