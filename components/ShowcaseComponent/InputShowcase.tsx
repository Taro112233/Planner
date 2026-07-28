// components/ShowcaseComponent/InputShowcase.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Input</h3>
      <p className="text-sm text-muted-foreground">
        Displays a form input field or a component that looks like an input field.
      </p>
      
      <div className="grid gap-6 max-w-md">
        {/* Default Input */}
        <div className="space-y-2">
          <Label htmlFor="default">Default</Label>
          <Input id="default" placeholder="Enter text..." />
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>

        {/* Number Input */}
        <div className="space-y-2">
          <Label htmlFor="number">Number</Label>
          <Input id="number" type="number" placeholder="0" />
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <Input id="file" type="file" />
        </div>

        {/* Disabled Input */}
        <div className="space-y-2">
          <Label htmlFor="disabled">Disabled</Label>
          <Input id="disabled" placeholder="Disabled input" disabled />
        </div>

        {/* Error Input */}
        <div className="space-y-2">
          <Label htmlFor="error" className="text-red-500">With Error</Label>
          <Input id="error" error placeholder="Error state" />
          <p className="text-xs text-red-500">This field is required.</p>
        </div>

        {/* With Default Value */}
        <div className="space-y-2">
          <Label htmlFor="prefilled">Pre-filled</Label>
          <Input id="prefilled" defaultValue="Default value" />
        </div>
      </div>
    </div>
  )
}