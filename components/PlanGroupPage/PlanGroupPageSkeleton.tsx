// components/PlanGroupPage/PlanGroupPageSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PlanGroupPageSkeleton() {
  return (
    <div className="space-y-6 px-5 py-5">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
