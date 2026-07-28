// components/ShowcaseComponent/AspectRatioShowcase.tsx
"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"

export function AspectRatioShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Aspect Ratio</h3>
      <p className="text-sm text-muted-foreground">
        Displays content within a desired ratio.
      </p>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* 16:9 Aspect Ratio */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">16:9 (Video)</h4>
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center gradient-brand-semantic text-primary-foreground font-medium">
              16:9
            </div>
          </AspectRatio>
        </div>

        {/* 4:3 Aspect Ratio */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">4:3 (Classic)</h4>
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-surface-interactive text-content-primary font-medium">
              4:3
            </div>
          </AspectRatio>
        </div>

        {/* 1:1 Aspect Ratio */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">1:1 (Square)</h4>
          <AspectRatio ratio={1} className="bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-surface-tertiary text-content-secondary font-medium">
              1:1
            </div>
          </AspectRatio>
        </div>

        {/* 21:9 Aspect Ratio */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">21:9 (Ultra-wide)</h4>
          <AspectRatio ratio={21 / 9} className="bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-interactive-primary/20 text-content-primary font-medium">
              21:9
            </div>
          </AspectRatio>
        </div>

        {/* 9:16 Aspect Ratio */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">9:16 (Portrait)</h4>
          <div className="w-1/2">
            <AspectRatio ratio={9 / 16} className="bg-muted rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-surface-secondary text-content-tertiary font-medium">
                9:16
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
    </div>
  )
}