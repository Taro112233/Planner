// components/ShowcaseComponent/SkeletonShowcase.tsx
"use client"

import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from "@/components/ui/skeleton"

export function SkeletonShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Skeleton</h3>
      <p className="text-sm text-muted-foreground">
        Used to show a placeholder while content is loading.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Skeleton */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic Shapes</h4>
          <div className="space-y-4">
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="circular" width={40} height={40} />
          </div>
        </div>

        {/* Skeleton Text */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Text Lines</h4>
          <SkeletonText lines={4} />
        </div>

        {/* Skeleton Avatar */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Avatar</h4>
          <div className="flex items-center space-x-4">
            <SkeletonAvatar size={40} />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
        </div>

        {/* Wave Animation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Wave Animation</h4>
          <div className="space-y-2">
            <Skeleton animation="wave" height={20} />
            <Skeleton animation="wave" height={20} width="80%" />
            <Skeleton animation="wave" height={20} width="60%" />
          </div>
        </div>

        {/* Skeleton Card */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">Card Skeleton</h4>
          <div className="max-w-sm">
            <SkeletonCard />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">List Skeleton</h4>
          <div className="space-y-4 max-w-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <SkeletonAvatar size={48} />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </div>
                <Skeleton variant="rectangular" width={60} height={32} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}