import { useState, useEffect, useCallback } from "react";

const COLOR_THEMES = [
  { name: "cyan", primary: "187 92% 50%", accent: "166 84% 55%", glow: "rgba(34,211,238,0.4)" },
  { name: "teal", primary: "166 84% 45%", accent: "187 92% 50%", glow: "rgba(20,184,166,0.4)" },
  { name: "emerald", primary: "160 84% 45%", accent: "142 76% 45%", glow: "rgba(16,185,129,0.4)" },
  { name: "blue", primary: "217 91% 60%", accent: "199 89% 48%", glow: "rgba(59,130,246,0.4)" },
  { name: "violet", primary: "263 70% 58%", accent: "280 65% 60%", glow: "rgba(139,92,246,0.4)" },
  { name: "rose", primary: "350 89% 60%", accent: "330 81% 60%", glow: "rgba(244,63,94,0.4)" },
];

const STORAGE_KEY = "DREAMENGIN_COLOR_PREF";
const CYCLE_INTERVAL = 30000; // 30 seconds per color

export function useColorCycle() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [userOverride, setUserOverride] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.userOverride) {
        setUserOverride(parsed.userOverride);
        setIsAutoCycling(false);
        const idx = COLOR_THEMES.findIndex(t => t.name === parsed.userOverride);
        if (idx !== -1) setCurrentIndex(idx);
      }
    }
  }, []);

  const applyTheme = useCallback((theme: typeof COLOR_THEMES[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--sidebar-primary", theme.primary);
    root.style.setProperty("--sidebar-ring", theme.primary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--chart-1", theme.primary);
    root.style.setProperty("--chart-2", theme.accent);
    root.style.setProperty("--glow-cyan", theme.glow);
  }, []);

  useEffect(() => {
    applyTheme(COLOR_THEMES[currentIndex]);
  }, [currentIndex, applyTheme]);

  useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % COLOR_THEMES.length);
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoCycling]);

  const setManualColor = useCallback((colorName: string) => {
    const idx = COLOR_THEMES.findIndex(t => t.name === colorName);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setUserOverride(colorName);
      setIsAutoCycling(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userOverride: colorName }));
    }
  }, []);

  const enableAutoCycle = useCallback(() => {
    setUserOverride(null);
    setIsAutoCycling(true);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentTheme: COLOR_THEMES[currentIndex],
    themes: COLOR_THEMES,
    isAutoCycling,
    setManualColor,
    enableAutoCycle,
  };
}
