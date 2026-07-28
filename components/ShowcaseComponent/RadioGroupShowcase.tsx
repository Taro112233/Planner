// components/ShowcaseComponent/RadioGroupShowcase.tsx
"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function RadioGroupShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Radio Group</h3>
      <p className="text-sm text-muted-foreground">
        A set of checkable buttons where only one can be checked at a time.
      </p>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Vertical */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical (Default)</h4>
          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="r1" />
              <Label htmlFor="r1">Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="r2" />
              <Label htmlFor="r2">Comfortable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="r3" />
              <Label htmlFor="r3">Compact</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Horizontal */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Horizontal</h4>
          <RadioGroup defaultValue="medium" orientation="horizontal">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="size-s" />
              <Label htmlFor="size-s">Small</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="size-m" />
              <Label htmlFor="size-m">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="size-l" />
              <Label htmlFor="size-l">Large</Label>
            </div>
          </RadioGroup>
        </div>

        {/* With Descriptions */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">With Descriptions</h4>
          <RadioGroup defaultValue="card" className="max-w-md">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="card" id="pay-card" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="pay-card">Credit Card</Label>
                <p className="text-sm text-muted-foreground">
                  Pay with Visa, Mastercard, or American Express
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="paypal" id="pay-paypal" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="pay-paypal">PayPal</Label>
                <p className="text-sm text-muted-foreground">
                  Pay securely using your PayPal account
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="bank" id="pay-bank" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="pay-bank">Bank Transfer</Label>
                <p className="text-sm text-muted-foreground">
                  Direct bank transfer to our account
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Disabled */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Disabled</h4>
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">Option One</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" disabled />
              <Label htmlFor="option-two" className="opacity-50">Option Two (Disabled)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}