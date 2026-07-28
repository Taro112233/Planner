// components/ShowcaseComponent/PopoverShowcase.tsx
"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PopoverShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Popover</h3>
      <p className="text-sm text-muted-foreground">
        Displays rich content in a portal, triggered by a button.
      </p>
      
      <div className="flex flex-wrap gap-4">
        {/* Basic Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dimensions</h4>
                <p className="text-sm text-muted-foreground">
                  Set the dimensions for the layer.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    defaultValue="100%"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth">Max. width</Label>
                  <Input
                    id="maxWidth"
                    defaultValue="300px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    defaultValue="25px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight">Max. height</Label>
                  <Input
                    id="maxHeight"
                    defaultValue="none"
                    className="col-span-2 h-8"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Simple Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Info</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-sm">
              This is a simple popover with some informational text.
            </p>
          </PopoverContent>
        </Popover>

        {/* Popover with Actions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button>With Actions</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Delete Item?</h4>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">Cancel</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}