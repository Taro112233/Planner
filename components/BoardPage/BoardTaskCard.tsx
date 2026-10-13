// components/BoardPage/BoardTaskCard.tsx
// Draggable card rendered inside a BoardColumn's SortableContext. Laid out as
// in the mockup: badge + priority dot, title, checklist, then one footer row of
// progress bar, count, due date and assignee.
'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PRIORITY_DOT_COLORS, PRIORITY_LABELS } from '@/components/TaskDetail/priorityStyles';
import { initials } from '@/components/TaskDetail/subtaskAttribution';
import { BoardCardChecklist } from './BoardCardChecklist';
import type { BoardTaskDto } from '@/types/planner';

interface BoardTaskCardProps {
  task: BoardTaskDto;
  onOpen: (taskId: string) => void;
  /** Omitted by the drag overlay, which is a static preview. */
  onToggleSubtask?: (taskId: string, subtaskId: string, desiredIsDone: boolean) => void;
  /** Static preview rendered inside a DragOverlay — skips sortable wiring. */
  overlay?: boolean;
  /** While a filter or sort is showing, the visible order is not the stored one. */
  dragDisabled?: boolean;
}

export function BoardTaskCard({
  task,
  onOpen,
  onToggleSubtask,
  overlay = false,
  dragDisabled = false,
}: BoardTaskCardProps) {
  const sortable = useSortable({
    id: task.id,
    disabled: overlay || dragDisabled,
    // Lets the board's collision detection prefer a card over the column
    // droppable underneath it (see BoardPage).
    data: { type: 'card', groupId: task.groupId },
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const pct = task.subtaskTotal > 0 ? Math.round((task.subtaskDone / task.subtaskTotal) * 100) : 0;
  const overdue = task.dueDate !== null && new Date(task.dueDate).getTime() < Date.now();
  const badge = task.badges[0];

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => !overlay && onOpen(task.id)}
      className={[
        'wcard flex flex-col gap-[9px] p-[13px]',
        'transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-elevation-2',
        overlay
          ? 'rotate-2 shadow-elevation-3'
          : dragDisabled
            ? 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <div className="flex items-center gap-[7px]">
        {badge && (
          <span
            className="rounded-full bg-surface-tertiary px-[9px] py-0.5 text-[11px] font-semibold text-content-secondary"
            style={
              badge.color
                ? {
                    backgroundColor: `color-mix(in oklch, ${badge.color} 14%, transparent)`,
                    color: badge.color,
                  }
                : undefined
            }
          >
            {badge.name}
          </span>
        )}
        <span
          className="ml-auto flex items-center gap-1 text-[11px]"
          style={{ color: PRIORITY_DOT_COLORS[task.priority] }}
        >
          <span
            className="size-[7px] rounded-full"
            style={{ backgroundColor: PRIORITY_DOT_COLORS[task.priority] }}
          />
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <p className="line-clamp-3 text-[14.5px] font-semibold leading-snug tracking-[-0.005em] text-content-primary">
        {task.title}
      </p>

      {/* The mockup puts the checklist itself on the card, not just a counter,
          and lets you tick it there. */}
      <BoardCardChecklist
        subtasks={task.subtasks}
        onToggle={
          onToggleSubtask
            ? (subtaskId, desiredIsDone) => onToggleSubtask(task.id, subtaskId, desiredIsDone)
            : undefined
        }
      />

      <div className="mt-0.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
          <div
            className="h-full rounded-full bg-interactive-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {task.subtaskTotal > 0 && (
          <span className="whitespace-nowrap text-[11px] tabular-nums text-content-tertiary">
            {task.subtaskDone}/{task.subtaskTotal}
          </span>
        )}
        {task.dueDate && (
          <span
            className={`whitespace-nowrap text-[11px] ${overdue ? 'text-content-danger' : 'text-content-tertiary'}`}
          >
            {new Date(task.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.assignees[0] && (
          <Avatar className="size-[22px] shrink-0" title={task.assignees[0].name}>
            {task.assignees[0].avatarUrl && (
              <AvatarImage src={task.assignees[0].avatarUrl} alt={task.assignees[0].name} />
            )}
            <AvatarFallback className="text-[10px]">{initials(task.assignees[0].name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
