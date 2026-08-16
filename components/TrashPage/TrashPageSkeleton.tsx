// components/TrashPage/TrashPageSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TrashPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}
