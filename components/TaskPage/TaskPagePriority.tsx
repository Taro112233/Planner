// components/TaskPage/TaskPagePriority.tsx
// Chip-style priority selector (same visual language as StatusChipRow).
'use client';

import React from 'react';
import { Flag } from 'lucide-react';
import { PRIORITY_STYLES } from '@/components/TaskDetail/priorityStyles';
import type { TaskPriority } from '@/types/planner';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface TaskPagePriorityProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

export function TaskPagePriority({ priority, onChange, disabled = false }: TaskPagePriorityProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((p) => {
        const active = p === priority;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            disabled={disabled}
            className={[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              active ? PRIORITY_STYLES[p] : 'bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary',
              active && 'ring-1 ring-interactive-primary',
              disabled && 'opacity-60 cursor-not-allowed',
            ].join(' ')}
          >
            <Flag size={10} />
            {p}
          </button>
        );
      })}
    </div>
  );
}
