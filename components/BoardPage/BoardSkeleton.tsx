// components/BoardPage/BoardSkeleton.tsx
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function BoardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-canvas">
      <div className="px-5 py-5">
        <Skeleton className="h-7 w-32 mb-6" />
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex w-[266px] shrink-0 flex-col gap-[11px]"
            >
              <Skeleton className="h-5 w-24 mb-2" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
