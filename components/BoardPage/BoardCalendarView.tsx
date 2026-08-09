// components/BoardPage/BoardCalendarView.tsx
// Month grid keyed off each task's dueDate; chip color = the task's column
// color. Tasks with no dueDate are not plotted (matches the mockup, which
// only shows dated items on the calendar).
'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMonthRange } from '@/lib/shared/date-utils';
import type { BoardDto, BoardTaskDto } from '@/types/planner';

interface BoardCalendarViewProps {
  board: BoardDto;
  onOpenTask: (taskId: string) => void;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(anchor: Date): DayCell[] {
  const { start, end } = getMonthRange(anchor);
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const today = new Date();
  const days: DayCell[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push({
      date: new Date(cursor),
      inMonth: cursor.getMonth() === anchor.getMonth(),
      isToday: cursor.toDateString() === today.toDateString(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function BoardCalendarView({ board, onOpenTask }: BoardCalendarViewProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const days = useMemo(() => buildGrid(anchor), [anchor]);

  const colorByTaskId = useMemo(() => {
    const map = new Map<string, string | null>();
    board.groups.forEach((group) => {
      group.taskItems.forEach((task) => map.set(task.id, group.color));
    });
    return map;
  }, [board]);

  const tasksWithDueDate: BoardTaskDto[] = useMemo(
    () => board.groups.flatMap((g) => g.taskItems).filter((t) => t.dueDate),
    [board]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-sm font-medium text-content-primary min-w-32 text-center">
          {anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          <ChevronRight size={14} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => setAnchor(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-[11px] text-content-tertiary text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
        {days.map((day) => {
          const dayTasks = tasksWithDueDate.filter((t) => sameDay(new Date(t.dueDate!), day.date));
          return (
            <div
              key={day.date.toISOString()}
              className={[
                'rounded-md border border-border-subtle p-1.5 flex flex-col gap-1 overflow-y-auto min-h-20',
                day.inMonth ? 'bg-surface-primary' : 'bg-surface-secondary/50',
              ].join(' ')}
            >
              <span
                className={[
                  'text-[11px]',
                  day.isToday
                    ? 'font-bold text-interactive-primary'
                    : day.inMonth
                      ? 'text-content-secondary'
                      : 'text-content-tertiary',
                ].join(' ')}
              >
                {day.date.getDate()}
              </span>
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="text-left text-[10px] leading-tight text-content-inverse rounded px-1.5 py-0.5 truncate"
                  style={{ backgroundColor: colorByTaskId.get(task.id) ?? 'var(--color-interactive-primary)' }}
                  title={task.title}
                >
                  {task.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
