export const Theme = {
  applyStored() {
    try {
      const mode = localStorage.getItem('theme') || 'dark'
      document.documentElement.classList.toggle('dark', mode === 'dark')
    } catch {}
  },
  toggle() {
    try {
      const isDark = document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {}
  }
}
