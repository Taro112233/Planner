// components/ShowcaseComponent/ToggleShowcase.tsx
"use client"

import { Toggle } from "@/components/ui/toggle"
import { Bold, Italic, Underline } from "lucide-react"

export function ToggleShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Toggle</h3>
      <p className="text-sm text-muted-foreground">
        A two-state button that can be either on or off.
      </p>
      
      <div className="space-y-6">
        {/* Default */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default</h4>
          <Toggle aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Outline Variant */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Outline</h4>
          <Toggle variant="outline" aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </Toggle>
        </div>

        {/* With Text */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Text</h4>
          <Toggle aria-label="Toggle underline">
            <Underline className="h-4 w-4 mr-2" />
            Underline
          </Toggle>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sizes</h4>
          <div className="flex items-center gap-4">
            <Toggle size="sm" aria-label="Toggle small">
              <Bold className="h-3 w-3" />
            </Toggle>
            <Toggle size="default" aria-label="Toggle default">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="lg" aria-label="Toggle large">
              <Bold className="h-5 w-5" />
            </Toggle>
          </div>
        </div>

        {/* Disabled */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Disabled</h4>
          <Toggle disabled aria-label="Toggle disabled">
            <Bold className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Pressed State */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default Pressed</h4>
          <Toggle defaultPressed aria-label="Toggle pressed">
            <Bold className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>
  )
}