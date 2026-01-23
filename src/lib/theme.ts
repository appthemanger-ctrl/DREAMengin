'use client'
export const Theme = {
  toggle() {
    const el = document.documentElement
    const isDark = el.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  },
  applyStored() {
    const t = localStorage.getItem('theme')
    if (t === 'dark') document.documentElement.classList.add('dark')
  }
}
