// components/BoardPage/BoardTimelineView.tsx
// Gantt-lite: one row per task, a colored bar spanning startDate → dueDate on
// a day-scale header. Tasks missing startDate fall back to a same-day marker
// at dueDate; tasks missing both dates are listed separately instead of being
// silently dropped.
'use client';

import React, { useMemo } from 'react';
import type { BoardDto, BoardTaskDto } from '@/types/planner';

interface BoardTimelineViewProps {
  board: BoardDto;
  onOpenTask: (taskId: string) => void;
}

interface TimelineRow {
  task: BoardTaskDto;
  color: string | null;
  start: Date;
  end: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_WIDTH_PX = 28;

export function BoardTimelineView({ board, onOpenTask }: BoardTimelineViewProps) {
  const { rows, unscheduled, rangeStart, totalDays } = useMemo(() => {
    const scheduled: TimelineRow[] = [];
    const unscheduledTasks: BoardTaskDto[] = [];

    board.groups.forEach((group) => {
      group.taskItems.forEach((task) => {
        if (!task.dueDate && !task.startDate) {
          unscheduledTasks.push(task);
          return;
        }
        const end = new Date(task.dueDate ?? task.startDate!);
        const start = new Date(task.startDate ?? task.dueDate!);
        scheduled.push({ task, color: group.color, start, end: end < start ? start : end });
      });
    });

    if (scheduled.length === 0) {
      return { rows: [] as TimelineRow[], unscheduled: unscheduledTasks, rangeStart: new Date(), totalDays: 1 };
    }

    const minStart = new Date(Math.min(...scheduled.map((r) => r.start.getTime())));
    const maxEnd = new Date(Math.max(...scheduled.map((r) => r.end.getTime())));
    minStart.setDate(minStart.getDate() - 1);
    maxEnd.setDate(maxEnd.getDate() + 1);
    const days = Math.max(1, Math.round((maxEnd.getTime() - minStart.getTime()) / MS_PER_DAY));

    return { rows: scheduled, unscheduled: unscheduledTasks, rangeStart: minStart, totalDays: days };
  }, [board]);

  const dayHeaders = useMemo(
    () =>
      Array.from({ length: totalDays }, (_, i) => {
        const d = new Date(rangeStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [rangeStart, totalDays]
  );

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-content-tertiary">No tasks with a start or due date yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {/* Fixed label column */}
        <div className="w-40 shrink-0">
          <div className="h-6 mb-2" />
          <div className="flex flex-col gap-1.5">
            {rows.map(({ task }) => (
              <button
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="h-6 flex items-center text-xs text-content-primary truncate text-left hover:text-interactive-primary"
                title={task.title}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable day-scale + bars */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ minWidth: totalDays * DAY_WIDTH_PX }}>
            <div className="flex mb-2">
              {dayHeaders.map((d) => (
                <div key={d.toISOString()} className="flex-1 text-center text-[10px] text-content-tertiary">
                  {d.getDate()}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              {rows.map(({ task, color, start, end }) => {
                const left = ((start.getTime() - rangeStart.getTime()) / MS_PER_DAY / totalDays) * 100;
                const width = Math.max(
                  (100 / totalDays) * 0.6,
                  ((end.getTime() - start.getTime()) / MS_PER_DAY / totalDays) * 100
                );
                return (
                  <div
                    key={task.id}
                    className="relative h-6 rounded"
                    style={{
                      backgroundImage:
                        `repeating-linear-gradient(90deg, var(--color-border-subtle) 0, var(--color-border-subtle) 1px, transparent 1px, transparent calc(100% / ${totalDays}))`,
                    }}
                  >
                    <button
                      onClick={() => onOpenTask(task.id)}
                      className="absolute top-0.5 h-5 rounded-md flex items-center px-2 text-[10px] text-content-inverse truncate"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color ?? 'var(--color-interactive-primary)' }}
                      title={task.title}
                    >
                      {task.subtaskTotal > 0 ? `${task.subtaskDone}/${task.subtaskTotal}` : ''}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
            Unscheduled
          </h3>
          <div className="flex flex-col gap-1">
            {unscheduled.map((task) => (
              <button
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="text-left text-sm text-content-primary hover:text-interactive-primary truncate"
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
