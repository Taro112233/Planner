// components/MyTasksPage/MyTaskRow.tsx
// One card on a cross-plan list. Shows where it lives, since the reader is
// looking at work from several boards at once.
'use client';

import React from 'react';
import Link from 'next/link';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { PRIORITY_STYLES } from '@/components/TaskDetail';
import type { MyTaskDto } from '@/types/planner';

interface MyTaskRowProps {
  task: MyTaskDto;
  /** Renders the due date in the danger colour. */
  overdue?: boolean;
}

export function MyTaskRow({ task, overdue = false }: MyTaskRowProps) {
  return (
    <li>
      <Link
        href={`/board/tasks/${task.id}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-secondary"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: resolveGroupColor(task.groupColor) }}
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-content-primary">{task.title}</span>
          <span className="block truncate text-[11px] text-content-tertiary">
            {task.planName} · {task.groupName}
            {task.subtaskTotal > 0 && ` · งานย่อย ${task.subtaskDone}/${task.subtaskTotal}`}
          </span>
        </span>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <span
            className={`shrink-0 text-[11px] tabular-nums ${
              overdue ? 'text-content-danger' : 'text-content-tertiary'
            }`}
          >
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </Link>
    </li>
  );
}
