// components/ShowcaseComponent/AlertShowcase.tsx
"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function AlertShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alert</h3>
      <p className="text-sm text-muted-foreground">
        Displays important messages to attract user attention.
      </p>
      
      <div className="grid gap-4">
        {/* Default Alert */}
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the CLI.
          </AlertDescription>
        </Alert>

        {/* Info Alert */}
        <Alert variant="info">
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Your session will expire in 15 minutes. Please save your work.
          </AlertDescription>
        </Alert>

        {/* Success Alert */}
        <Alert variant="success">
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>

        {/* Warning Alert */}
        <Alert variant="warning">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Your storage is almost full. Consider upgrading your plan.
          </AlertDescription>
        </Alert>

        {/* Destructive Alert */}
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again later.
          </AlertDescription>
        </Alert>

        {/* Alert without icon */}
        <Alert variant="info" showIcon={false}>
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            This alert has no icon displayed.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}