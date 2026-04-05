/**
 * seoScorer – real-time SEO / content performance scoring logic.
 *
 * Pure-function scoring that runs client-side for instant feedback,
 * with an optional server round-trip for persistence (via /api/content/intelligence).
 *
 * Dimensions scored:
 *   Title      – length, power words, numbers, reader-address, keyword presence
 *   Body       – word count, headings, keyword density, list usage
 *   Engagement – emotional words, CTAs, questions, social proof signals
 *   Accessibility – short sentences, passive-voice avoidance, jargon density
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
  /** Engagement signals count (emotional words, CTAs, etc.) */
  engagementSignals: number;
  /** Estimated accessibility level */
  accessibilityLevel: 'High' | 'Medium' | 'Low';
}

export interface SeoReport {
  input: SeoScoreInput;
  result: SeoScoreResult;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Word lists
// ─────────────────────────────────────────────────────────────────────────────

const POWER_WORDS = /\b(how|why|what|guide|best|tips|ultimate|secret|top|proven|free|new|exclusive|boost|unlock|master|discover|transform|instantly|guaranteed|\d+\s+ways|\d+\s+steps|\d+\s+tips)/i;

const EMOTIONAL_WORDS = /\b(love|fear|hate|amazing|incredible|shocking|terrifying|hilarious|inspiring|heartbreaking|jaw-dropping|mind-blowing|powerful|urgent|limited|rare|never|always|every|now|today|finally|breakthrough|revolutionary|life-changing|must|need|secret|hidden|danger|warning|alert|win|lose|fail|succeed|crush|dominate|skyrocket|explode)\b/gi;

const CTA_WORDS = /\b(click|subscribe|follow|share|like|comment|download|buy|join|get|start|try|discover|learn|watch|read|sign up|register|grab|claim)\b/gi;

const PASSIVE_VOICE = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;

const JARGON_WORDS = /\b(synergy|leverage|paradigm|holistic|scalable|agile|disruptive|pivot|bandwidth|actionable|deliverable|ecosystem|ideate|verticals|stakeholder|roi|kpi|b2b|b2c|saas|cpc|ctr|seo|sem|crm|erp|api|ux|ui|sdk|ide)\b/gi;

// ─────────────────────────────────────────────────────────────────────────────
// Dimension scorers
// ─────────────────────────────────────────────────────────────────────────────

function scoreTitle(title: string, keywords: string[]): SeoScoreDimension {
  let score = 0;
  const suggestions: string[] = [];

  if (title.length >= 30 && title.length <= 70) {
    score += 25;
  } else {
    suggestions.push(
      title.length < 30
        ? 'Title is too short — aim for 30–70 characters.'
        : 'Title is too long — keep it under 70 characters.'
    );
  }

  if (/\d/.test(title)) {
    score += 10;
  } else {
    suggestions.push('Add a number to boost click-through rate (e.g. "7 Ways…").');
  }

  if (POWER_WORDS.test(title)) {
    score += 15;
  } else {
    suggestions.push('Include a power word (How, Why, Best, Top, Ultimate, Guide…).');
  }

  if (/(you|your)/i.test(title)) {
    score += 10;
  } else {
    suggestions.push('Address the reader directly ("you / your") for higher relevance.');
  }

  const kwHit = keywords.some(k => title.toLowerCase().includes(k.toLowerCase()));
  if (kwHit) {
    score += 15;
  } else if (keywords.length > 0) {
    suggestions.push('Place your primary keyword near the start of the title.');
  } else {
    score += 5; // no keyword specified — neutral bonus
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
  if (words.length >= 300) {
    score += 20;
  } else if (words.length >= 150) {
    score += 12;
    suggestions.push('Longer content (300+ words) ranks better for long-tail queries.');
  } else {
    score += 4;
    suggestions.push('Content is short — aim for 150+ words for better ranking signals.');
  }

  const headingCount = (body.match(/^#{1,3}\s/gm) ?? []).length;
  if (headingCount >= 3) {
    score += 15;
  } else if (headingCount >= 1) {
    score += 8;
    suggestions.push('Add more headings (H2/H3) to improve scannability and structure.');
  } else {
    suggestions.push('Add 2+ headings (## or ###) to improve structure and SEO.');
  }

  const hasList = /^[-*]\s|^\d+\.\s/m.test(body);
  if (hasList) {
    score += 10;
  } else {
    suggestions.push('Add a bulleted or numbered list to improve scannability.');
  }

  const kwDensity =
    keywords.length > 0
      ? keywords.reduce((acc, k) => {
          const re = new RegExp(`\\b${k}\\b`, 'gi');
          return acc + (body.match(re)?.length ?? 0);
        }, 0) / Math.max(words.length, 1)
      : 0;

  if (keywords.length === 0) {
    score += 10; // no target kw — neutral
  } else if (kwDensity >= 0.01 && kwDensity <= 0.03) {
    score += 15;
  } else if (kwDensity < 0.01) {
    suggestions.push('Keyword density is low — mention your keywords more naturally (aim 1–3%).');
  } else {
    score += 5;
    suggestions.push('Keyword density is too high — avoid stuffing (keep it under 3%).');
  }

  return {
    label: 'Body',
    score,
    maxScore: 60,
    suggestion: suggestions[0] ?? 'Body copy is well-optimised.',
  };
}

function scoreEngagement(text: string): SeoScoreDimension & { signalCount: number } {
  let score = 0;
  const suggestions: string[] = [];

  const emotionalMatches = text.match(EMOTIONAL_WORDS) ?? [];
  const ctaMatches = text.match(CTA_WORDS) ?? [];
  const questionCount = (text.match(/\?/g) ?? []).length;
  const signalCount = emotionalMatches.length + ctaMatches.length + questionCount;

  if (emotionalMatches.length >= 3) {
    score += 15;
  } else if (emotionalMatches.length >= 1) {
    score += 8;
    suggestions.push('Add more emotional trigger words to increase resonance.');
  } else {
    suggestions.push('Use emotional language to connect with your audience.');
  }

  if (ctaMatches.length >= 1) {
    score += 15;
  } else {
    suggestions.push('Add a clear call-to-action (Subscribe, Download, Learn more…).');
  }

  if (questionCount >= 1) {
    score += 10;
  } else {
    suggestions.push('Ask a question to drive comments and engagement.');
  }

  return {
    label: 'Engagement',
    score,
    maxScore: 40,
    suggestion: suggestions[0] ?? 'Engagement signals look strong!',
    signalCount,
  };
}

function scoreAccessibility(body: string): SeoScoreDimension & { level: 'High' | 'Medium' | 'Low' } {
  let score = 0;
  const suggestions: string[] = [];

  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = sentences.length > 0
    ? body.trim().split(/\s+/).length / sentences.length
    : 0;

  if (avgWordsPerSentence > 0 && avgWordsPerSentence <= 20) {
    score += 15;
  } else if (avgWordsPerSentence <= 25) {
    score += 8;
    suggestions.push('Some sentences are long — aim for under 20 words per sentence.');
  } else {
    suggestions.push('Sentences are too long — break them up for better readability.');
  }

  const passiveCount = (body.match(PASSIVE_VOICE) ?? []).length;
  if (passiveCount === 0) {
    score += 10;
  } else if (passiveCount <= 2) {
    score += 5;
  } else {
    suggestions.push('Reduce passive voice to make the text more direct and readable.');
  }

  const jargonCount = (body.match(JARGON_WORDS) ?? []).length;
  if (jargonCount === 0) {
    score += 10;
  } else if (jargonCount <= 3) {
    score += 5;
    suggestions.push('Consider explaining jargon terms for broader accessibility.');
  } else {
    suggestions.push('High jargon density may alienate general audiences — simplify where possible.');
  }

  const total = score;
  const level: 'High' | 'Medium' | 'Low' =
    total >= 28 ? 'High' : total >= 14 ? 'Medium' : 'Low';

  return {
    label: 'Accessibility',
    score,
    maxScore: 35,
    suggestion: suggestions[0] ?? 'Accessibility looks good!',
    level,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Readability
// ─────────────────────────────────────────────────────────────────────────────

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
  if (score >= 60) return 'Standard (Grade 8–9)';
  if (score >= 50) return 'Fairly Difficult (Grade 10–12)';
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
 *
 * Returns scores across four dimensions: Title, Body, Engagement, Accessibility.
 */
export function scoreContent(input: SeoScoreInput): SeoScoreResult {
  const title = input.title ?? '';
  const body = input.body ?? '';
  const keywords = input.keywords ?? [];
  const fullText = [title, body].filter(Boolean).join(' ');

  const dimensions: SeoScoreDimension[] = [];
  let engagementSignals = 0;
  let accessibilityLevel: 'High' | 'Medium' | 'Low' = 'Medium';

  if (title) {
    dimensions.push(scoreTitle(title, keywords));
  }

  if (body) {
    dimensions.push(scoreBody(body, keywords));
  }

  if (fullText) {
    const eng = scoreEngagement(fullText);
    engagementSignals = eng.signalCount;
    dimensions.push({ label: eng.label, score: eng.score, maxScore: eng.maxScore, suggestion: eng.suggestion });
  }

  if (body) {
    const acc = scoreAccessibility(body);
    accessibilityLevel = acc.level;
    dimensions.push({ label: acc.label, score: acc.score, maxScore: acc.maxScore, suggestion: acc.suggestion });
  }

  const rawTotal = dimensions.reduce((a, d) => a + d.score, 0);
  const rawMax = dimensions.reduce((a, d) => a + d.maxScore, 0);
  const overall = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 50;

  const topSuggestions = dimensions
    .map(d => d.suggestion)
    .filter(s =>
      !s.toLowerCase().includes('looks solid') &&
      !s.toLowerCase().includes('well-optimised') &&
      !s.toLowerCase().includes('looks strong') &&
      !s.toLowerCase().includes('looks good')
    );

  const readabilityGrade = body ? roughFleschGrade(body) : roughFleschGrade(title);

  return { overall, dimensions, topSuggestions, readabilityGrade, engagementSignals, accessibilityLevel };
}

/**
 * Generate a full JSON report for the scored content.
 * Useful for saving to Supabase or exporting as a file.
 */
export function generateReport(input: SeoScoreInput): SeoReport {
  return {
    input,
    result: scoreContent(input),
    generatedAt: new Date().toISOString(),
  };
}

