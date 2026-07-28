// components/ShowcaseComponent/SliderShowcase.tsx
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export function SliderShowcase() {
  const [value, setValue] = React.useState([50])
  const [rangeValue, setRangeValue] = React.useState([25, 75])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Slider</h3>
      <p className="text-sm text-muted-foreground">
        An input where the user selects a value from within a given range.
      </p>
      
      <div className="space-y-8 max-w-md">
        {/* Default Slider */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Default</Label>
            <span className="text-sm text-muted-foreground">{value}%</span>
          </div>
          <Slider
            value={value}
            onValueChange={setValue}
            max={100}
            step={1}
          />
        </div>

        {/* Range Slider */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Range</Label>
            <span className="text-sm text-muted-foreground">
              {rangeValue[0]} - {rangeValue[1]}
            </span>
          </div>
          <Slider
            value={rangeValue}
            onValueChange={setRangeValue}
            max={100}
            step={1}
          />
        </div>

        {/* With Steps */}
        <div className="space-y-4">
          <Label>With Steps (10)</Label>
          <Slider defaultValue={[30]} max={100} step={10} />
        </div>

        {/* Disabled */}
        <div className="space-y-4">
          <Label className="text-muted-foreground">Disabled</Label>
          <Slider defaultValue={[40]} max={100} disabled />
        </div>

        {/* Small Range */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-muted-foreground">50%</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>

        {/* Vertical Slider */}
        <div className="space-y-4">
          <Label>Vertical</Label>
          <div className="h-[150px]">
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              orientation="vertical"
            />
          </div>
        </div>
      </div>
    </div>
  )
}