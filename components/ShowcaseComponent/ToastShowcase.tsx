// components/ShowcaseComponent/ToastShowcase.tsx
"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ToastShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Toast</h3>
      <p className="text-sm text-muted-foreground">
        A succinct message that is displayed temporarily.
      </p>
      
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={() => {
            toast("Event has been created", {
              description: "Sunday, December 03, 2023 at 9:00 AM",
            })
          }}
        >
          Default Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast.success("Successfully saved!", {
              description: "Your changes have been saved.",
            })
          }}
        >
          Success
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast.error("Something went wrong", {
              description: "There was a problem with your request.",
            })
          }}
        >
          Error
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast.warning("Warning", {
              description: "Your session is about to expire.",
            })
          }}
        >
          Warning
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast.info("Did you know?", {
              description: "You can customize the toast appearance.",
            })
          }}
        >
          Info
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast.promise(
              new Promise((resolve) => setTimeout(resolve, 2000)),
              {
                loading: "Loading...",
                success: "Data loaded successfully!",
                error: "Error loading data",
              }
            )
          }}
        >
          Promise Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast("Custom action", {
              description: "This toast has a custom action.",
              action: {
                label: "Undo",
                onClick: () => console.log("Undo clicked"),
              },
            })
          }}
        >
          With Action
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast("Persistent toast", {
              description: "This toast won't auto-dismiss.",
              duration: Infinity,
            })
          }}
        >
          Persistent
        </Button>
      </div>
    </div>
  )
}