export function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem('darkMode')
  if (stored === 'true') return true
  if (stored === 'false') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function setDarkMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('darkMode', String(enabled))
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function toggleDarkMode(current: boolean): boolean {
  const next = !current
  setDarkMode(next)
  return next
}