export const Theme = {
  applyStored() {
    if (typeof window === 'undefined') return;
    const pref = localStorage.getItem('theme-mode');
    const initial = pref ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', initial === 'dark');
  },
  toggle() {
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
  }
};
