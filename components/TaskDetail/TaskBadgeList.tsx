// components/TaskDetail/TaskBadgeList.tsx
// Read-only badge chips. Attaching/detaching badges is not implemented yet
// (no TaskItemBadge write path exists) — this only renders what is stored.
'use client';

import React from 'react';
import type { TaskBadgeDto } from '@/types/planner';

interface TaskBadgeListProps {
  badges: TaskBadgeDto[];
  /** Skip the section wrapper and heading — the caller already labels it. */
  bare?: boolean;
}

export function TaskBadgeList({ badges, bare = false }: TaskBadgeListProps) {
  if (badges.length === 0) return null;

  const chips = (
    <div className="flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <span
            key={badge.id}
            className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
            style={badge.color ? { borderLeft: `3px solid ${badge.color}` } : undefined}
          >
            {badge.name}
          </span>
        ))}
    </div>
  );

  if (bare) return chips;

  return (
    <section aria-label="Badges">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
        Badges
      </h2>
      {chips}
    </section>
  );
}
