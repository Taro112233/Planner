// lib/theme-manager.ts
"use client";

export type AccentId =
  | "neutral"
  | "amber"
  | "blue"
  | "cyan"
  | "emerald"
  | "fuchsia"
  | "green"
  | "indigo"
  | "lime"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "rose"
  | "sky"
  | "teal"
  | "violet"
  | "yellow";

export type ThemeMode = "light" | "dark";

export interface AccentColor {
  id: AccentId;
  name: string;
  /** Swatch color shown in the picker (bright, works on both dark/light backgrounds) */
  swatch: string;
}

// 18 accent colors — OKLCH values tuned for legibility in both modes
export const ACCENT_COLORS: AccentColor[] = [
  { id: "neutral", name: "Neutral", swatch: "oklch(0.60 0 0)" },
  { id: "amber",   name: "Amber",   swatch: "oklch(0.72 0.18 65)" },
  { id: "blue",    name: "Blue",    swatch: "oklch(0.60 0.20 250)" },
  { id: "cyan",    name: "Cyan",    swatch: "oklch(0.68 0.16 200)" },
  { id: "emerald", name: "Emerald", swatch: "oklch(0.65 0.17 160)" },
  { id: "fuchsia", name: "Fuchsia", swatch: "oklch(0.65 0.24 300)" },
  { id: "green",   name: "Green",   swatch: "oklch(0.65 0.18 145)" },
  { id: "indigo",  name: "Indigo",  swatch: "oklch(0.58 0.22 270)" },
  { id: "lime",    name: "Lime",    swatch: "oklch(0.74 0.20 125)" },
  { id: "orange",  name: "Orange",  swatch: "oklch(0.70 0.20 50)" },
  { id: "pink",    name: "Pink",    swatch: "oklch(0.68 0.22 350)" },
  { id: "purple",  name: "Purple",  swatch: "oklch(0.60 0.22 290)" },
  { id: "red",     name: "Red",     swatch: "oklch(0.58 0.24 25)" },
  { id: "rose",    name: "Rose",    swatch: "oklch(0.65 0.22 10)" },
  { id: "sky",     name: "Sky",     swatch: "oklch(0.68 0.17 220)" },
  { id: "teal",    name: "Teal",    swatch: "oklch(0.65 0.16 185)" },
  { id: "violet",  name: "Violet",  swatch: "oklch(0.60 0.24 280)" },
  { id: "yellow",  name: "Yellow",  swatch: "oklch(0.78 0.20 95)" },
];

export function applyTheme(accentId: AccentId, mode: ThemeMode): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  // Tailwind dark: prefix requires .dark on <html>
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // data-accent  → drives [data-accent="..."] CSS blocks (brand/interactive tokens)
  // data-theme   → drives [data-theme="dark"] / [data-theme="light"] surface blocks
  root.setAttribute("data-accent", accentId);
  root.setAttribute("data-theme", mode);

  // Persist
  localStorage.setItem("nextjs-starter-accent", accentId);
  localStorage.setItem("nextjs-starter-mode", mode);

  // Smooth transition on color props only — skip layout
  root.style.transition =
    "background-color 0.30s cubic-bezier(0.4,0,0.2,1), color 0.30s cubic-bezier(0.4,0,0.2,1), border-color 0.30s cubic-bezier(0.4,0,0.2,1)";
  const t = setTimeout(() => {
    root.style.transition = "";
    clearTimeout(t);
  }, 350);
}

export function getInitialTheme(): { accent: AccentId; mode: ThemeMode } {
  if (typeof window === "undefined") {
    return { accent: "amber", mode: "dark" };
  }

  const savedAccent = localStorage.getItem("nextjs-starter-accent") as AccentId;
  const validAccent = ACCENT_COLORS.find((a) => a.id === savedAccent)
    ? savedAccent
    : "amber";

  const savedMode = localStorage.getItem("nextjs-starter-mode") as ThemeMode;
  const mode: ThemeMode =
    savedMode === "light" || savedMode === "dark" ? savedMode : "dark";

  return { accent: validAccent, mode };
}
