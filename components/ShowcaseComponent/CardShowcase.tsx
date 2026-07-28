// components/ShowcaseComponent/CardShowcase.tsx
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check } from "lucide-react"

export function CardShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Card</h3>
      <p className="text-sm text-muted-foreground">
        Displays a card with header, content, and footer.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Card */}
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is the card content area. You can put any content here.
            </p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>

        {/* Hoverable Card */}
        <Card hoverable>
          <CardHeader>
            <CardTitle>Hoverable Card</CardTitle>
            <CardDescription>Hover to see the effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This card has a hover animation that scales and lifts slightly.
            </p>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>

        {/* Notification Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
              <Badge>3</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Check className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Payment received</p>
                <p className="text-muted-foreground text-xs">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Check className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Order shipped</p>
                <p className="text-muted-foreground text-xs">5 hours ago</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All</Button>
          </CardFooter>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">$45,231.89</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <Badge className="w-fit mb-2">Popular</Badge>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold text-foreground">$29</span>/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Unlimited projects
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Priority support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Subscribe</Button>
          </CardFooter>
        </Card>

        {/* Gradient Card */}
        <Card gradient className="gradient-brand-semantic border-0">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Gradient Card</CardTitle>
            <CardDescription className="text-primary-foreground/80">Beautiful gradient background</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary-foreground/90">
              Cards can have gradient backgrounds for a more vibrant look.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}