// components/ui/skeleton.tsx
"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/client/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
  animation?: "pulse" | "wave" | "none"
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = "rectangular",
      width,
      height,
      animation = "pulse",
      ...props
    },
    ref
  ) => {
    const baseClasses = "bg-surface-secondary relative overflow-hidden"

    const variantClasses = {
      text: "rounded-lg",
      circular: "rounded-full",
      rectangular: "rounded-xl",
    }

    const animationComponent = () => {
      if (animation === "wave") {
        return (
          <motion.div
            className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent"
            animate={{
              translateX: ["100%", "200%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "linear",
            }}
          />
        )
      }
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          animation === "pulse" && "animate-pulse",
          className
        )}
        style={{
          width: width || "100%",
          height: height || (variant === "text" ? "1em" : "20px"),
        }}
        {...props}
      >
        {animation === "wave" && animationComponent()}
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

// Composite skeleton components
export const SkeletonText = ({ lines = 3, ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="space-y-2.5" {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  )
}

export const SkeletonAvatar = ({ size = 40, ...props }: { size?: number } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      {...props}
    />
  )
}

export const SkeletonCard = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="space-y-4 p-5 border border-border-subtle rounded-2xl bg-surface-primary" {...props}>
      <div className="flex items-center space-x-4">
        <SkeletonAvatar />
        <div className="space-y-2.5 flex-1">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={200} />
      <SkeletonText lines={2} />
    </div>
  )
}

export { Skeleton }
