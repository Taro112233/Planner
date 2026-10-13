'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AuditLogPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-canvas">
      <div className="space-y-3 px-5 py-5">
        <Skeleton className="h-7 w-2/3 rounded-full" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
