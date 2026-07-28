// components/ShowcaseComponent/AlertDialogShowcase.tsx
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function AlertDialogShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alert Dialog</h3>
      <p className="text-sm text-muted-foreground">
        Modal dialog for important actions requiring user confirmation.
      </p>
      
      <div className="flex flex-wrap gap-4">
        {/* Default Alert Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Destructive Alert Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Remove Item</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This item will be removed from your cart. You can add it back later if you change your mind.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Item</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Info Alert Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary">Show Terms</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terms of Service</AlertDialogTitle>
              <AlertDialogDescription>
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Please read them carefully before proceeding with your account setup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Decline</AlertDialogCancel>
              <AlertDialogAction>Accept & Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}