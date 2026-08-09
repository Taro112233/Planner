// components/TaskDetail/StatusChipRow.tsx
// Column-as-status chip row: clicking a chip moves the task to that column.
// Shared by TaskDetailModal (slide-over) and TaskPage (full page).
'use client';

import React from 'react';
import type { BoardGroupDto, GroupSummaryDto } from '@/types/planner';

interface StatusChipRowProps {
  groups: (BoardGroupDto | GroupSummaryDto)[];
  activeGroupId: string;
  onChange: (groupId: string) => void;
  disabled?: boolean;
}

export function StatusChipRow({ groups, activeGroupId, onChange, disabled = false }: StatusChipRowProps) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((group) => {
        const active = group.id === activeGroupId;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onChange(group.id)}
            disabled={disabled}
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              active
                ? 'bg-interactive-primary text-primary-foreground'
                : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary',
              disabled && 'opacity-60 cursor-not-allowed',
            ].join(' ')}
          >
            {group.name}
          </button>
        );
      })}
    </div>
  );
}
