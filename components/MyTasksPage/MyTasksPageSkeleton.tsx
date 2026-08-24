'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function MyTasksPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
