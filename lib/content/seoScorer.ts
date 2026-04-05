/**
 * seoScorer – real-time SEO / content performance scoring logic.
 *
 * Pure-function scoring that runs client-side for instant feedback,
 * with an optional server round-trip for persistence (via /api/content/intelligence).
 */

export interface SeoScoreInput {
  /** Title or headline text */
  title?: string;
  /** Body / description text */
  body?: string;
  /** Target keyword(s) */
  keywords?: string[];
}

export interface SeoScoreDimension {
  label: string;
  score: number;
  maxScore: number;
  suggestion: string;
}

export interface SeoScoreResult {
  /** Overall score 0–100 */
  overall: number;
  dimensions: SeoScoreDimension[];
  /** Plain-text suggestions ordered by impact */
  topSuggestions: string[];
  /** Readability grade (Flesch-Kincaid rough estimate) */
  readabilityGrade: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreTitle(title: string, keywords: string[]): SeoScoreDimension {
  let score = 0;
  const suggestions: string[] = [];

  if (title.length >= 30 && title.length <= 70) {
    score += 25;
  } else {
    suggestions.push(
      title.length < 30
        ? 'Title is too short — aim for 30-70 characters.'
        : 'Title is too long — keep it under 70 characters.'
    );
  }

  if (/\d/.test(title)) {
    score += 10;
  } else {
    suggestions.push('Add a number to boost click-through rate.');
  }

  if (/(how|why|what|guide|best|tips|ultimate|secret|top|\d+\s+ways)/i.test(title)) {
    score += 15;
  } else {
    suggestions.push('Include a power word (How, Why, Best, Top, Ultimate…).');
  }

  if (/(you|your)/i.test(title)) {
    score += 10;
  } else {
    suggestions.push('Address the reader directly ("you / your").');
  }

  const kwHit = keywords.some(k => title.toLowerCase().includes(k.toLowerCase()));
  if (kwHit) {
    score += 15;
  } else if (keywords.length > 0) {
    suggestions.push(`Include your target keyword in the title.`);
  } else {
    score += 5; // no kw specified — neutral
  }

  return {
    label: 'Title',
    score,
    maxScore: 75,
    suggestion: suggestions[0] ?? 'Title looks solid!',
  };
}

function scoreBody(body: string, keywords: string[]): SeoScoreDimension {
  let score = 0;
  const suggestions: string[] = [];

  const words = body.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 150) {
    score += 15;
  } else {
    suggestions.push('Longer content (150+ words) ranks better.');
  }

  const headingCount = (body.match(/^#{1,3}\s/gm) ?? []).length;
  if (headingCount >= 2) {
    score += 10;
  } else {
    suggestions.push('Add 2+ headings to improve structure.');
  }

  const kwDensity =
    keywords.length > 0
      ? keywords.reduce((acc, k) => {
          const re = new RegExp(k, 'gi');
          return acc + (body.match(re)?.length ?? 0);
        }, 0) / Math.max(words.length, 1)
      : 0;

  if (keywords.length === 0) {
    score += 10;
  } else if (kwDensity >= 0.01 && kwDensity <= 0.03) {
    score += 15;
  } else if (kwDensity < 0.01) {
    suggestions.push('Keyword density is low — mention your keywords more naturally.');
  } else {
    suggestions.push('Keyword density is high — avoid stuffing (keep it under 3%).');
    score += 5;
  }

  return {
    label: 'Body',
    score,
    maxScore: 40,
    suggestion: suggestions[0] ?? 'Body copy is well-optimised.',
  };
}

function roughFleschGrade(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length || 1;
  const syllables = text
    .toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .split(/\s+/)
    .reduce((acc, w) => acc + countSyllables(w), 0) || 1;

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

  if (score >= 70) return 'Easy (Grade 6)';
  if (score >= 60) return 'Standard (Grade 8-9)';
  if (score >= 50) return 'Fairly Difficult (Grade 10-12)';
  return 'Difficult (College+)';
}

function countSyllables(word: string): number {
  if (word.length <= 3) return 1;
  const cleaned = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches?.length ?? 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score content client-side with zero latency.
 */
export function scoreContent(input: SeoScoreInput): SeoScoreResult {
  const title = input.title ?? '';
  const body = input.body ?? '';
  const keywords = input.keywords ?? [];

  const dimensions: SeoScoreDimension[] = [];

  if (title) {
    dimensions.push(scoreTitle(title, keywords));
  }

  if (body) {
    dimensions.push(scoreBody(body, keywords));
  }

  const rawTotal = dimensions.reduce((a, d) => a + d.score, 0);
  const rawMax = dimensions.reduce((a, d) => a + d.maxScore, 0);
  const overall = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 50;

  const topSuggestions = dimensions
    .map(d => d.suggestion)
    .filter(s => !s.toLowerCase().includes('looks solid') && !s.toLowerCase().includes('well-optimised'));

  const readabilityGrade = body ? roughFleschGrade(body) : roughFleschGrade(title);

  return { overall, dimensions, topSuggestions, readabilityGrade };
}
