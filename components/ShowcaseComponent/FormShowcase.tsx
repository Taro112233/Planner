// components/ShowcaseComponent/FormShowcase.tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export function FormShowcase() {
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("")
  const [terms, setTerms] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (username.length < 2) {
      newErrors.username = "Username must be at least 2 characters."
    }
    
    if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address."
    }
    
    if (!role) {
      newErrors.role = "Please select a role."
    }
    
    if (!terms) {
      newErrors.terms = "You must accept the terms and conditions."
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validate()) {
      toast.success("Form submitted!", {
        description: `Username: ${username}, Email: ${email}, Role: ${role}`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Form</h3>
      <p className="text-sm text-muted-foreground">
        Building forms with validation.
      </p>
      
      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is your public display name.
            </p>
            {errors.username && (
              <p className="text-xs text-red-500">{errors.username}</p>
            )}
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this to contact you.
            </p>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your role determines your permissions.
            </p>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role}</p>
            )}
          </div>

          {/* Terms Field */}
          <div className="flex flex-row items-start space-x-3 space-y-0">
            <Checkbox
              id="terms"
              checked={terms}
              onCheckedChange={(checked) => setTerms(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="terms">
                Accept terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                You agree to our Terms of Service and Privacy Policy.
              </p>
              {errors.terms && (
                <p className="text-xs text-red-500">{errors.terms}</p>
              )}
            </div>
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </div>
    </div>
  )
}