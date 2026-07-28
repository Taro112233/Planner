// components/ShowcaseComponent/CollapsibleShowcase.tsx
"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"

export function CollapsibleShowcase() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isOpen2, setIsOpen2] = React.useState(true)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Collapsible</h3>
      <p className="text-sm text-muted-foreground">
        An interactive component which expands/collapses a panel.
      </p>
      
      <div className="space-y-6">
        {/* Basic Collapsible */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full max-w-md space-y-2"
          >
            <div className="flex items-center justify-between space-x-4 px-4">
              <h4 className="text-sm font-semibold">
                @peduarte starred 3 repositories
              </h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
              @radix-ui/primitives
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                @radix-ui/colors
              </div>
              <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                @stitches/react
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Default Open */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default Open</h4>
          <Collapsible
            open={isOpen2}
            onOpenChange={setIsOpen2}
            className="w-full max-w-md space-y-2"
          >
            <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
              <h4 className="text-sm font-semibold">Project Settings</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Project Name</span>
                  <span className="text-sm text-muted-foreground">My Project</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Environment</span>
                  <span className="text-sm text-muted-foreground">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Region</span>
                  <span className="text-sm text-muted-foreground">US East</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}