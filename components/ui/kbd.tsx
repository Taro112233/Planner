// components/ui/kbd.tsx
import { cn } from "@/lib/client/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-surface-secondary text-content-secondary border-border-subtle pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-md border px-1.5 font-mono text-xs font-medium shadow-xs select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-surface-primary/20 [[data-slot=tooltip-content]_&]:text-content-primary dark:[[data-slot=tooltip-content]_&]:bg-surface-primary/10",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
