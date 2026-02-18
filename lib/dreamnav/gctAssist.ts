import { GCTEngine, type GCTMatch, type Template } from '@/lib/gct';
import type { Action, Node } from './tau';

export type GestureVector = {
  dx: number;
  dy: number;
  magnitude: number;
};

export type GCTDebug = {
  used: boolean;
  scores: Array<{ id: string; correlation: number }>;
  selectedId?: string;
};

const ACTION_TEMPLATES: Array<{ id: Action; data: Float32Array }> = [
  { id: 'swipe_left', data: new Float32Array([-1, 0, 1]) },
  { id: 'swipe_right', data: new Float32Array([1, 0, 1]) },
  { id: 'swipe_up', data: new Float32Array([0, -1, 1]) },
  { id: 'swipe_down', data: new Float32Array([0, 1, 1]) },
];

let engine: GCTEngine | null = null;
let initPromise: Promise<void> | null = null;

async function getEngine(): Promise<GCTEngine> {
  if (!engine) {
    engine = new GCTEngine({ preferGPU: true, numTemplates: 24 });
    initPromise = engine.init();
  }
  if (initPromise) {
    await initPromise.catch(() => undefined);
    initPromise = null;
  }
  return engine;
}

function deterministicAxisFallback(v: GestureVector): Action {
  if (Math.abs(v.dx) >= Math.abs(v.dy)) {
    return v.dx < 0 ? 'swipe_left' : 'swipe_right';
  }
  return v.dy < 0 ? 'swipe_up' : 'swipe_down';
}

export async function chooseAxisAction(v: GestureVector): Promise<{ action: Action; debug: GCTDebug }> {
  const fallback = deterministicAxisFallback(v);
  const templateInput = new Float32Array([v.dx, v.dy, Math.max(v.magnitude, 1)]);

  try {
    const gct = await getEngine();
    const templates: Template[] = ACTION_TEMPLATES.map((t) => ({ id: t.id, data: t.data }));
    const matches = await gct.search(templateInput, templates, 0.72);
    const sorted = sortMatches(matches);

    if (!sorted[0]) {
      return { action: fallback, debug: { used: false, scores: [] } };
    }

    const winner = sorted[0];
    const confidenceGap = (sorted[0]?.correlation ?? 0) - (sorted[1]?.correlation ?? 0);
    if (winner.correlation < 0.72 || confidenceGap < 0.08) {
      return {
        action: fallback,
        debug: {
          used: false,
          scores: sorted.slice(0, 4).map((m) => ({ id: m.templateId, correlation: Number(m.correlation.toFixed(3)) })),
        },
      };
    }

    return {
      action: winner.templateId as Action,
      debug: {
        used: true,
        selectedId: winner.templateId,
        scores: sorted.slice(0, 4).map((m) => ({ id: m.templateId, correlation: Number(m.correlation.toFixed(3)) })),
      },
    };
  } catch {
    return { action: fallback, debug: { used: false, scores: [] } };
  }
}

function sortMatches(matches: GCTMatch[]): GCTMatch[] {
  return [...matches].sort((a, b) => b.correlation - a.correlation);
}

export type WidgetCandidate = {
  widget_instance_id: string;
  contextVector: Float32Array;
};

export async function chooseWidgetForSlot(
  _node: Node,
  contextVector: Float32Array,
  candidates: WidgetCandidate[]
): Promise<{ widget_instance_id: string | null; debug: GCTDebug }> {
  if (candidates.length === 0) {
    return { widget_instance_id: null, debug: { used: false, scores: [] } };
  }

  try {
    const gct = await getEngine();
    const templates: Template[] = candidates.map((candidate) => ({
      id: candidate.widget_instance_id,
      data: candidate.contextVector,
    }));
    const matches = sortMatches(await gct.search(contextVector, templates, 0.66));

    if (!matches[0]) {
      return {
        widget_instance_id: candidates[0].widget_instance_id,
        debug: { used: false, scores: [] },
      };
    }

    const selected = matches[0];
    return {
      widget_instance_id: selected.templateId,
      debug: {
        used: true,
        selectedId: selected.templateId,
        scores: matches.slice(0, 6).map((m) => ({ id: m.templateId, correlation: Number(m.correlation.toFixed(3)) })),
      },
    };
  } catch {
    return {
      widget_instance_id: candidates[0].widget_instance_id,
      debug: { used: false, scores: [] },
    };
  }
}
