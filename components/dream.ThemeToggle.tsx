'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getInitialDarkMode, toggleDarkMode as toggleDarkModeValue } from '@/lib/ui/theme';
import { emitTeach } from '@/lib/agents/teachBus';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = getInitialDarkMode();
    setDarkMode(isDark);
    // Apply immediately
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = toggleDarkModeValue(darkMode);
    setDarkMode(newMode);

    emitTeach({
      featureId: 'theme',
      title: 'Theme Toggle',
      message: 'This switches between Light and Dark mode. It only changes UI styling on your device, and your preference is saved locally.'
    });
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-slate-200" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
