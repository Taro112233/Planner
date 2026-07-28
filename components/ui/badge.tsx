// components/ui/badge.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Apple pill badges: full radius, medium weight, tight tracking, no heavy border
  "inline-flex items-center rounded-[var(--radius-full-semantic)] border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary",
        secondary:
          "border-black/10 dark:border-white/10 bg-surface-secondary text-content-secondary hover:bg-surface-interactive",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground hover:bg-destructive",
        outline:
          "border-black/10 dark:border-white/10 text-content-primary",
        success:
          "border-[var(--color-alert-success-border)] bg-[var(--color-alert-success-bg)] text-[var(--color-alert-success-text)] hover:opacity-80",
        warning:
          "border-[var(--color-alert-warning-border)] bg-[var(--color-alert-warning-bg)] text-[var(--color-alert-warning-text)] hover:opacity-80",
        error:
          "border-[var(--color-alert-error-border)] bg-[var(--color-alert-error-bg)] text-[var(--color-alert-error-text)] hover:opacity-80",
        info:
          "border-[var(--color-alert-info-border)] bg-[var(--color-alert-info-bg)] text-[var(--color-alert-info-text)] hover:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends Omit<HTMLMotionProps<"div">, keyof VariantProps<typeof badgeVariants> | "children">,
    VariantProps<typeof badgeVariants> {
  children?: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }