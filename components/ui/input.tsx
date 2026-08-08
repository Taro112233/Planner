// components/ui/input.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/client/utils"

export interface InputProps extends Omit<HTMLMotionProps<"input">, "size"> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <motion.input
        type={type}
        className={cn(
          // Apple form field: generous height, smooth radius, translucent bg,
          // hairline border, crisp focus ring that replaces the border (not stacks on it)
          "flex h-10 w-full rounded-[var(--radius-medium-semantic)] border bg-surface-secondary/60 px-3.5 py-2 text-sm text-content-primary tracking-[-0.01em] transition-all duration-200 ease-out",
          "placeholder:text-content-tertiary",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
          "focus-visible:bg-surface-primary",
          "disabled:cursor-not-allowed disabled:opacity-40",
          error
            ? "border-alert-error-border/70 focus-visible:ring-alert-error-border"
            : "border-black/10 dark:border-white/10 focus-visible:ring-interactive-primary focus-visible:border-transparent",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }