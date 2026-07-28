// components/ui/button.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: SF Pro–inspired — medium weight, tight tracking, smooth radius, precise transitions
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-medium-semantic)] text-sm font-medium tracking-[-0.01em] ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Solid filled — inner highlight gives Apple's "filled button" depth
        default:
          "bg-primary text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:brightness-110",
        destructive:
          "bg-destructive text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:brightness-110",
        // Outline — hairline border at 5–10% opacity, no harsh grey line
        outline:
          "border border-black/10 dark:border-white/10 bg-surface-primary text-content-primary [box-shadow:var(--shadow-elevation-1)] hover:bg-surface-interactive hover:border-black/15 dark:hover:border-white/15",
        // Secondary — muted tinted surface
        secondary:
          "bg-surface-secondary text-content-primary [box-shadow:var(--shadow-elevation-1)] hover:bg-surface-interactive",
        // Ghost — no chrome until hover
        ghost:
          "text-content-primary hover:bg-surface-interactive transition-colors",
        // Link — underline only
        link:
          "text-interactive-primary underline-offset-4 hover:opacity-75 transition-opacity",
        // Primary — uses interactive token, same treatment as default
        primary:
          "bg-interactive-primary text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:bg-interactive-primary-hover",
        success:
          "bg-alert-success-icon text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:brightness-110",
        warning:
          "bg-alert-warning-icon text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:brightness-110",
        danger:
          "bg-alert-error-icon text-white [box-shadow:var(--shadow-elevation-1),inset_0_1px_0_oklch(1_0_0/0.08)] hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-7 rounded-[var(--radius-small-semantic)] px-3 text-xs",
        lg:      "h-11 rounded-[var(--radius-large-semantic)] px-6 text-[0.9375rem]",
        icon:    "h-9 w-9",
        "icon-xs": "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, keyof VariantProps<typeof buttonVariants> | "children">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, asChild, ...props }, ref) => {
    void asChild
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {loading && (
          <motion.svg
            className="mr-2 h-4 w-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </motion.svg>
        )}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }