// components/ShowcaseComponent/SeparatorShowcase.tsx
"use client"

import { Separator } from "@/components/ui/separator"

export function SeparatorShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Separator</h3>
      <p className="text-sm text-muted-foreground">
        Visually or semantically separates content.
      </p>
      
      <div className="space-y-6">
        {/* Horizontal Separator */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Horizontal</h4>
          <div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
              <p className="text-sm text-muted-foreground">
                An open-source UI component library.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
              <div>Blog</div>
              <Separator orientation="vertical" />
              <div>Docs</div>
              <Separator orientation="vertical" />
              <div>Source</div>
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical</h4>
          <div className="flex h-10 items-center space-x-4">
            <span>Item 1</span>
            <Separator orientation="vertical" />
            <span>Item 2</span>
            <Separator orientation="vertical" />
            <span>Item 3</span>
            <Separator orientation="vertical" />
            <span>Item 4</span>
          </div>
        </div>

        {/* In Card */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">In Context</h4>
          <div className="rounded-lg border p-4 max-w-sm">
            <h4 className="font-medium">Account Settings</h4>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences
            </p>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Email</span>
                <span className="text-sm text-muted-foreground">user@example.com</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Plan</span>
                <span className="text-sm text-muted-foreground">Pro</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Status</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}