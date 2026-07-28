// components/ui/alert.tsx
"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "relative w-full rounded-2xl border p-4",
    "[&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-surface-secondary border-border-subtle",
          "text-content-primary [&>svg]:text-content-secondary",
        ].join(" "),
        info: [
          "border-[var(--color-alert-info-border)] bg-[var(--color-alert-info-bg)]",
          "text-[var(--color-alert-info-text)] [&>svg]:text-[var(--color-alert-info-icon)]",
        ].join(" "),
        success: [
          "border-[var(--color-alert-success-border)] bg-[var(--color-alert-success-bg)]",
          "text-[var(--color-alert-success-text)] [&>svg]:text-[var(--color-alert-success-icon)]",
        ].join(" "),
        warning: [
          "border-[var(--color-alert-warning-border)] bg-[var(--color-alert-warning-bg)]",
          "text-[var(--color-alert-warning-text)] [&>svg]:text-[var(--color-alert-warning-icon)]",
        ].join(" "),
        destructive: [
          "border-[var(--color-alert-error-border)] bg-[var(--color-alert-error-bg)]",
          "text-[var(--color-alert-error-text)] [&>svg]:text-[var(--color-alert-error-icon)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  destructive: XCircle,
} as const

export interface AlertProps
  extends Omit<HTMLMotionProps<"div">, keyof VariantProps<typeof alertVariants> | "children">,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean
  children?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", showIcon = true, children, ...props }, ref) => {
    const Icon = iconMap[variant || "default"]

    return (
      <motion.div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {showIcon && <Icon className="h-5 w-5" />}
        {children}
      </motion.div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm leading-relaxed opacity-90 [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
