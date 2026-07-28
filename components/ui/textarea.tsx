// components/ui/textarea.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends Omit<HTMLMotionProps<"textarea">, "size"> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <motion.textarea
        className={cn(
          // Mirrors Input: same radius, same border opacity, same focus ring behaviour
          "flex min-h-[80px] w-full rounded-[var(--radius-medium-semantic)] border bg-surface-secondary/60 px-3.5 py-2.5 text-sm text-content-primary tracking-[-0.01em] leading-relaxed transition-all duration-200 ease-out",
          "placeholder:text-content-tertiary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
          "focus-visible:bg-surface-primary",
          "disabled:cursor-not-allowed disabled:opacity-40 resize-none",
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
Textarea.displayName = "Textarea"

export { Textarea }