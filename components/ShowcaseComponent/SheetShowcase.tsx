// components/ShowcaseComponent/SheetShowcase.tsx
"use client"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SheetShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sheet</h3>
      <p className="text-sm text-muted-foreground">
        Extends the Dialog component to display content that complements the main content of the screen.
      </p>
      
      <div className="flex flex-wrap gap-4">
        {/* Right Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Right Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value="John Doe" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input id="username" value="@johndoe" className="col-span-3" />
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Save changes</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Left Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Left Sheet</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Browse through the menu options.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <Button variant="ghost" className="justify-start">Home</Button>
              <Button variant="ghost" className="justify-start">Dashboard</Button>
              <Button variant="ghost" className="justify-start">Settings</Button>
              <Button variant="ghost" className="justify-start">Profile</Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Top Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Top Sheet</Button>
          </SheetTrigger>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Notification Settings</SheetTitle>
              <SheetDescription>
                Configure your notification preferences.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Notification content would go here...
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Bottom Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Bottom Sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Share</SheetTitle>
              <SheetDescription>
                Share this content with others.
              </SheetDescription>
            </SheetHeader>
            <div className="flex gap-4 py-4">
              <Button variant="outline">Copy Link</Button>
              <Button variant="outline">Email</Button>
              <Button variant="outline">Twitter</Button>
              <Button variant="outline">Facebook</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}