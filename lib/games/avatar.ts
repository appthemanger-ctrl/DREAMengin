/**
 * Avatar storage helpers — stores the user's avatar image (data URL) in
 * localStorage so it persists across navigation without a server round-trip.
 *
 * The image is resized to 256×256 before storage to keep the payload small.
 */

export const AVATAR_IMAGE_KEY   = 'de:avatar:image';
export const AVATAR_CREATED_KEY = 'de:avatar:created';
export const AVATAR_PLAY_AS_ME_KEY = 'de:avatar:play-as-me';

/** Return the stored avatar data URL, or null if none exists. */
export function getAvatarDataUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AVATAR_IMAGE_KEY);
}

/** Persist a data URL as the active avatar. */
export function setAvatarDataUrl(dataUrl: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AVATAR_IMAGE_KEY, dataUrl);
  window.localStorage.setItem(AVATAR_CREATED_KEY, new Date().toISOString());
}

/** True when the user has created an avatar. */
export function hasAvatar(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem(AVATAR_CREATED_KEY);
}

/** Remove the stored avatar entirely. */
export function clearAvatar(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AVATAR_IMAGE_KEY);
  window.localStorage.removeItem(AVATAR_CREATED_KEY);
}

/**
 * Resize an image File to a square canvas at `size × size` pixels and return
 * the result as a PNG data URL.  Runs entirely in the browser.
 */
export function resizeImageToDataUrl(
  file: File,
  size = 256,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas 2d unavailable')); return; }

      // Centre-crop to a square before scaling
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx   = (img.naturalWidth  - side) / 2;
      const sy   = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

/** Flag that the next game launch should show the avatar overlay. */
export function setPlayAsMe(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AVATAR_PLAY_AS_ME_KEY, '1');
}

/** Consume (read + clear) the play-as-me flag. */
export function consumePlayAsMe(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = window.localStorage.getItem(AVATAR_PLAY_AS_ME_KEY) === '1';
  if (flag) window.localStorage.removeItem(AVATAR_PLAY_AS_ME_KEY);
  return flag;
}
