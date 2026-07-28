// components/ShowcaseComponent/ButtonGroupShowcase.tsx
"use client"

import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react"

export function ButtonGroupShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Button Group</h3>
      <p className="text-sm text-muted-foreground">
        Groups multiple buttons together as a single unit.
      </p>
      
      <div className="space-y-6">
        {/* Basic */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <ButtonGroup>
            <Button variant="outline">Left</Button>
            <Button variant="outline">Center</Button>
            <Button variant="outline">Right</Button>
          </ButtonGroup>
        </div>

        {/* With Icons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Text Formatting</h4>
          <ButtonGroup>
            <Button variant="outline" size="icon">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Underline className="h-4 w-4" />
            </Button>
          </ButtonGroup>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Alignment Options</h4>
          <ButtonGroup>
            <Button variant="outline" size="icon">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <AlignRight className="h-4 w-4" />
            </Button>
          </ButtonGroup>
        </div>

        {/* With Separator */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Separator</h4>
          <ButtonGroup>
            <Button variant="outline">Save</Button>
            <ButtonGroupSeparator />
            <Button variant="outline" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </ButtonGroup>
        </div>

        {/* Vertical */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical Orientation</h4>
          <ButtonGroup orientation="vertical">
            <Button variant="outline">Top</Button>
            <Button variant="outline">Middle</Button>
            <Button variant="outline">Bottom</Button>
          </ButtonGroup>
        </div>

        {/* Mixed */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Text</h4>
          <ButtonGroup>
            <ButtonGroupText>Price:</ButtonGroupText>
            <Button variant="outline">$10</Button>
            <Button variant="outline">$20</Button>
            <Button variant="outline">$50</Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}