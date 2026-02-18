// Client-side: stores whether Dr. Eams "full experience" (guided coaching + UI actions) is enabled.

export const DREAMS_MODE_STORAGE_KEY = 'drEamsFullExperience'
export const DREAMS_MODE_EVENT = 'drEams:mode'

export function getDrEamsMode(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(DREAMS_MODE_STORAGE_KEY)
  // Default: ON (first-run). Users can toggle OFF.
  return raw !== 'false'
}

export function setDrEamsMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DREAMS_MODE_STORAGE_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent(DREAMS_MODE_EVENT, { detail: { enabled } }))
}

export function onDrEamsModeChange(handler: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const listener = (e: Event) => {
    const ce = e as CustomEvent
    handler(Boolean(ce.detail?.enabled))
  }

  window.addEventListener(DREAMS_MODE_EVENT, listener as any)
  return () => window.removeEventListener(DREAMS_MODE_EVENT, listener as any)
}
