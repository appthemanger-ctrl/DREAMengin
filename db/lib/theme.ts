
export const Theme = {
  toggle(){
    const r = document.documentElement
    const a = getComputedStyle(r).getPropertyValue('--color-1') || '#f97316'
    const b = getComputedStyle(r).getPropertyValue('--color-2') || '#0ea5e9'
    r.style.setProperty('--color-1', b.trim())
    r.style.setProperty('--color-2', a.trim())
    localStorage.setItem('accent', JSON.stringify({a:b,b:a}))
  },
  applyStored(){
    try {
      const s = localStorage.getItem('accent'); if (!s) return
      const {a,b} = JSON.parse(s); const r = document.documentElement
      r.style.setProperty('--color-1', a); r.style.setProperty('--color-2', b)
    } catch {}
  }
}
