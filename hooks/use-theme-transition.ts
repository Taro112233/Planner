// hooks/use-theme-transition.ts
'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';

export function useThemeTransition() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // ✅ Check if View Transition API is supported
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // ✅ Use View Transition API for ultra-smooth effect
    document.startViewTransition(() => {
      setTheme(newTheme);
    });
  }, [theme, setTheme]);

  return { theme, toggleTheme };
}