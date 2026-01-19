import React, { useEffect, useMemo, useState } from "react";

type Theme = { name: string; primary: string; accent: string; glow: string };

const THEMES: Theme[] = [
  { name: "cyan", primary: "187 92% 50%", accent: "166 84% 55%", glow: "rgba(34,211,238,0.35)" },
  { name: "teal", primary: "166 84% 45%", accent: "187 92% 50%", glow: "rgba(20,184,166,0.35)" },
  { name: "emerald", primary: "160 84% 45%", accent: "142 76% 45%", glow: "rgba(16,185,129,0.35)" },
  { name: "blue", primary: "217 91% 60%", accent: "199 89% 48%", glow: "rgba(59,130,246,0.35)" },
];

const STORAGE_KEY = "DREAMENGIN_COLOR_PREF";
const CYCLE_INTERVAL_MS = 30_000;

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--glow", theme.glow);
}

export function ColorCycleProvider({ children }: { children: React.ReactNode }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = THEMES.findIndex((t) => t.name === saved);
      if (found >= 0) setIdx(found);
    }
  }, []);

  const theme = useMemo(() => THEMES[idx % THEMES.length], [idx]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme.name);
  }, [theme]);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((n) => (n + 1) % THEMES.length), CYCLE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, []);

  return <>{children}</>;
}
