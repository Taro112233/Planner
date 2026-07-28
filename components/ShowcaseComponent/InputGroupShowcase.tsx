// components/ShowcaseComponent/InputGroupShowcase.tsx
"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Search, Mail, Copy, Eye, EyeOff, DollarSign, AtSign } from "lucide-react"
import * as React from "react"

export function InputGroupShowcase() {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Input Group</h3>
      <p className="text-sm text-muted-foreground">
        Combines inputs with buttons, icons, or text addons.
      </p>
      
      <div className="grid gap-6 max-w-md">
        {/* With Icon */}
        <div className="space-y-2">
          <Label>Search</Label>
          <InputGroup>
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </div>

        {/* With Text Addon */}
        <div className="space-y-2">
          <Label>Email</Label>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <AtSign className="h-4 w-4" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="username" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@example.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* With Button */}
        <div className="space-y-2">
          <Label>Copy Link</Label>
          <InputGroup>
            <InputGroupInput defaultValue="https://example.com/share/abc123" readOnly />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>
                <Copy className="h-4 w-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Password Toggle */}
        <div className="space-y-2">
          <Label>Password</Label>
          <InputGroup>
            <InputGroupInput 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter password" 
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Currency Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <DollarSign className="h-4 w-4" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput type="number" placeholder="0.00" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>USD</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Label>Message</Label>
          <InputGroup>
            <InputGroupAddon align="block-start">
              <InputGroupText>
                <Mail className="h-4 w-4 mr-2" /> Compose
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupTextarea placeholder="Write your message..." />
          </InputGroup>
        </div>
      </div>
    </div>
  )
}