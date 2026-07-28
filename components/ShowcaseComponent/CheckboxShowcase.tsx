// components/ShowcaseComponent/CheckboxShowcase.tsx
"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CheckboxShowcase() {
  const [checked, setChecked] = React.useState(false)
  const [checkedItems, setCheckedItems] = React.useState({
    terms: false,
    marketing: false,
    newsletter: true,
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Checkbox</h3>
      <p className="text-sm text-muted-foreground">
        A control that allows the user to toggle between checked and unchecked.
      </p>
      
      <div className="space-y-6">
        {/* Basic Checkbox */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <div className="flex items-center space-x-2">
            <Checkbox id="basic" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="basic">Accept terms and conditions</Label>
          </div>
        </div>

        {/* Multiple Checkboxes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Options</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={checkedItems.terms}
                onCheckedChange={(checked) =>
                  setCheckedItems((prev) => ({ ...prev, terms: checked as boolean }))
                }
              />
              <Label htmlFor="terms">I agree to the terms of service</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={checkedItems.marketing}
                onCheckedChange={(checked) =>
                  setCheckedItems((prev) => ({ ...prev, marketing: checked as boolean }))
                }
              />
              <Label htmlFor="marketing">Receive marketing emails</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newsletter"
                checked={checkedItems.newsletter}
                onCheckedChange={(checked) =>
                  setCheckedItems((prev) => ({ ...prev, newsletter: checked as boolean }))
                }
              />
              <Label htmlFor="newsletter">Subscribe to newsletter</Label>
            </div>
          </div>
        </div>

        {/* States */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">States</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="checked" checked />
              <Label htmlFor="checked">Checked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="unchecked" />
              <Label htmlFor="unchecked">Unchecked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled" disabled />
              <Label htmlFor="disabled" className="opacity-50">Disabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled-checked" disabled checked />
              <Label htmlFor="disabled-checked" className="opacity-50">Disabled Checked</Label>
            </div>
          </div>
        </div>

        {/* With Error */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Error</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox id="error" error />
              <Label htmlFor="error" className="text-red-500">This field is required</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}