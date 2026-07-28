// components/ShowcaseComponent/BadgeShowcase.tsx
"use client"

import { Badge } from "@/components/ui/badge"

export function BadgeShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Badge</h3>
      <p className="text-sm text-muted-foreground">
        Displays a badge or a component that looks like a badge.
      </p>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        {/* Status Badges */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Status Badges</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>

        {/* Use Cases */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Common Use Cases</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">v1.0.0</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="info">New</Badge>
            <Badge variant="outline">Draft</Badge>
            <Badge variant="destructive">Expired</Badge>
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Text</h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Status:</span>
            <Badge variant="success">Online</Badge>
            <span className="ml-4 text-sm">Priority:</span>
            <Badge variant="destructive">High</Badge>
            <span className="ml-4 text-sm">Type:</span>
            <Badge variant="outline">Feature</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}