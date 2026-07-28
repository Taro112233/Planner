// components/ShowcaseComponent/FieldShowcase.tsx
"use client"

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldContent,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function FieldShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Field</h3>
      <p className="text-sm text-muted-foreground">
        A wrapper component for form fields with labels and descriptions.
      </p>
      
      <div className="space-y-6 max-w-md">
        {/* Basic Field */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="Enter your email" />
          <FieldDescription>We&apos;ll never share your email.</FieldDescription>
        </Field>

        {/* Field with Error */}
        <Field data-invalid="true">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" placeholder="Enter password" />
          <FieldError>Password must be at least 8 characters.</FieldError>
        </Field>

        {/* Field Group */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input id="firstName" placeholder="John" />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input id="lastName" placeholder="Doe" />
          </Field>
        </FieldGroup>

        {/* Horizontal Field */}
        <Field orientation="horizontal">
          <Checkbox id="agree" />
          <FieldContent>
            <FieldLabel htmlFor="agree">I agree to the terms</FieldLabel>
            <FieldDescription>
              By checking this, you agree to our Terms of Service.
            </FieldDescription>
          </FieldContent>
        </Field>

        {/* Radio Group Field */}
        <Field>
          <FieldLabel>Notification Preference</FieldLabel>
          <RadioGroup defaultValue="email">
            <Field orientation="horizontal">
              <RadioGroupItem value="email" id="email-notify" />
              <FieldContent>
                <FieldLabel htmlFor="email-notify">Email</FieldLabel>
                <FieldDescription>Receive notifications via email</FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="sms" id="sms-notify" />
              <FieldContent>
                <FieldLabel htmlFor="sms-notify">SMS</FieldLabel>
                <FieldDescription>Receive notifications via SMS</FieldDescription>
              </FieldContent>
            </Field>
          </RadioGroup>
        </Field>
      </div>
    </div>
  )
}