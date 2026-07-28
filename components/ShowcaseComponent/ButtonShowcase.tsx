// components/ShowcaseComponent/ButtonShowcase.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Mail, ChevronRight, Plus, Download } from "lucide-react"

export function ButtonShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Button</h3>
      <p className="text-sm text-muted-foreground">
        Displays a button or a component that looks like a button.
      </p>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Additional Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Color Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sizes</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Icons</h4>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Mail className="mr-2 h-4 w-4" /> Login with Email
            </Button>
            <Button variant="outline">
              Download <Download className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="secondary">
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* States */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">States</h4>
          <div className="flex flex-wrap gap-2">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </div>
    </div>
  )
}