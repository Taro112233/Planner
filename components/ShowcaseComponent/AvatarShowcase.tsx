// components/ShowcaseComponent/AvatarShowcase.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AvatarShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Avatar</h3>
      <p className="text-sm text-muted-foreground">
        An image element with a fallback for representing the user.
      </p>
      
      <div className="space-y-6">
        {/* Sizes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Sizes</h4>
          <div className="flex items-end gap-4">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" width={32} height={32} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="md">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" width={40} height={40} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" width={48} height={48} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="xl">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" width={64} height={64} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* With Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Status</h4>
          <div className="flex items-center gap-4">
            <Avatar size="lg" status="online">
              <AvatarImage src="https://github.com/vercel.png" alt="@vercel" width={48} height={48} />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
            <Avatar size="lg" status="offline">
              <AvatarImage src="https://github.com/vercel.png" alt="@vercel" width={48} height={48} />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
            <Avatar size="lg" status="away">
              <AvatarImage src="https://github.com/vercel.png" alt="@vercel" width={48} height={48} />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
            <Avatar size="lg" status="busy">
              <AvatarImage src="https://github.com/vercel.png" alt="@vercel" width={48} height={48} />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Fallback */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fallback</h4>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className="bg-interactive-primary text-primary-foreground">AB</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className="bg-surface-tertiary text-content-secondary">XY</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className="bg-surface-interactive text-content-primary">ZZ</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Avatar Group */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Avatar Stack</h4>
          <div className="flex -space-x-3">
            <Avatar size="lg" className="border-2 border-background">
              <AvatarFallback className="bg-interactive-primary text-primary-foreground">A</AvatarFallback>
            </Avatar>
            <Avatar size="lg" className="border-2 border-background">
              <AvatarFallback className="bg-surface-tertiary text-content-primary">B</AvatarFallback>
            </Avatar>
            <Avatar size="lg" className="border-2 border-background">
              <AvatarFallback className="bg-surface-interactive text-content-secondary">C</AvatarFallback>
            </Avatar>
            <Avatar size="lg" className="border-2 border-background">
              <AvatarFallback className="bg-muted text-content-tertiary">+5</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}