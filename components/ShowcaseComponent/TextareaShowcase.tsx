// components/ShowcaseComponent/TextareaShowcase.tsx
"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function TextareaShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Textarea</h3>
      <p className="text-sm text-muted-foreground">
        Displays a form textarea or a component that looks like a textarea.
      </p>
      
      <div className="grid gap-6 max-w-md">
        {/* Default */}
        <div className="space-y-2">
          <Label htmlFor="default">Default</Label>
          <Textarea id="default" placeholder="Type your message here." />
        </div>

        {/* With Text */}
        <div className="space-y-2">
          <Label htmlFor="with-text">With Default Value</Label>
          <Textarea
            id="with-text"
            defaultValue="This textarea has some default text that you can edit."
          />
        </div>

        {/* With Label and Description */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-muted-foreground">
            Write a short bio. This will be visible on your profile.
          </p>
        </div>

        {/* Disabled */}
        <div className="space-y-2">
          <Label htmlFor="disabled" className="opacity-50">Disabled</Label>
          <Textarea
            id="disabled"
            placeholder="This textarea is disabled"
            disabled
          />
        </div>

        {/* With Error */}
        <div className="space-y-2">
          <Label htmlFor="error" className="text-red-500">With Error</Label>
          <Textarea
            id="error"
            error
            placeholder="This field has an error"
          />
          <p className="text-xs text-red-500">Please enter at least 10 characters.</p>
        </div>

        {/* Form Example */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback Form</Label>
          <Textarea
            id="feedback"
            placeholder="Share your feedback with us..."
            className="min-h-[120px]"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">0/500 characters</p>
            <Button size="sm">Submit</Button>
          </div>
        </div>
      </div>
    </div>
  )
}