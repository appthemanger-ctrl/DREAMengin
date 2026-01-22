
export type FeedItem = {
  id: string; user_id: string; source: string; source_account?: string | null;
  external_id?: string | null; ts: string; title?: string | null; summary?: string | null;
  url?: string | null; media_json?: any; tags_json?: any; importance_score?: number | null;
  dedupe_hash?: string | null; saved_by_user?: boolean; retained_until?: string | null;
};
export type RuleSet = {
  mutedKeywords?: string[]; mutedAccounts?: string[];
  frequencyCaps?: Record<string, number>; dailyBudget?: number;
  boostKeywords?: string[]; pinnedAccounts?: string[]; priorityFriends?: string[];
};

function match(i: FeedItem, k: string) {
  const s = `${i.title ?? ''} ${i.summary ?? ''}`.toLowerCase();
  return s.includes(k.toLowerCase());
}

export function rankAndFilter(items: FeedItem[], rules: RuleSet, now = new Date()) {
  const seen = new Set<string>();
  let filtered = items.filter(i => {
    const key = i.dedupe_hash ?? i.url ?? `${i.source}:${i.external_id}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  }).filter(i => !rules.mutedKeywords?.some(k => match(i,k))
             && !rules.mutedAccounts?.includes(i.source_account ?? ''));

  const capBySrc = new Map<string, number>();
  filtered = filtered.filter(i => {
    const cap = rules.frequencyCaps?.[i.source] ?? Infinity;
    const used = capBySrc.get(i.source) ?? 0;
    if (used >= cap) return false; capBySrc.set(i.source, used+1); return true;
  });

  const scored = filtered.map(i => {
    let s = 0;
    const ageH = (now.getTime() - new Date(i.ts).getTime())/36e5;
    s += Math.max(0, 48 - ageH);
    if (rules.boostKeywords?.some(k => match(i,k))) s += 10;
    if (rules.pinnedAccounts?.includes(i.source_account ?? '')) s += 15;
    if (i.tags_json && JSON.stringify(i.tags_json).includes('time_critical')) s += 20;
    return { ...i, _score: s };
  }) as any[];

  const budget = rules.dailyBudget ?? 50;
  return scored.sort((a,b)=>b._score - a._score).slice(0, budget);
}
