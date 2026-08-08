// components/ui/switch.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/client/utils"

export interface SwitchProps extends Omit<HTMLMotionProps<"button">, "type"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        disabled={disabled}
        className={cn(
          // iOS-style: larger track (h-7 w-12), fully rounded, no border seam
          "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-inner",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-40",
          // Active tap feedback on the track itself
          "active:brightness-95",
          checked ? "bg-primary" : "bg-input",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        whileTap={{ scale: 0.96 }}
        {...props}
      >
        <motion.span
          className={cn(
            // Thumb: pure white, fully rounded, elevated shadow like iOS
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.15)] ring-0"
          )}
          animate={{
            x: checked ? 20 : 2,
          }}
          transition={{ type: "spring", stiffness: 600, damping: 32, mass: 0.7 }}
        />
      </motion.button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
