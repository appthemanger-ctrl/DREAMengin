/**
 * generativeFill – calls the /api/content/generative-fill endpoint.
 *
 * Handles image/video frame generative fill requests with optional
 * mask coordinates and prompt text.
 */

export interface GenerativeFillRequest {
  /** Base64-encoded image or frame */
  imageBase64: string;
  /** Natural-language description of the fill */
  prompt: string;
  /** Optional mask region (0-1 fractions of image dimensions) */
  mask?: { x: number; y: number; width: number; height: number };
  /** Request quality: 'fast' (default) or 'hd' */
  quality?: 'fast' | 'hd';
}

export interface GenerativeFillResult {
  /** Base64-encoded result image */
  resultBase64: string;
  /** Human-readable status message */
  message: string;
  /** Provider used (e.g. 'replicate', 'stability', 'mock') */
  provider: string;
}

export async function requestGenerativeFill(
  req: GenerativeFillRequest
): Promise<GenerativeFillResult> {
  const res = await fetch('/api/content/generative-fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Generative fill failed (${res.status})`);
  }

  return res.json() as Promise<GenerativeFillResult>;
}

/** Convert a File to a base64 data URL (browser only). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/...;base64," prefix
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
