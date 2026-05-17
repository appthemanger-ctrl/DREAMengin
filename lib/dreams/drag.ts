export type DreamRuntime = 'HOME' | 'FACE';
export type DreamSurfaceName = 'home' | 'dreamspace';

export interface DreamDragData {
  dream_id: string;
  type: string;
  surface: DreamSurfaceName;
  runtime: DreamRuntime;
  title?: string;
  state?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export const DREAM_DRAG_MIME = 'application/x-dreamengin-dream';

export function serializeDreamDragData(data: DreamDragData: string {
  return JSON.stringify(data);
}

export function parseDreamDragData(raw: string | null | undefined: DreamDragData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DreamDragData>;
    if (!parsed || typeof parsed.dream_id !== 'string' || typeof parsed.type !== 'string') {
      return null;
    }
    return {
      dream_id: parsed.dream_id,
      type: parsed.type,
      surface: parsed.surface === 'dreamspace' ? 'dreamspace' : 'home',
      runtime: parsed.runtime === 'FACE' ? 'FACE' : 'HOME',
      title: typeof parsed.title === 'string' ? parsed.title : undefined,
      state: parsed.state && typeof parsed.state === 'object' ? parsed.state as Record<string, unknown> : undefined,
      position: parsed.position,
    };
  } catch {
    return null;
  }
}

export async function transferDream(
  dreamData: DreamDragData,
  fromRuntime: DreamRuntime,
  toRuntime: DreamRuntime,
  position?: { x: number; y: number },
) {
  const response = await fetch('/api/dreams/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dreamData, fromRuntime, toRuntime, position }),
  });
  if (!response.ok) {
    throw new Error(`Dream transfer failed: ${response.status}`);
  }
  const payload = await response.json();
  window.dispatchEvent(new CustomEvent('dream:transfer', {
    detail: { dreamData, fromRuntime, toRuntime, position, payload },
  }));
  return payload;
}

export function surfaceForRuntime(runtime: DreamRuntime: DreamSurfaceName {
  return runtime === 'HOME' ? 'home' : 'dreamspace';
}
