// components/ui/tabs.tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Pill/capsule track — fully rounded, muted background, compact padding
        "bg-muted text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-full p-1 gap-0.5",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Capsule active indicator — rounded-full pill, smooth transition
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-1",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-200 ease-in-out",
        // Active state: solid white/background pill with shadow
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        // Dark mode active
        "dark:data-[state=active]:bg-background/80 dark:data-[state=active]:text-foreground",
        // Inactive state
        "text-muted-foreground hover:text-foreground",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-40",
        // SVG icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Subtle scale on press
        "active:scale-[0.97]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
