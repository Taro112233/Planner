// components/ui/avatar.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/client/utils"
import Image from "next/image"

export interface AvatarProps extends HTMLMotionProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl"
  status?: "online" | "offline" | "away" | "busy"
  children?: React.ReactNode
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", status, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    }

    const statusSizeClasses = {
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
      xl: "h-4 w-4",
    }

    const statusColorClasses = {
      online: "bg-green-500",
      offline: "bg-content-secondary/40",
      away: "bg-yellow-500",
      busy: "bg-red-500",
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full",
          "ring-2 ring-border-subtle",
          "transition-all duration-200",
          sizeClasses[size],
          className
        )}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {props.children}
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full",
              "ring-2 ring-surface-primary",
              statusSizeClasses[size],
              statusColorClasses[status]
            )}
          />
        )}
      </motion.div>
    )
  }
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof Image>,
  React.ComponentPropsWithoutRef<typeof Image>
>(({ className, alt = "", src, ...props }, ref) => {
  if (!src) return null;

  return (
    <Image
      ref={ref}
      className={cn("absolute inset-0 z-10 h-full w-full object-cover", className)}
      alt={alt}
      src={src}
      width={96}
      height={96}
      {...props}
    />
  );
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 flex h-full w-full items-center justify-center rounded-full",
      "bg-surface-secondary text-content-secondary",
      "text-xs font-medium tracking-wide",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
