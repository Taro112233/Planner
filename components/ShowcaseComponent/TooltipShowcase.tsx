// components/ShowcaseComponent/TooltipShowcase.tsx
"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Plus, Settings, HelpCircle } from "lucide-react"

export function TooltipShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tooltip</h3>
      <p className="text-sm text-muted-foreground">
        A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
      </p>
      
      <div className="space-y-6">
        {/* Default Tooltip */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default</h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Positions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Positions</h4>
          <div className="flex flex-wrap gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Top</Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Tooltip on top</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Bottom</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip on bottom</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Left</Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Tooltip on left</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Right</Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Tooltip on right</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Icon Buttons</h4>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new item</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get help</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Inline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Inline Text</h4>
          <p className="text-sm text-muted-foreground">
            This feature is currently in{" "}
            <Tooltip>
              <TooltipTrigger className="underline decoration-dotted cursor-help">
                beta
              </TooltipTrigger>
              <TooltipContent>
                <p>Beta features may change without notice</p>
              </TooltipContent>
            </Tooltip>
            . Please provide feedback if you encounter any issues.
          </p>
        </div>
      </div>
    </div>
  )
}