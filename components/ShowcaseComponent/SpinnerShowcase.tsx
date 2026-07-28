// components/ShowcaseComponent/SpinnerShowcase.tsx
"use client"

import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"

export function SpinnerShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Spinner</h3>
      <p className="text-sm text-muted-foreground">
        A loading spinner to indicate that content is being loaded.
      </p>
      
      <div className="space-y-6">
        {/* Default */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default</h4>
          <Spinner />
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sizes</h4>
          <div className="flex items-center gap-4">
            <Spinner className="size-4" />
            <Spinner className="size-6" />
            <Spinner className="size-8" />
            <Spinner className="size-10" />
            <Spinner className="size-12" />
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Colors</h4>
          <div className="flex items-center gap-4">
            <Spinner className="text-primary" />
            <Spinner className="text-blue-500" />
            <Spinner className="text-green-500" />
            <Spinner className="text-red-500" />
            <Spinner className="text-purple-500" />
          </div>
        </div>

        {/* In Button */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">In Button</h4>
          <div className="flex gap-4">
            <Button disabled>
              <Spinner className="mr-2 size-4" />
              Loading...
            </Button>
            <Button variant="outline" disabled>
              <Spinner className="mr-2 size-4" />
              Please wait
            </Button>
          </div>
        </div>

        {/* Centered */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Centered in Container</h4>
          <div className="flex items-center justify-center h-32 border rounded-lg">
            <Spinner className="size-8" />
          </div>
        </div>

        {/* With Text */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Text</h4>
          <div className="flex flex-col items-center justify-center gap-2 h-32 border rounded-lg">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </div>
    </div>
  )
}