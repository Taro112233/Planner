// components/ShowcaseComponent/HoverCardShowcase.tsx
"use client"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"

export function HoverCardShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hover Card</h3>
      <p className="text-sm text-muted-foreground">
        For sighted users to preview content available behind a link.
      </p>
      
      <div className="flex flex-wrap gap-8">
        {/* User Profile Card */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@nextjs</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" alt="vercel" width={40} height={40} />
                <AvatarFallback>VC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@nextjs</h4>
                <p className="text-sm">
                  The React Framework – created and maintained by @vercel.
                </p>
                <div className="flex items-center pt-2">
                  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                  <span className="text-xs text-muted-foreground">
                    Joined December 2021
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Product Card */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline">View Product</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Premium Subscription</h4>
              <p className="text-sm text-muted-foreground">
                Get access to all premium features including unlimited storage, priority support, and advanced analytics.
              </p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">$29/mo</span>
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Simple Info Card */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="text-sm underline decoration-dotted cursor-help">
              What is this?
            </span>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-sm">
              This is a hover card component that displays additional information when the user hovers over the trigger element.
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  )
}