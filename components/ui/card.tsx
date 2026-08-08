// components/ui/card.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/client/utils"

export interface CardProps extends HTMLMotionProps<"div"> {
  gradient?: boolean
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, gradient, hoverable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // Apple card: generous radius, hairline border at 5% opacity,
          // multi-layer soft shadow — no harsh outlines
          "rounded-[var(--radius-large-semantic)] border border-black/5 dark:border-white/[0.07] bg-card text-card-foreground [box-shadow:var(--shadow-elevation-2)]",
          gradient && "gradient-brand-semantic",
          className
        )}
        // hoverable: subtle lift — Apple lifts by 2px with shadow deepening, no scale
        whileHover={hoverable ? { y: -2, boxShadow: "var(--shadow-elevation-3)" } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Slightly more generous top padding for airy Apple feel
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      // Apple: semibold + tight tracking on card headings
      className={cn("font-semibold leading-snug tracking-[-0.02em] text-content-primary", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-content-secondary leading-relaxed", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Hairline separator between content and footer
      className={cn("flex items-center p-6 pt-4 border-t border-black/5 dark:border-white/[0.07]", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }