"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function CompactThemeSelector() {
  const {
    currentAccent,
    accents,
    activeAccent,
    isDark,
    isInitialized,
    changeAccent,
    toggleMode,
  } = useTheme();

  if (!isInitialized) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title="Change Theme"
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span
                key="sun"
                initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 p-0 overflow-hidden",
          "rounded-[var(--radius-extra-large-semantic)]",
          "border border-black/[0.06] dark:border-white/[0.08]",
          "bg-surface-primary/95 backdrop-blur-2xl",
          "[box-shadow:var(--shadow-elevation-4)]"
        )}
      >
        {/* ── Header ── */}
        <div className="px-3.5 pt-3.5 pb-3 border-b border-black/5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-[var(--radius-small-semantic)] shrink-0 [box-shadow:var(--shadow-elevation-1)]"
                style={{ background: currentAccent.swatch }}
              />
              <div>
                <p className="text-sm font-semibold tracking-[-0.01em] text-content-primary leading-none mb-0.5">
                  {currentAccent.name}
                </p>
                <p className="text-[10px] uppercase tracking-[0.06em] text-content-tertiary font-medium">
                  {isDark ? "Dark" : "Light"} Mode
                </p>
              </div>
            </div>

            {/* Mode toggle */}
            <button
              onClick={toggleMode}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                "bg-black/[0.05] dark:bg-white/[0.08]",
                "text-content-secondary hover:bg-black/10 dark:hover:bg-white/[0.12]",
                "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              title={isDark ? "Switch to Light" : "Switch to Dark"}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Color grid (6 × 3) ── */}
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-content-tertiary font-medium mb-2 px-0.5">
            Accent Color
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {accents.map((accent) => {
              const isActive = activeAccent === accent.id;
              const useDarkCheck =
                accent.id === "lime" || accent.id === "yellow" || accent.id === "neutral";
              return (
                <button
                  key={accent.id}
                  onClick={() => changeAccent(accent.id)}
                  title={accent.name}
                  className={cn(
                    "relative w-full aspect-square rounded-[var(--radius-small-semantic)]",
                    "transition-all duration-150 focus:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary",
                    isActive
                      ? "scale-105 ring-2 ring-offset-2 ring-offset-surface-primary"
                      : "opacity-70 hover:opacity-100 hover:scale-110"
                  )}
                  style={{
                    background: accent.swatch,
                    ...(isActive
                      ? ({ "--tw-ring-color": accent.swatch } as React.CSSProperties)
                      : {}),
                  }}
                >
                  {isActive && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check
                        strokeWidth={3}
                        style={{
                          width: 10,
                          height: 10,
                          color: useDarkCheck
                            ? "oklch(0.15 0 0)"
                            : "oklch(0.98 0 0)",
                          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
                        }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-3.5 py-2.5 border-t border-black/5 dark:border-white/[0.07]">
          <p className="text-[10px] text-content-tertiary text-center tracking-[0.02em]">
            {accents.length} colors · {isDark ? "Dark" : "Light"} mode
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
