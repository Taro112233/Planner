// components/PlannerShell/PlannerPageSkeleton.tsx
// Generic loading state for a planner page: title block plus a grid of cards.
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PlannerPageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="min-h-screen bg-surface-canvas">
      <div className="space-y-2 px-5 pb-3 pt-3.5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="grid gap-3.5 px-5 pt-1 lg:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
