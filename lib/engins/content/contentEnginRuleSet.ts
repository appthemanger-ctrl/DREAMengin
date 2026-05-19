/**
 * lib/engins/content/contentEnginRuleSet.ts
 *
 * ContentEngin Rule-Set — the ONLY place ContentEngin domain logic lives.
 *
 * Domain: content creation (drafts, calendar, publish queue, SEO, generative fill,
 * voice clone, creativity slider, brand memory).
 * Handoff kind: create:brand-check → BrandingEngin.
 *
 * ZERO infrastructure here: no fetch, no Supabase, no localStorage.
 * The EnginRuntime handles all of that.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Ruleset.
 */

import type {
  EnginAction,
  EnginRuleSetContract,
  EnginRuleSetParams,
  EnginConstraint,
  ConstraintResult,
} from '@/lib/engin-runtime/EnginRuleSetContract';
import {
  patchBaseState,
  type EnginBaseState,
} from '@/lib/engin-runtime/EnginBaseState';
import type { EnginCapability } from '@/lib/engin-runtime/EnginCapabilities';

// ─── Calendar / queue types ───────────────────────────────────────────────────

export type ContentType = 'Post' | 'Video' | 'Story' | 'Thread';

export interface CalendarItem {
  id: string;
  type: ContentType;
  title: string;
  scheduled_at?: string;
}

export interface ContentDraft {
  id: number;
  title: string;
}

// ─── Platform targets ─────────────────────────────────────────────────────────

export type Platform = 'Feed' | 'Stories' | 'DreamDM' | 'Twitter' | 'Instagram' | 'TikTok';

// ─── Domain state shape ───────────────────────────────────────────────────────

export interface ContentEnginDerivedState extends Record<string, unknown> {
  lifecycle: EnginBaseState['lifecycle'];
  drafts: ContentDraft[];
  publishQueue: CalendarItem[];
  activePlatforms: Platform[];
  seoScore: number;
  wordCount: number;
  creativityLevel: number;
  brandCheckReady: boolean;
  stemPayload: Record<string, unknown> | null;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type ContentEnginAction =
  | EnginAction<'content:drafts-loaded',   { drafts: ContentDraft[] }>
  | EnginAction<'content:item-add',        { item: CalendarItem }>
  | EnginAction<'content:item-remove',     { itemId: string }>
  | EnginAction<'content:item-publish',    { itemId: string }>
  | EnginAction<'content:platform-toggle', { platform: Platform }>
  | EnginAction<'content:seo-score',       { score: number; wordCount: number }>
  | EnginAction<'content:creativity-set',  { level: number }>
  | EnginAction<'content:brand-check',     Record<string, never>>
  | EnginAction<'content:stem-received',   { payload: Record<string, unknown> }>;

// ─── Default domain state ─────────────────────────────────────────────────────

const DEFAULT_DOMAIN: Omit<ContentEnginDerivedState, 'lifecycle'> = {
  drafts: [],
  publishQueue: [],
  activePlatforms: ['Feed'],
  seoScore: 0,
  wordCount: 0,
  creativityLevel: 50,
  brandCheckReady: false,
  stemPayload: null,
};

// ─── Constraints ──────────────────────────────────────────────────────────────

const itemAddConstraint: EnginConstraint<ContentEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'content:item-add') return { valid: true };
  const { item } = (action as EnginAction<'content:item-add', { item: CalendarItem }>).payload ?? {};
  if (!item || !item.id || !item.title.trim()) {
    return { valid: false, reason: 'content:item-add requires a valid CalendarItem with a non-empty title.' };
  }
  return { valid: true };
};

const creativityConstraint: EnginConstraint<ContentEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'content:creativity-set') return { valid: true };
  const { level } = (action as EnginAction<'content:creativity-set', { level: number }>).payload ?? {};
  if (typeof level !== 'number' || level < 0 || level > 100) {
    return { valid: false, reason: 'Creativity level must be between 0 and 100.' };
  }
  return { valid: true };
};

// ─── Transform ────────────────────────────────────────────────────────────────

