// components/ui/progress.tsx
"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/client/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  showLabel?: boolean
  variant?: "default" | "success" | "warning" | "error"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const getVariantColor = () => {
      switch (variant) {
        case "success":
          return "bg-green-500"
        case "warning":
          return "bg-yellow-500"
        case "error":
          return "bg-red-500"
        default:
          return "bg-primary"
      }
    }

    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-content-secondary font-medium">Progress</span>
            <span className="text-content-secondary tabular-nums">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-surface-secondary",
            className
          )}
          {...props}
        >
          <motion.div
            className={cn("h-full rounded-full", getVariantColor())}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
