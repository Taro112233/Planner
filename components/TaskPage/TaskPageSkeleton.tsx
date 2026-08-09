// components/TaskPage/TaskPageSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