function transform(state: EnginBaseState, action: ContentEnginAction): EnginBaseState {
  const domain = (state.domain as Partial<typeof DEFAULT_DOMAIN>);
  const queue  = () => (domain.publishQueue ?? []) as CalendarItem[];

  switch (action.type) {
    case 'content:drafts-loaded': {
      const { drafts } = (action as EnginAction<'content:drafts-loaded', { drafts: ContentDraft[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, drafts } });
    }

    case 'content:item-add': {
      const { item } = (action as EnginAction<'content:item-add', { item: CalendarItem }>).payload!;
      return patchBaseState(state, { domain: { ...domain, publishQueue: [...queue(), item] } });
    }

    case 'content:item-remove': {
      const { itemId } = (action as EnginAction<'content:item-remove', { itemId: string }>).payload!;
      return patchBaseState(state, {
        domain: { ...domain, publishQueue: queue().filter((i: CalendarItem) => i.id !== itemId) },
      });
    }

    case 'content:item-publish': {
      const { itemId } = (action as EnginAction<'content:item-publish', { itemId: string }>).payload!;
      return patchBaseState(state, {
        domain: { ...domain, publishQueue: queue().filter((i: CalendarItem) => i.id !== itemId) },
      });
    }

    case 'content:platform-toggle': {
      const { platform } = (action as EnginAction<'content:platform-toggle', { platform: Platform }>).payload!;
      const current = (domain.activePlatforms ?? DEFAULT_DOMAIN.activePlatforms) as Platform[];
      const next = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform];
      return patchBaseState(state, { domain: { ...domain, activePlatforms: next } });
    }

    case 'content:seo-score': {
      const { score, wordCount } = (action as EnginAction<'content:seo-score', { score: number; wordCount: number }>).payload!;
      return patchBaseState(state, { domain: { ...domain, seoScore: score, wordCount } });
    }

    case 'content:creativity-set': {
      const { level } = (action as EnginAction<'content:creativity-set', { level: number }>).payload!;
      return patchBaseState(state, { domain: { ...domain, creativityLevel: level } });
    }

    case 'content:brand-check': {
      return patchBaseState(state, { domain: { ...domain, brandCheckReady: true } });
    }

    case 'content:stem-received': {
      const { payload } = (action as EnginAction<'content:stem-received', { payload: Record<string, unknown> }>).payload!;
      return patchBaseState(state, { domain: { ...domain, stemPayload: payload } });
    }

    default:
      return state;
  }
}

// ─── deriveState ──────────────────────────────────────────────────────────────

function deriveState(state: EnginBaseState): ContentEnginDerivedState {
  const d = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  return {
    lifecycle:       state.lifecycle,
    drafts:          (d.drafts          ?? DEFAULT_DOMAIN.drafts)          as ContentDraft[],
    publishQueue:    (d.publishQueue    ?? DEFAULT_DOMAIN.publishQueue)    as CalendarItem[],
    activePlatforms: (d.activePlatforms ?? DEFAULT_DOMAIN.activePlatforms) as Platform[],
    seoScore:        (d.seoScore        ?? DEFAULT_DOMAIN.seoScore)        as number,
    wordCount:       (d.wordCount       ?? DEFAULT_DOMAIN.wordCount)       as number,
    creativityLevel: (d.creativityLevel ?? DEFAULT_DOMAIN.creativityLevel) as number,
    brandCheckReady: (d.brandCheckReady ?? DEFAULT_DOMAIN.brandCheckReady) as boolean,
    stemPayload:     (d.stemPayload     ?? DEFAULT_DOMAIN.stemPayload)     as any | null,
  };
}

// ─── Rule-set params ──────────────────────────────────────────────────────────

const PARAMS: EnginRuleSetParams = {
  enginId: 'create',
  name: 'ContentEngin',
  layoutMode: 'standard',
  accentColor: '#f97316',
};

const REQUIRED_CAPABILITIES: ReadonlyArray<EnginCapability> = [
  'state:read',
  'state:write',
  'assets:load',
  'assets:upload',
  'bridge:emit',
  'bridge:listen',
];

// ─── Exported rule-set ────────────────────────────────────────────────────────

export const CONTENT_ENGIN_RULE_SET: EnginRuleSetContract<ContentEnginAction> = {
  params: PARAMS,
  requiredCapabilities: REQUIRED_CAPABILITIES,
  constraints: [itemAddConstraint, creativityConstraint],
  transform,
  deriveState,
};