// components/BoardPage/BoardSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function BoardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-7 w-32 mb-6" />
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface-secondary border border-border-subtle p-3"
            >
              <Skeleton className="h-5 w-24 mb-2" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
