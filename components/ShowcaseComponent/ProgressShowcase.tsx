// components/ShowcaseComponent/ProgressShowcase.tsx
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

export function ProgressShowcase() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Progress</h3>
      <p className="text-sm text-muted-foreground">
        Displays an indicator showing the completion progress of a task.
      </p>
      
      <div className="space-y-6 max-w-md">
        {/* Animated Progress */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Animated</h4>
          <Progress value={progress} />
        </div>

        {/* Static Values */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Static Values</h4>
          <div className="space-y-3">
            <Progress value={0} />
            <Progress value={25} />
            <Progress value={50} />
            <Progress value={75} />
            <Progress value={100} />
          </div>
        </div>

        {/* With Label */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Label</h4>
          <Progress value={45} showLabel />
        </div>

        {/* Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Variants</h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Default</p>
              <Progress value={60} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Success</p>
              <Progress value={100} variant="success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Warning</p>
              <Progress value={75} variant="warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Error</p>
              <Progress value={30} variant="error" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}