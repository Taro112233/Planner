// components/ShowcaseComponent/DrawerShowcase.tsx
"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function DrawerShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Drawer</h3>
      <p className="text-sm text-muted-foreground">
        A drawer component that slides in from any edge of the screen.
      </p>
      
      <div className="flex flex-wrap gap-4">
        {/* Bottom Drawer (Default) */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Bottom Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-7xl font-bold tracking-tighter">350</div>
                  <div className="text-[0.70rem] uppercase text-muted-foreground">
                    Calories/day
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                >
                  +
                </Button>
              </div>
            </div>
            <DrawerFooter>
              <Button>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Top Drawer */}
        <Drawer direction="top">
          <DrawerTrigger asChild>
            <Button variant="outline">Top Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Notifications</DrawerTitle>
              <DrawerDescription>You have 3 unread notifications.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">New message from John</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Your order has shipped</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Left Drawer */}
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button variant="outline">Left Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Navigate through the app.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start">Home</Button>
              <Button variant="ghost" className="w-full justify-start">Profile</Button>
              <Button variant="ghost" className="w-full justify-start">Settings</Button>
              <Button variant="ghost" className="w-full justify-start">Help</Button>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Right Drawer */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline">Right Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Shopping Cart</DrawerTitle>
              <DrawerDescription>Review your items before checkout.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Product 1</p>
                  <p className="text-sm text-muted-foreground">Qty: 2</p>
                </div>
                <p className="font-medium">$29.99</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Product 2</p>
                  <p className="text-sm text-muted-foreground">Qty: 1</p>
                </div>
                <p className="font-medium">$49.99</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>$109.97</span>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button>Checkout</Button>
              <DrawerClose asChild>
                <Button variant="outline">Continue Shopping</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}