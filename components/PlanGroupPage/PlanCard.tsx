// components/PlanGroupPage/PlanCard.tsx
// One plan inside the group overview: progress, per-column chips, and a way to
// take it back out of the group.
'use client';

import React from 'react';
import Link from 'next/link';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { Button } from '@/components/ui/button';
import type { PlanSummaryDto } from '@/types/planner';

interface PlanCardProps {
  plan: PlanSummaryDto;
  onLeaveGroup: () => void;
}

export function PlanCard({ plan, onLeaveGroup }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/plans/${plan.id}`} className="group flex min-w-0 items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-[4px]"
            style={{ backgroundColor: resolveGroupColor(plan.color) }}
          />
          <span className="truncate text-sm font-semibold text-content-primary group-hover:underline">
            {plan.name}
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 px-2 text-[11px] text-content-tertiary"
          onClick={onLeaveGroup}
        >
          เอาออก
        </Button>
      </div>

      <p className="mt-1 text-xs text-content-tertiary tabular-nums">
        {plan.taskCount} งาน · {plan.completionPct}%
      </p>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary"
        role="progressbar"
        aria-valuenow={plan.completionPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`ความคืบหน้า ${plan.completionPct}%`}
      >
        <div
          className="h-full rounded-full bg-interactive-primary transition-all duration-500"
          style={{ width: `${plan.completionPct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {plan.columns.map((column) => (
          <span
            key={column.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] text-content-secondary"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: resolveGroupColor(column.color) }}
            />
            {column.name} {column.taskCount}
          </span>
        ))}
      </div>
    </div>
  );
}
