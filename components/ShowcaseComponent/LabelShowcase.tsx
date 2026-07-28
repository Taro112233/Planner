// components/ShowcaseComponent/LabelShowcase.tsx
"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export function LabelShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Label</h3>
      <p className="text-sm text-muted-foreground">
        Renders an accessible label associated with controls.
      </p>
      
      <div className="space-y-6 max-w-md">
        {/* Basic Label */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
        </div>

        {/* Required Label */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Required</h4>
          <div className="grid gap-2">
            <Label htmlFor="email" required>Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
        </div>

        {/* Error Label */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Error</h4>
          <div className="grid gap-2">
            <Label htmlFor="password" error required>Password</Label>
            <Input id="password" type="password" error placeholder="Enter password" />
            <p className="text-xs text-red-500">Password is required</p>
          </div>
        </div>

        {/* With Checkbox */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Checkbox</h4>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </div>

        {/* Disabled State */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Disabled</h4>
          <div className="grid gap-2">
            <Label htmlFor="disabled" className="opacity-50">Disabled Field</Label>
            <Input id="disabled" disabled placeholder="Disabled input" />
          </div>
        </div>
      </div>
    </div>
  )
}