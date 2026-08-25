// components/HomePage/HomePageSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="space-y-6 px-5 py-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
