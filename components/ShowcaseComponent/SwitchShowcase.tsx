// components/ShowcaseComponent/SwitchShowcase.tsx
"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function SwitchShowcase() {
  const [enabled, setEnabled] = React.useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Switch</h3>
      <p className="text-sm text-muted-foreground">
        A control that allows the user to toggle between checked and not checked.
      </p>
      
      <div className="space-y-6 max-w-md">
        {/* Basic */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <div className="flex items-center space-x-2">
            <Switch id="airplane" />
            <Label htmlFor="airplane">Airplane Mode</Label>
          </div>
        </div>

        {/* Controlled */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Controlled</h4>
          <div className="flex items-center space-x-2">
            <Switch
              id="controlled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="controlled">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>

        {/* Settings Example */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Settings Panel</h4>
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Receive marketing and promotional content
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Disabled */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Disabled States</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="disabled-off" disabled />
              <Label htmlFor="disabled-off" className="opacity-50">Disabled (Off)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="disabled-on" disabled checked />
              <Label htmlFor="disabled-on" className="opacity-50">Disabled (On)</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}