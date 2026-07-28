// components/ui/label.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  error?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, error, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none tracking-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          error && "text-destructive",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Label }