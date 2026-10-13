// components/MyTasksPage/MyTaskRow.tsx
// One card on a cross-plan list. Shows where it lives, since the reader is
// looking at work from several boards at once.
'use client';

import React from 'react';
import Link from 'next/link';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { PRIORITY_LABELS, PRIORITY_STYLES } from '@/components/TaskDetail';
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
        className="flex items-center gap-[11px] border-t border-border-subtle px-1 py-[9px] transition-colors hover:bg-surface-secondary"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: resolveGroupColor(task.groupColor) }}
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-content-primary">{task.title}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-content-tertiary">
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface-secondary px-1.5 py-px text-content-secondary"
              title={task.planGroupName ? `กลุ่ม ${task.planGroupName}` : 'แผนงานส่วนตัว'}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: resolveGroupColor(task.planGroupColor) }}
                aria-hidden="true"
              />
              {task.planGroupName ?? 'ส่วนตัว'}
            </span>
            <span className="min-w-0 truncate">
            {task.planName} · {task.groupName}
            {task.subtaskTotal > 0 && ` · งานย่อย ${task.subtaskDone}/${task.subtaskTotal}`}
            </span>
          </span>
        </span>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
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
