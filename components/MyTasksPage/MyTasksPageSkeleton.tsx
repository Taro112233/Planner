'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function MyTasksPageSkeleton() {
  return (
    <div className="space-y-5 px-5 py-5">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
