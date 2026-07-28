// hooks/useTheme.ts
"use client";

import { useState, useEffect } from "react";
import {
  applyTheme,
  getInitialTheme,
  ACCENT_COLORS,
  type AccentId,
  type ThemeMode,
  type AccentColor,
} from "@/lib/theme-manager";

export function useTheme() {
  const [activeAccent, setActiveAccent] = useState<AccentId>("amber");
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { accent, mode: initialMode } = getInitialTheme();
    setActiveAccent(accent);
    setMode(initialMode);
    setIsInitialized(true);
    applyTheme(accent, initialMode);
  }, []);

  const changeAccent = (accentId: AccentId) => {
    setActiveAccent(accentId);
    applyTheme(accentId, mode);
  };

  const toggleMode = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    applyTheme(activeAccent, newMode);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    applyTheme(activeAccent, newMode);
  };

  const currentAccent: AccentColor =
    ACCENT_COLORS.find((a) => a.id === activeAccent) ?? ACCENT_COLORS[1];

  return {
    activeAccent,
    mode,
    isDark: mode === "dark",
    isInitialized,
    currentAccent,
    accents: ACCENT_COLORS,
    changeAccent,
    toggleMode,
    setThemeMode,
  };
}
