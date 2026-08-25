// components/TrashPage/TrashPageSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TrashPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="space-y-3 px-5 py-5">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}
