// components/ui/checkbox.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<HTMLMotionProps<"button">, "type"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  error?: boolean
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, error, ...props }, ref) => {
    return (
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        ref={ref}
        disabled={disabled}
        className={cn(
          "peer h-[1.125rem] w-[1.125rem] shrink-0 rounded-[0.3rem] border transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40",
          checked
            ? "bg-interactive-primary text-primary-foreground border-transparent shadow-elevation-1"
            : "bg-surface-primary border-border-primary hover:border-border-primary/70",
          error ? "border-destructive" : "",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        {...props}
      >
        <motion.div
          initial={false}
          animate={{
            scale: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="flex items-center justify-center"
        >
          <Check className="h-3 w-3" />
        </motion.div>
      </motion.button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }