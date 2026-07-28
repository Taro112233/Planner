// components/ui/sonner.tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import * as React from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      position="top-right"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        "--normal-bg": "var(--color-surface-secondary)",
        "--normal-text": "var(--color-content-primary)",
        "--normal-border": "var(--color-border-primary)",
      } as React.CSSProperties}
      icons={{
        success: <CheckCircle className="h-5 w-5 text-[var(--color-alert-success-icon)]" />,
        error: <XCircle className="h-5 w-5 text-[var(--color-alert-error-icon)]" />,
        warning: <AlertCircle className="h-5 w-5 text-[var(--color-alert-warning-icon)]" />,
        info: <Info className="h-5 w-5 text-[var(--color-alert-info-icon)]" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group !rounded-2xl !border !p-4 !shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] !backdrop-blur-xl !bg-[var(--color-surface-primary)]/90",
          success:
            "!bg-[var(--color-alert-success-bg)]/90 !text-[var(--color-alert-success-text)] !border-[var(--color-alert-success-border)] !backdrop-blur-xl",
          error:
            "!bg-[var(--color-alert-error-bg)]/90 !text-[var(--color-alert-error-text)] !border-[var(--color-alert-error-border)] !backdrop-blur-xl",
          warning:
            "!bg-[var(--color-alert-warning-bg)]/90 !text-[var(--color-alert-warning-text)] !border-[var(--color-alert-warning-border)] !backdrop-blur-xl",
          info:
            "!bg-[var(--color-alert-info-bg)]/90 !text-[var(--color-alert-info-text)] !border-[var(--color-alert-info-border)] !backdrop-blur-xl",
          description: "!text-current !opacity-80",
          actionButton: "!rounded-xl group-data-[type=success]:!bg-[var(--color-alert-success-icon)]",
          closeButton: "!rounded-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
