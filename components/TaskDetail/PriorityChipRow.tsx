// components/TaskDetail/PriorityChipRow.tsx
// Chip-style priority selector (same visual language as StatusChipRow).
// Shared by three surfaces so the chips never drift apart:
//   · NewTaskButton   — pick a priority while creating a card
//   · TaskDetailModal — change it from the slide-over
//   · TaskPage        — change it from the full page
'use client';

import React from 'react';
import { Flag } from 'lucide-react';
import { PRIORITY_STYLES } from './priorityStyles';
import type { TaskPriority } from '@/types/planner';

export const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface PriorityChipRowProps {
  /** The active priority. `null` means "nothing picked yet" (creation form). */
  value: TaskPriority | null;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

export function PriorityChipRow({ value, onChange, disabled = false }: PriorityChipRowProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((priority) => {
        const active = priority === value;
        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            disabled={disabled}
            aria-pressed={active}
            className={[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              active
                ? PRIORITY_STYLES[priority]
                : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary',
              active && 'ring-2 ring-interactive-primary ring-offset-1 ring-offset-surface-primary',
              disabled && 'opacity-60 cursor-not-allowed',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Flag size={10} />
            {priority}
          </button>
        );
      })}
    </div>
  );
}
