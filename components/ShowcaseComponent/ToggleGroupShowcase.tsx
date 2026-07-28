// components/ShowcaseComponent/ToggleGroupShowcase.tsx
"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"

export function ToggleGroupShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Toggle Group</h3>
      <p className="text-sm text-muted-foreground">
        A set of two-state buttons that can be toggled on or off.
      </p>
      
      <div className="space-y-6">
        {/* Single Selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Single Selection</h4>
          <ToggleGroup type="single" defaultValue="center">
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="justify" aria-label="Justify">
              <AlignJustify className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Multiple Selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Selection</h4>
          <ToggleGroup type="multiple">
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Outline Variant */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Outline Variant</h4>
          <ToggleGroup type="single" variant="outline" defaultValue="left">
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sizes</h4>
          <div className="space-y-4">
            <ToggleGroup type="single" size="sm">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" size="default">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" size="lg">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold className="h-5 w-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic className="h-5 w-5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Disabled */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Disabled Item</h4>
          <ToggleGroup type="single">
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic" disabled>
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}